# Frontend Components Missing Backend Integration

Based on a comprehensive architectural audit comparing the frontend implementation (React + charts + Socket.IO) against the existing backend endpoints defined in `server/src/index.js`, the following frontend modules are either:

• Completely disconnected from real backend data
• Partially integrated but missing structured payloads
• Dependent on simulated / computed mock data
• Lacking persistence-layer support
• Missing schema-level modeling

This document outlines each gap in deep technical detail, including architectural impact and required backend enhancements.

---

## 1. Advanced Batch Analytics & Visualizations

**Frontend Locations**

* `client/src/pages/mentor/Dashboard.jsx`
* `client/src/pages/admin/Dashboard.jsx`

### Current Frontend Behavior

The dashboards include advanced visualizations:

* Attendance Trend (Time-series Line Chart)
* Submission Rate (Bar Chart)
* Batch Comparison (Donut / Pie Chart)
* Active Students Distribution
* Performance Overview Metrics

These components expect:

* Aggregated counts
* Time-bucketed data (daily/weekly/monthly)
* Percentage distributions
* Comparative analytics across batches

However, the frontend currently:

* Generates random distributions
* Uses derived mock math logic
* Calculates percentages locally
* Simulates chart datasets using student count arrays

Example of frontend-side fabrication:

* Random attendance trends computed using `Math.random()` based on total student count
* Artificial batch comparison percentages
* Static dataset templates with injected numbers

---

### Missing Backend Support

Existing endpoints:

* `GET /api/admin/reports`
* `GET /api/mentor/meetings`

Problems:

1. No time-series attendance aggregation
2. No submission rate grouped by batch
3. No historical trend data (date-indexed)
4. No batch comparison endpoint
5. No pre-aggregated analytics response format

Backend currently returns:

* Raw records
* Flat data lists
* No grouped summaries
* No statistical transformations

---

### Required Backend Enhancements

To fully support these dashboards, backend must:

1. Implement aggregation queries using:

   * GROUP BY date
   * GROUP BY batchId
   * COUNT DISTINCT studentId
   * AVG performance scores
   * SUM submission counts

2. Create dedicated analytics endpoints:

   * `GET /api/admin/analytics/attendance-trend`
   * `GET /api/admin/analytics/submission-rate`
   * `GET /api/admin/analytics/batch-comparison`
   * `GET /api/mentor/analytics/:batchId`

3. Return structured chart-ready payload:

   Example:
   ```json
   {
     "labels": ["Jan 1", "Jan 2", "Jan 3"],
     "datasets": [
       {
         "label": "Attendance",
         "data": [45, 52, 48]
       }
     ]
   }
   ```

4. Optimize with:

   * Indexed timestamp fields
   * Cached aggregation layers
   * Scheduled nightly aggregation jobs (optional)

---

## 2. Granular Learning Course Tracking

**Frontend Locations**

* `client/src/pages/student/Courses.jsx`
* `client/src/pages/student/Dashboard.jsx`

---

### Current Frontend Behavior

The student portal shows:

* Progress bars per course
* Completed checkmarks
* Structured modules
* Course vs Session vs Resource distinction
* Completion percentage display
* Sequential unlocking logic

The frontend assumes existence of:

* Structured Course entity
* Modules array
* Lesson ordering
* Progress percentage field
* Completion timestamps

---

### Backend Limitation

Backend currently tracks:

* `ResourceUsage`
* Basic resource interactions

Missing:

1. Dedicated `Course` schema
2. Module-level structure
3. Lesson sequencing
4. Quiz-to-course mapping
5. Completion percentage calculation
6. Persistent progress tracking per course

Frontend therefore:

* Estimates progress
* Leaves completion empty
* Uses fallback values
* Lacks consistency across sessions

---

### Required Backend Improvements

1. Introduce normalized schema:

   **Course**

   * id
   * title
   * description
   * batchId

   **Module**

   * id
   * courseId
   * title
   * orderIndex

   **Lesson**

   * id
   * moduleId
   * type (video/pdf/quiz)
   * orderIndex

   **CourseProgress**

   * studentId
   * courseId
   * completedLessons
   * completionPercentage
   * lastAccessed

2. Add endpoints:

   * `GET /api/student/courses`
   * `GET /api/student/courses/:id`
   * `PATCH /api/student/courses/:id/progress`
   * `GET /api/student/courses/:id/progress`

3. Move completionPercentage calculation to backend for consistency.

---

## 3. Login Heatmap & Streak Tracking

**Frontend Locations**

* `client/src/pages/student/ActivityHeatmap.jsx`
* `client/src/pages/student/Dashboard.jsx`

---

### Current UI Features

* 30-day active counter
* GitHub-style heatmap
* Login streak tracking
* Continuous activity graph

---

### Backend Issue

Migration removed:

* `LoginLog` table (`20260130171823_add_login_log`)

