# Phase 1: Root Cause Analysis

## Executive Summary

This document identifies all crash points, failure modes, and architectural issues causing:
- Random automatic logouts
- Pages crashing unexpectedly
- Missing/inconsistent error handling
- Weak edge-case coverage

---

## 1. AUTHENTICATION & AUTO-LOGOUT (Critical)

### 1.1 AuthContext `initAuth` — Logout on ANY Error
**File:** `client/src/context/AuthContext.jsx` (lines 62–67)

```js
try {
    const response = await axios.get(`${API_URL}/users/me`);
    setUser(response.data);
} catch (error) {
    console.error('Auth init error:', error);
    logout();  // ⚠️ BUG: Logout on ANY error
}
```

**Problem:** Logout is triggered on:
- Network errors (ECONNREFUSED, timeout, offline)
- Backend 500 errors
- CORS errors
- Any non-401/403 failure

**Correct behavior:** Only logout on 401 (unauthorized) or confirmed invalid token.

---

### 1.2 API Interceptor — Treats 401 and 403 Identically
**File:** `client/src/api/index.js` (lines 25–41)

```js
if (error.response?.status === 401 || error.response.status === 403) {
    // Token is expired or invalid — force logout
    localStorage.removeItem('token');
    window.location.href = '/login';
}
```

**Problems:**
- Backend returns **403** for both "Invalid token" and "Access denied. Insufficient permissions"
- Logout on "Insufficient permissions" is wrong — user is authenticated, just lacks permission
- Uses `window.location.href` — full page reload, no AuthContext sync
- Does not call AuthContext.logout() — state desync
- Components using global `axios` (AuthContext) vs `api` instance have different behavior

---

### 1.3 Dual Axios Instances — State Desync
- **AuthContext** uses global `axios` directly (login, register, initAuth, updateProfile)
- **api/index.js** creates separate `api = axios.create(...)` instance
- API interceptor only affects `api` instance
- AuthContext sets `axios.defaults.headers` but `api` reads from localStorage in request interceptor
- When api interceptor triggers logout: clears localStorage, redirects — but AuthContext state not updated until page reload

---

### 1.4 `userAPI.getMe()` Does Not Exist
**File:** `client/src/pages/auth/Login.jsx` (line 33)

```js
const response = await userAPI.getMe();
```

**Problem:** userAPI has `getProfile`, not `getMe`. Google login will throw `TypeError: userAPI.getMe is not a function`.

---

### 1.5 Where Logout Is Triggered
| Location | Trigger | Correct? |
|----------|---------|----------|
| AuthContext initAuth catch | Any error from /users/me | ❌ No |
| api interceptor | 401 or 403 | ❌ Partial (403 for permissions) |
| AuthContext storage event | Token removed in another tab | ✅ Yes |
| Navbar/Dashboard buttons | User clicks logout | ✅ Yes |

---

## 2. NULL/UNDEFINED & CRASH POINTS

### 2.1 Unprotected Dynamic Data
- `user?.role` in ProtectedRoute — OK with optional chaining
- `response.data` used without null checks in many components
- `dashboardData.stats`, `announcements` — some use defaults, others don't
- Avatar fallbacks: `user?.avatar || '...'` — OK
- `stats?.badgesCount` — OK in StudentDashboard

### 2.2 Potential Null Crashes
- Components assuming `response.data` structure without validation
- Forum: `posts.map`, `answers.map` — no guard for null/undefined arrays
- MessagingPage: `groups`, `conversations` — `.catch` returns `{ data: [] }` but structure may vary
- CoursePlayer: `course?.id`, `course?.title` — partial guards

### 2.3 Missing Optional Chaining
- Many `err.response?.data?.error` — OK
- Some `response.data` without `response?.data`

---

## 3. RACE CONDITIONS

### 3.1 Auth Init
- `initRan.current` prevents double run — OK
- But if two tabs open simultaneously, both may run initAuth before either sets initRan

### 3.2 Multiple API Calls
- No request deduplication
- No AbortController for component unmount — setState on unmounted component risk
- Concurrent 401s could trigger multiple redirects

### 3.3 Socket + Auth
- Socket created when `user?.id` — if user changes rapidly, multiple sockets possible (cleanup exists)

---

