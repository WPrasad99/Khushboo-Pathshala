===============================================================================
                        🎓 KHUSHBOO PATHSHALA
                  Digital Learning & Engagement Platform
         Empowering students through technology-driven education and mentorship
===============================================================================

BADGES:
- Made with React 18
- Node.js 18+
- PostgreSQL 15
- Prisma ORM

===============================================================================
ABOUT
===============================================================================

Khushboo Pathshala is a comprehensive digital platform designed for the 
Cybage Khushboo Scholarship Program. It bridges the gap between students, 
mentors, and administrators through seamless collaboration, intelligent 
tracking, and engaging learning experiences.

KEY HIGHLIGHTS:
- Real-time learning tracking
- Smart auto-attendance
- Interactive mentorship
- Analytics-driven insights

===============================================================================
DASHBOARD FEATURES
===============================================================================

-------------------------------------------------------------------------------
👨‍🎓 STUDENT DASHBOARD
-------------------------------------------------------------------------------

📊 OVERVIEW & ANALYTICS:
- Personalized Dashboard - Welcome screen with daily activity summary
- Stats Cards - Real-time attendance %, completed courses, badges earned, active days
- Activity Heatmap - GitHub-style contribution graph tracking daily engagement
- Recent Activities Feed - Watch history, completed courses, placement updates
- Upcoming Sessions - Calendar view of scheduled mentor meetings
- Announcements Timeline - Latest updates and important notices

📚 LEARNING RESOURCES:
- Content Type Tabs - Separate views for Sessions, Resources, and Courses
- Video Sessions - Watch mentor-uploaded sessions with play tracking
- Downloadable Resources - Download study materials and documents
- Course Library - Browse and enroll in full courses with lessons
- Progress Tracking - Real-time completion percentage for each resource
- Smart Filters - Category-based filtering (Web Dev, DSA, Placement, Soft Skills)
- Batch-Specific Content - Only see resources assigned to your batch
- Auto-Attendance - Automatically marked when 80% video completion achieved

✍️ ASSIGNMENTS & ASSESSMENTS:
- Assignment Dashboard - View all assigned, pending, and completed tasks
- Submission Portal - Upload assignment files with GitHub/Drive links
- Deadline Tracking - Visual indicators for pending and overdue assignments
- Feedback System - View mentor feedback and grades
- Status Filters - Filter by assigned, submitted, or graded

👥 MENTORSHIP PROGRAM:
- Mentor Profile - View your assigned mentor's details and contact info
- Meeting Schedule - Upcoming and past one-on-one sessions
- Meeting History - Track all previous interactions
- Direct Communication - Message your mentor directly

💬 Q&A FORUM:
- Ask Questions - Post technical queries with markdown support
- Community Answers - Get responses from peers and mentors
- Upvote System - Best answers rise to the top
- Search & Filter - Find existing solutions quickly
- Topic Tags - Organize questions by categories

👤 PROFILE MANAGEMENT:
- Profile Customization - Update avatar, bio, and contact details
- Academic Info - College, branch, year, graduation date
- Social Links - LinkedIn, GitHub, portfolio URLs
- Batch Information - View assigned batches and mentors

-------------------------------------------------------------------------------
👨‍🏫 MENTOR DASHBOARD
-------------------------------------------------------------------------------

📊 OVERVIEW & INSIGHTS:
- Mentor Stats - Total mentees, scheduled meetings, uploaded resources
- Batch Overview - List of assigned batches with student counts
- Activity Metrics - Student engagement and attendance analytics
- Quick Actions - Fast access to upload, schedule, grade

👥 MENTEE MANAGEMENT:
- Batch-Wise View - Organized list of students by batch
- Student Profiles - Detailed view of each mentee's progress
- Attendance Tracking - Monitor individual and batch attendance
- Performance Analytics - Track assignment completion and grades
- Filter & Search - Find students quickly by name, batch, or performance

📚 CONTENT UPLOAD & MANAGEMENT:
- Session Upload - Add video sessions (YouTube links or video URLs)
- Resource Upload - Share downloadable materials (PDFs, docs, file URLs)
- Batch Assignment - Assign content to specific batches
- Content Library - View all uploaded sessions and resources
- Statistics Dashboard - See student completion rates per upload
- Delete/Edit - Manage uploaded content easily

📝 ASSIGNMENT MANAGEMENT:
- Create Assignments - Set tasks with deadlines and instructions
- Batch-Specific - Assign to specific batches or all students
- Submission Review - View and download student submissions
- Grading System - Provide grades and detailed feedback
- Status Tracking - Monitor submission progress
- Bulk Actions - Grade multiple submissions efficiently

