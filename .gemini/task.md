# Implementation Task: Align Project with Technical Specification

## Overview
Refactor the Khushboo Scholar Learning & Engagement Dashboard to match the technical specification document.

## Phase 1: Backend Refactoring ✅ COMPLETE
- [x] Create modular folder structure (middleware/, routes/)
- [x] Extract middleware from index.js
  - Created `server/src/middleware/auth.middleware.js`
  - Created `server/src/middleware/role.middleware.js`
- [x] Extract routes into separate files
  - Created `server/src/routes/auth.routes.js`
  - Created `server/src/routes/users.routes.js`
  - Created `server/src/routes/resources.routes.js`
  - Created `server/src/routes/sessions.routes.js`
  - Created `server/src/routes/mentorship.routes.js`
  - Created `server/src/routes/forum.routes.js`
  - Created `server/src/routes/admin.routes.js`
  - Created `server/src/routes/chat.routes.js`
- [x] Update index.js to use modular imports (reduced from 1365 lines to ~300 lines)

## Phase 2: Frontend - API Layer ✅ COMPLETE
- [x] Create `api/axios.js` base configuration
- [x] Create `api/auth.api.js`
- [x] Create `api/user.api.js`
- [x] Create `api/resources.api.js`
- [x] Create `api/sessions.api.js`
- [x] Create `api/forum.api.js`
- [x] Create `api/admin.api.js`
- [x] Create `api/mentorship.api.js`
- [x] Update `api/index.js` to re-export all APIs

## Phase 3: Frontend - Missing Pages ✅ COMPLETE
### Mentor Pages
- [x] Create `UploadResource.jsx`
- [x] Create `AttendanceUpload.jsx`
- [x] Create `Meetings.jsx`
- [x] Create `MentorPages.css`

### Admin Pages
- [x] Create `Users.jsx`
- [x] Create `Announcements.jsx`
- [x] Create `Reports.jsx`
- [x] Create `AdminPages.css`

## Phase 4: Restore Authentication ✅ COMPLETE
- [x] Fix Login files import paths (moved to Login/)
- [x] Restore AuthContext.jsx with proper JWT auth
- [x] Update App.jsx routes with all new pages
- [x] Add mentor and admin nested routes

## New Project Structure

```
server/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.js (refactored entry point)
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   └── routes/
│       ├── auth.routes.js
│       ├── users.routes.js
│       ├── resources.routes.js
│       ├── sessions.routes.js
│       ├── mentorship.routes.js
│       ├── forum.routes.js
│       ├── admin.routes.js
│       └── chat.routes.js
├── .env
└── package.json

client/src/
├── api/
│   ├── axios.js (base config)
│   ├── auth.api.js
│   ├── user.api.js
│   ├── resources.api.js
│   ├── sessions.api.js
│   ├── forum.api.js
│   ├── admin.api.js
│   ├── mentorship.api.js
│   └── index.js (re-exports)
├── Login/
│   ├── Login.jsx
│   ├── RoleSelection.jsx
│   └── Auth.css
├── context/
│   └── AuthContext.jsx
├── pages/
│   ├── student/ (existing)
│   ├── mentor/
│   │   ├── Dashboard.jsx (existing)
│   │   ├── UploadResource.jsx
│   │   ├── Meetings.jsx
│   │   ├── AttendanceUpload.jsx
│   │   └── MentorPages.css
│   └── admin/
│       ├── Dashboard.jsx (existing)
│       ├── Users.jsx
│       ├── Announcements.jsx
│       ├── Reports.jsx
│       └── AdminPages.css
├── App.jsx
├── main.jsx
└── index.css
```

## Available Routes

### Authentication
- `/login` - Login page
- `/register` - Registration with role selection

### Student Routes (under `/student`)
- `/student` - Student Dashboard
- `/student/courses` - Course catalog
- `/student/courses/:courseId` - Course player
- `/student/mentor` - Mentor program
- `/student/forum` - Q&A Forum

### Mentor Routes (under `/mentor`)
- `/mentor` - Mentor Dashboard
- `/mentor/upload` - Upload learning resources
- `/mentor/meetings` - Manage meetings with mentees
- `/mentor/attendance` - Upload offline attendance (CSV)

### Admin Routes (under `/admin`)
- `/admin` - Admin Dashboard
- `/admin/users` - User management
- `/admin/announcements` - Manage announcements
- `/admin/reports` - Analytics & reports

## Status: COMPLETE ✅
All tasks have been implemented. Next steps:
1. Restart both servers to apply changes
2. Test all routes and functionality
3. Verify authentication flow