As a result:

* Login history is not persisted
* No reliable loginDates array
* Streak logic cannot function
* `/api/student/dashboard` lacks daily login history

Frontend attempts to:

* Derive activity from limited data
* Use inconsistent local arrays
* Approximate streak values

---

### Required Backend Restoration

1. Reinstate LoginLog schema:

   **LoginLog**

   * id
   * studentId
   * loginTimestamp

2. Record login on authentication middleware.

3. Provide endpoint:

   * `GET /api/student/activity`

   Return format:
   ```json
   {
     "loginDates": ["2026-02-01", "2026-02-03"],
     "activeDays30": 12,
     "currentStreak": 4
   }
   ```

4. Optimize with:

   * Indexed timestamp
   * Streak computation server-side

---

## 4. Notifications (Mark as Read / Clear All)

**Frontend Locations**

* `client/src/pages/admin/Dashboard.jsx`
* `client/src/pages/mentor/Dashboard.jsx`

---

### Current Behavior

* Real-time notifications via Socket.IO
* Notification dropdown
* "Clear All" button
* Unread counter badge

Frontend currently:

* Sets unreadNotifications = 0 locally
* Hides notifications without persistence update

---

### Missing Backend Capabilities

Existing:

* `GET /api/notifications`
* Socket emission

Missing:

* `PUT /api/notifications/read-all`
* `PUT /api/notifications/:id/read`
* `DELETE /api/notifications/clear`

Without these:

* State resets on refresh
* No persistent read flag
* Inconsistent unread counts

---

### Required Backend Additions

1. Notification schema fields:

   * isRead
   * readAt
   * userId

2. Add endpoints:

   * `PUT /api/notifications/read-all`
   * `PUT /api/notifications/:id/read`
   * `DELETE /api/notifications/clear`

3. Maintain transactional integrity for bulk updates.

---

## 5. Forum Upvoting & Threading Complexities

**Frontend Location**

* `client/src/api/index.js`
* Forum components

---

### Expected Frontend Capabilities

* Nested threaded replies
* Upvoting answers
* Sorting by popularity
* Accepted answer marking
* Upvote count display

---

### Backend Gaps

Backend currently supports:

* Basic post creation

Missing:

1. Upvote table (AnswerVotes)
2. Accepted answer flag
3. Popularity-based sorting query
4. Nested reply depth logic
5. Aggregated upvote counts
6. Optimistic concurrency handling

---

### Required Backend Enhancements

1. Add schemas:

   **Answer**

   * id
   * postId
   * parentAnswerId (for threading)
   * isAccepted

   **AnswerVote**

   * userId
   * answerId

2. Endpoints:

   * `POST /api/forum/answers/:answerId/upvote`
   * `DELETE /api/forum/answers/:answerId/upvote`
   * `PATCH /api/forum/answers/:id/accept`
   * `GET /api/forum/posts/:id?sort=popular`

3. Aggregate vote counts using:

   * COUNT(answerVotes)
   * Indexed joins

---

## 6. Advanced Quiz and Assignment Grading

**Frontend Location**

* `client/src/components/StudentAssignmentSection.jsx`

---

### Current Frontend Expectations

* File submission uploads
* Rubric-based grading
* Annotated mentor feedback
* Structured grading matrix
* Submission history tracking

---

### Backend Limitation

Existing:

* `POST /api/assignments/:id/submit`

Missing:

1. Submission-level grading schema
2. Mentor feedback structure
3. Rubric criteria storage
4. Annotation support
5. Grading endpoint

---

### Required Backend Architecture

1. Introduce schemas:

   **AssignmentSubmission**

   * id
   * assignmentId
   * studentId
   * fileUrl
   * submittedAt
   * grade
   * feedback
   * rubricBreakdown (JSON)

2. Add endpoint:

   * `POST /api/assignments/submissions/:id/grade`

3. Store structured grading format:
   ```json
   {
     "criteria": [
       { "name": "Logic", "score": 8, "max": 10 },
       { "name": "Presentation", "score": 9, "max": 10 }
     ],
     "overallScore": 17,
     "feedback": "Well structured solution."
   }
   ```

4. Implement role-based access checks.

---

# Final Technical Conclusion

The frontend is architecturally advanced and visually production-grade. However, the backend layer lacks:

* Aggregation logic
* Structured relational schemas
* Persistent analytics modeling
* Bulk mutation endpoints
* Historical activity tracking
* Advanced interaction modeling

To transition from a demo-ready system to a production-ready SaaS-grade platform, the backend must evolve into:

* Analytics-capable
* Schema-rich
* Aggregation-optimized
* State-consistent
* Fully persistent

Until these enhancements are implemented, the frontend will continue relying on mock data generation and local state simulation, creating long-term scalability and integrity risks.

---

End of Technical Gap Analysis Document.
