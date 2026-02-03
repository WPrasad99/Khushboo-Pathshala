# Batch-Based Student Management & Mentor Assignment
## Implementation Plan

**Created:** 2026-02-01  
**Status:** ✅ Implementation Complete  
**Priority:** High

---

## Overview

This document outlines the implementation plan for introducing a **Batch** as a first-class entity that:
- Acts as a logical container for students
- Serves as the unit of mentor assignment
- Controls login eligibility for students
- Provides the primary boundary for progress tracking

---

## ✅ COMPLETED CHANGES

### Phase 1: Database Schema Changes - COMPLETE

#### 1.1 Batch Model Added
**File:** `server/prisma/schema.prisma`

New `Batch` model with:
- `id` (UUID, primary key)
- `name` (String, e.g., "Khushboo Batch 2024 – Phase 1")
- `description` (Optional)
- `isActive` (Boolean - controls student login eligibility)
- `mentorId` (FK → User.id, required)
- `createdById` (FK → User.id, Admin who created)
- `createdAt`, `updatedAt` (timestamps)

#### 1.2 User Model Updated
- Added `batchId` (FK → Batch.id, nullable)
- Added `batch` relation for students
- Added `mentoredBatches` relation for mentors
- Added `createdBatches` relation for admins
- Added index on `batchId`

#### 1.3 Migration Created
Run: `npx prisma migrate dev --name add_batch_model`

---

### Phase 2: Backend API Development - COMPLETE

#### 2.1 Batch Routes
**File:** `server/src/routes/batch.routes.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/batches/admin` | Create new batch with mentor assignment |
| GET | `/api/batches/admin` | List all batches with mentor info & student counts |
| GET | `/api/batches/admin/:id` | Get single batch details with students |
| PUT | `/api/batches/admin/:id` | Update batch (reassign mentor, toggle active) |
| DELETE | `/api/batches/admin/:id` | Delete batch (only if no students) |
| GET | `/api/batches/mentor` | Get mentor's assigned batches |
| GET | `/api/batches/mentor/students` | Get students from mentor's batches with metrics |
| GET | `/api/batches/mentor/reports` | Batch-level progress reports |

#### 2.2 Student Admin Routes
**File:** `server/src/routes/studentAdmin.routes.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students/admin` | List all students with batch info |
| GET | `/api/students/admin/:id` | Get single student details |
| POST | `/api/students/admin` | Create student with batch assignment |
| POST | `/api/students/admin/bulk` | Bulk create students |
| PUT | `/api/students/admin/:id` | Update student (change batch) |
| PUT | `/api/students/admin/:id/reset-password` | Reset student password |
| DELETE | `/api/students/admin/:id` | Delete student |
| GET | `/api/students/admin/unassigned` | Get unassigned students |
| PUT | `/api/students/admin/assign-batch` | Bulk assign students to batch |

#### 2.4 Admin Routes Updated
**File:** `server/src/routes/admin.routes.js`
- Added `GET /api/admin/mentors` for obtaining a list of mentors (used in Batch creation).

#### 2.3 Authentication Updated
**File:** `server/src/routes/auth.routes.js`

Login now checks:
1. If user is STUDENT → verify batch exists
2. If batch exists → verify `batch.isActive === true`
3. Returns descriptive error messages:
   - `NO_BATCH_ASSIGNED`: Student has no batch
   - `BATCH_INACTIVE`: Student's batch is deactivated

---

### Phase 3: Frontend - Admin UI - COMPLETE

#### 3.1 Batches Management Page
**File:** `client/src/pages/admin/Batches.jsx`

Features:
- View all batches in card layout
- Create new batch with modal form
- Edit batch (name, description, mentor, status)
- Toggle batch active/inactive
- Delete batch (only if empty)
- Summary statistics

#### 3.2 Students Management Page
**File:** `client/src/pages/admin/StudentsManagement.jsx`

Features:
- View all students in table format
- Filter by batch
- Search by name/email
- Create single student with batch assignment
- Bulk import students (CSV format)
- Edit student details
- Reset student password
- Delete student
- Shows login eligibility based on batch status