## 4. STATE RESET & RE-RENDER ISSUES

### 4.1 MessagingPage useEffect
```js
useEffect(() => {
    fetchData();
    socket.on('message:new', handleNewMessage);
    return () => { socket.off(...); };
}, []);  // fetchData, handleNewMessage not in deps — stale closure risk
```

### 4.2 StudentAssignmentSection
- `handleAutoSubmit` in useEffect deps — if not memoized, could cause re-runs

### 4.3 AuthContext
- `logout` in storage handler references `socket` — dependency on socket; if socket changes, new handler registered

---

## 5. INFINITE RE-RENDER RISKS

- CountUp component: `value` in deps — OK
- Most useEffects have `[]` or stable deps — low risk
- MessagingPage: `fetchData` defined in component, used in useEffect with `[]` — fetchData recreated each render, but effect runs once; no infinite loop
- Forum: `batchId` in deps — OK

---

## 6. BACKEND ISSUES

### 6.1 Inconsistent Error Format
- Some: `{ error: "string" }`
- Error middleware: `{ success: false, message: "...", error: ... }`
- Zod/Prisma: different shapes
- No standard `{ success, error: { code, message, details } }`

### 6.2 No Async Wrapper
- Controllers use try/catch but no global async wrapper
- Unhandled rejections could crash the process

### 6.3 401 vs 403 Semantics
- 401: No token, invalid credentials
- 403: Invalid JWT OR insufficient permissions — conflated
- Recommendation: Use 401 for auth failures, 403 only for "authenticated but forbidden"

### 6.4 JWT Errors
- `jwt.verify` throws — caught, returns 403 with "Invalid token"
- No distinction between expired vs malformed

---

## 7. FRONTEND API PATTERNS

### 7.1 No Global Error Toaster
- Each component handles errors locally (setError, alert, console.error)
- No centralized user feedback for API failures

### 7.2 No Retry Mechanism
- React Query has retry: 1 — minimal
- No exponential backoff for transient failures

### 7.3 No AbortController
- All API calls lack AbortController
- Component unmount during fetch → potential setState on unmounted component

---

## 8. FORM & VALIDATION

### 8.1 Frontend
- Login: required fields, no trim, no length limits
- Forms: inconsistent validation
- No double-submit prevention (disabled during loading — some have it, some don't)

### 8.2 Backend
- Some Zod validation (mentor routes)
- Most routes: manual checks, no schema validation
- No global request body validation

---

## 9. ERROR BOUNDARY & FALLBACKS

### 9.1 ErrorBoundary
- Single ErrorBoundary wraps AppRoutes
- AuthProvider is outside ErrorBoundary — if AuthProvider throws, no catch
- ErrorBoundary order: Router > AuthProvider > ErrorBoundary > AppRoutes
- Fallback UI exists — OK

### 9.2 Loading States
- Most pages have loading — some use skeletons
- No global loading overlay for API calls
- Some buttons disabled during submit — inconsistent

---

## 10. PRODUCTION READINESS

- Rate limiting: ✅ Present
- Helmet: ✅ Present
- CORS: ✅ Configured
- Request size limit: ✅ 2MB
- Graceful shutdown: ❌ Not implemented
- Health check: ❌ No /health
- Structured logging: ❌ console.error only
- Stack traces in production: error middleware conditionally exposes stack

---

## Summary of Critical Fixes — IMPLEMENTED

| # | Fix | Status |
|---|-----|--------|
| 1 | AuthContext initAuth: Only logout on 401 | ✅ Done |
| 2 | API interceptor: Only logout on 401 (never 403/500/network) | ✅ Done |
| 3 | Unify api usage, wire logout via setAuthFailureCallback | ✅ Done |
| 4 | userAPI.getMe: Added as alias for getProfile | ✅ Done |
| 5 | Backend: authenticateToken returns 401 for invalid JWT | ✅ Done |
| 6 | getApiErrorMessage for consistent error display | ✅ Done |
| 7 | ErrorBoundary wraps AuthProvider | ✅ Done |
| 8 | Health check /api/health | ✅ Done |
| 9 | Graceful shutdown (SIGTERM/SIGINT) | ✅ Done |
| 10 | Unhandled rejection handler in main.jsx | ✅ Done |