📅 MEETING SCHEDULER:
- Schedule Meetings - Set up one-on-one or group sessions
- Calendar Integration - Visual calendar with all meetings
- Student Selection - Choose specific students or entire batch
- Meeting Links - Add Google Meet/Zoom links
- Reminders - Automated notifications for upcoming meetings
- Meeting History - Track all past interactions

📤 ATTENDANCE UPLOAD:
- CSV Import - Bulk upload offline session attendance
- Manual Entry - Mark attendance individually
- Date Tracking - Specify exact session dates
- Validation - Error checking for duplicate entries

-------------------------------------------------------------------------------
🔐 ADMIN DASHBOARD
-------------------------------------------------------------------------------

📊 ANALYTICS & REPORTS:
- Platform Stats - Total users, active students, mentors, resources
- Engagement Metrics - Daily/weekly/monthly activity trends
- Attendance Reports - Overall attendance percentages
- Course Completion - Track resource and course completion rates
- User Growth - Registration and activation trends
- Export Reports - Download data as CSV/PDF

👤 USER MANAGEMENT:
- User Directory - Complete list of all platform users
- Role Management - Assign/change user roles (Student, Mentor, Admin)
- User Profiles - View detailed user information
- Account Status - Activate/deactivate accounts
- Search & Filter - Find users by role, batch, status
- Bulk Actions - Mass role updates and operations

🏫 BATCH MANAGEMENT:
- Create Batches - Set up new student batches
- Batch Assignment - Assign students and mentors to batches
- Batch Analytics - Performance metrics per batch
- Active/Archive - Mark batches as active, inactive, or completed
- Batch Details - View all students and mentors in each batch

📢 ANNOUNCEMENTS:
- Create Announcements - Platform-wide or batch-specific notices
- Rich Text Editor - Format announcements with markdown
- Scheduling - Schedule announcements for future dates
- Priority Levels - Mark urgent/important notices
- Edit/Delete - Manage all announcements

📚 RESOURCE MANAGEMENT:
- Content Library - View all platform resources
- Approve/Reject - Review mentor-uploaded content
- Global Resources - Create resources visible to all
- Analytics - Track resource usage and engagement
- Categorization - Organize by category and type

⚙️ SYSTEM SETTINGS:
- Platform Configuration - Customize platform settings
- Email Templates - Manage notification templates
- Feature Toggles - Enable/disable features
- Backup & Restore - Database management tools
- Audit Logs - Track all admin actions

===============================================================================
TECH STACK
===============================================================================

FRONTEND:
- React 18 - UI library with hooks and context
- Framer Motion - Smooth animations and transitions
- React Router - Client-side routing
- Axios - HTTP client for API calls
- React Icons - Icon library
- CSS3 - Modern styling with gradients and glassmorphism

BACKEND:
- Node.js 18+ - JavaScript runtime
- Express.js - Web framework
- JWT - Authentication and authorization
- Multer - File upload handling
- bcrypt - Password hashing

DATABASE:
- PostgreSQL 15 - Relational database
- Prisma ORM - Type-safe database client
- Supabase - Database hosting

DEPLOYMENT:
- Render - Application hosting
- Supabase - Database hosting
- GitHub - Version control

===============================================================================
GETTING STARTED
===============================================================================

PREREQUISITES:
✅ Node.js 18 or higher
✅ PostgreSQL 15 or higher
✅ Git
✅ npm or yarn

INSTALLATION STEPS:

1️⃣ CLONE THE REPOSITORY
   git clone <repository-url>
   cd Khushboo-Pathshala

2️⃣ DATABASE SETUP
   Create a PostgreSQL database:
   CREATE DATABASE khushboo_pathshala;

3️⃣ ENVIRONMENT CONFIGURATION
   Create server/.env:
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/khushboo_pathshala?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=5000

4️⃣ INSTALL DEPENDENCIES
   # Backend
   cd server
   npm install
   npx prisma migrate dev --name init
   npm run seed
   
   # Frontend
   cd ../client
   npm install

5️⃣ START DEVELOPMENT SERVERS
   Backend (Terminal 1):
   cd server
   npm run dev
   
   Frontend (Terminal 2):
   cd client
   npm run dev

6️⃣ ACCESS THE APPLICATION
   Frontend: http://localhost:5173
   Backend API: http://localhost:5000

===============================================================================
DEMO CREDENTIALS
===============================================================================

Role      | Email                    | Password     | Access Level
----------|--------------------------|--------------|--------------------
Student   | prasad@example.com      | password123  | Student Dashboard
Mentor    | rakesh.sinha@cybage.com | password123  | Mentor Dashboard
Admin     | admin@cybage.com        | c            | Admin Dashboard

===============================================================================
PROJECT STRUCTURE
===============================================================================