#### 3.3 API Modules
- **File:** `client/src/api/batch.api.js` - Batch API calls
- **File:** `client/src/api/studentAdmin.api.js` - Student admin API calls
- **Updated:** `client/src/api/index.js` - Exports new APIs

#### 3.4 Navigation Updated
**File:** `client/src/components/layout/AdminLayout.jsx`
- Added "Batches" navigation link
- Added "Students" navigation link
- Renamed "Users" to "All Users"

#### 3.5 Routes Added
**File:** `client/src/App.jsx`
- `/admin/batches` → Batches page
- `/admin/students` → Students page

#### 3.6 Styles Added
**File:** `client/src/pages/admin/AdminPages.css`
- Batch card styles
- Data table styles
- Modal form styles
- Filter bar styles
- Alert styles
- Status badges

---

### Phase 4: Seed Data Updated - COMPLETE

**File:** `server/prisma/seed.js`

- Creates **5 Mentors**:
  - Rakesh Sinha, Priya Sharma, Amit Kumar, Sunita Desai, Vikram Joshi
- Creates **3 Batches**:
  - Phase 1 (Rakesh), Phase 2 (Priya), Phase 3 (Amit)
- Creates **5 Students**:
  - Prasad, Anita (Phase 1)
  - Vishal, Neha (Phase 2)
  - Rohit (Phase 3)
- Assigns existing students to batches
- Creates demo users (student@demo.com, mentor@demo.com, admin@demo.com)
- Demo student is assigned to Phase 1 batch

---

## How to Run

### 1. Apply Database Migration
```bash
cd server
npx prisma migrate dev
```

### 2. Regenerate Prisma Client
```bash
npx prisma generate
```

### 3. Seed the Database (Optional - resets data)
```bash
npx prisma db seed
```

### 4. Start the Server
```bash
npm run dev
```

### 5. Start the Client
```bash
cd ../client
npm run dev
```

---

## Test Scenarios

### Admin Testing
1. Login as admin@demo.com / password123
2. Navigate to "Batches" → Create a new batch
3. Navigate to "Students" → Create a student and assign to batch
4. Deactivate a batch → Student should not be able to login

### Mentor Testing
1. Login as mentor@demo.com / password123
2. Use the batch APIs to see only assigned students

### Student Testing
1. Login as student@demo.com / password123
2. If batch is active → Login succeeds
3. If batch is inactive → Login denied with message

---

## File Summary

### New Files Created
| File | Description |
|------|-------------|
| `server/src/routes/batch.routes.js` | Batch CRUD + Mentor scoped APIs |
| `server/src/routes/studentAdmin.routes.js` | Admin student management APIs |
| `client/src/api/batch.api.js` | Batch API client |
| `client/src/api/studentAdmin.api.js` | Student admin API client |
| `client/src/pages/admin/Batches.jsx` | Batch management UI |
| `client/src/pages/admin/StudentsManagement.jsx` | Student management UI |

### Modified Files
| File | Changes |
|------|---------|
| `server/prisma/schema.prisma` | Added Batch model, updated User model |
| `server/src/index.js` | Registered new routes |
| `server/src/routes/auth.routes.js` | Added batch check for student login |
| `server/prisma/seed.js` | Added batches and batch assignments |
| `client/src/App.jsx` | Added new admin routes |
| `client/src/api/index.js` | Exported new APIs |
| `client/src/components/layout/AdminLayout.jsx` | Added navigation links |
| `client/src/pages/admin/AdminPages.css` | Added new styles |

---

## Security Features

✅ No student self-registration  
✅ Admin-only batch control  
✅ Mentor access strictly scoped to assigned batches  
✅ Students cannot login without active batch  
✅ Batch deletion prevented if students exist  
✅ Password auto-generation for new students  

---

## Notes

- All existing student functionality remains unchanged
- Students have no visibility into batch mechanics
- Mentor reassignment preserves batch history
- All progress data is preserved when students change batches