Khushboo-Pathshala/
│
├── client/                      # React Frontend
│   ├── src/
│   │   ├── api/                # API service layer (axios)
│   │   ├── context/            # React Context (AuthContext)
│   │   ├── components/         # Reusable components
│   │   ├── pages/
│   │   │   ├── auth/          # Login, Register, Profile
│   │   │   ├── student/       # Student dashboard pages
│   │   │   ├── mentor/        # Mentor dashboard pages
│   │   │   └── admin/         # Admin dashboard pages
│   │   ├── App.jsx            # Main app with routing
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   └── package.json
│
├── server/                      # Node.js Backend
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js            # Demo data seeder
│   ├── src/
│   │   └── index.js           # Express server + all routes
│   ├── .env                   # Environment variables
│   └── package.json
│
├── Technology_Specification.pdf
├── Product_Features_Specification.pdf
└── README.md

===============================================================================
API ENDPOINTS
===============================================================================

AUTHENTICATION:
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user

USERS:
GET    /api/users/me               - Get current user profile
PUT    /api/users/profile          - Update user profile
GET    /api/users/dashboard        - Get role-specific dashboard data

LEARNING RESOURCES:
GET    /api/resources              - List resources (filtered by batch)
POST   /api/resources              - Create resource (Mentor/Admin)
GET    /api/resources/:id          - Get single resource
POST   /api/resources/:id/track    - Track video progress

SESSIONS & TRACKING:
GET    /api/sessions               - List all sessions
GET    /api/sessions/tracking      - Get user's session tracking
POST   /api/sessions/track         - Update session progress

ASSIGNMENTS:
GET    /api/assignments            - List assignments (by role)
POST   /api/assignments            - Create assignment (Mentor/Admin)
POST   /api/assignments/:id/submit - Submit assignment (Student)
PUT    /api/assignments/:id/grade  - Grade assignment (Mentor)

MENTORSHIP:
GET    /api/mentorship             - Get mentorship data
GET    /api/mentorship/meetings    - Get all meetings
POST   /api/mentorship/meetings    - Schedule meeting (Mentor)

MENTOR:
POST   /api/mentor/sessions/upload - Upload session video
POST   /api/mentor/resources/upload- Upload resource file
GET    /api/mentor/uploads         - Get mentor's uploads
DELETE /api/mentor/uploads/:id     - Delete upload

FORUM:
GET    /api/forum/posts            - List all forum posts
POST   /api/forum/posts            - Create new post
GET    /api/forum/posts/:id        - Get single post with answers
POST   /api/forum/posts/:id/answers- Add answer to post

ADMIN:
GET    /api/admin/users            - List all users
PUT    /api/admin/users/:id/role   - Update user role
GET    /api/admin/reports          - Platform-wide reports
POST   /api/admin/announcements    - Create announcement
GET    /api/admin/batches          - List batches
POST   /api/admin/batches          - Create batch

===============================================================================
KEY FEATURES EXPLAINED
===============================================================================

AUTO-ATTENDANCE SYSTEM:
1. Student opens a learning resource (video/course)
2. Real-time progress tracking as video plays
3. At 80% completion, attendance is automatically recorded
4. Student dashboard instantly updates with new attendance %
5. Visible in student stats and admin reports

ACTIVITY HEATMAP:
- GitHub-style contribution graph showing daily login activity
- Color intensity based on engagement level
- Monthly view with hover tooltips
- Gamification element to encourage consistency

SMART NOTIFICATIONS:
- New assignments posted
- Upcoming meeting reminders
- Announcement alerts
- Assignment deadline warnings
- Mentor feedback received

BATCH-BASED VISIBILITY:
- Content is shown only to assigned batches
- Mentors see only their batch students
- Admin has universal access
- Maintains privacy and organization

===============================================================================
DESIGN PHILOSOPHY
===============================================================================

Our platform follows modern web design principles:
✨ Glassmorphism - Frosted glass effects with backdrop blur
🌈 Gradient Accents - Vibrant color gradients for visual appeal
🎭 Smooth Animations - Framer Motion for delightful interactions
📱 Responsive Design - Mobile-first approach
♿ Accessibility - WCAG compliant for inclusive design
🎯 User-Centric - Intuitive navigation and clear visual hierarchy

===============================================================================
LICENSE
===============================================================================

This project is developed for the Cybage Khushboo Scholarship Program Hackathon.

===============================================================================
ACKNOWLEDGMENTS
===============================================================================

- Cybage Software - For the Khushboo Scholarship Program
- Open Source Community - For amazing tools and libraries
- Mentors & Students - For valuable feedback and testing

===============================================================================

Built with ❤️ by Prasad Wadkar

===============================================================================
