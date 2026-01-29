# Khushboo Scholar Learning & Engagement Dashboard

A centralized digital platform for the Cybage Khushboo Scholarship Program that enhances student learning, engagement, tracking, and mentor–mentee collaboration.

![Dashboard Preview](assets/dashboard.png)

## Features

### For Students
- 📊 **Personalized Dashboard** - View attendance, courses, badges, placement status
- 🎥 **Learning Resources** - Watch video courses with auto-attendance (≥80% completion)
- 📈 **Session Tracking** - Track your learning progress across all courses
- 👨‍🏫 **Mentor Program** - Connect with your assigned mentor, view meetings
- 💬 **Q&A Forum** - Ask questions and get answers from the community

### For Mentors
- 👥 **Mentee Management** - View and manage your assigned mentees
- 📚 **Upload Resources** - Add new learning content with YouTube videos
- 📅 **Meeting Tracking** - Schedule and track meetings with mentees
- 📤 **CSV Attendance** - Upload offline session attendance

### For Admins
- 📊 **Analytics Dashboard** - Platform-wide statistics and usage metrics
- 👤 **User Management** - Manage users and their roles
- 📢 **Announcements** - Publish platform-wide announcements
- 📈 **Reports** - View engagement and attendance reports

## Tech Stack

- **Frontend**: React.js (Vite), React Router, Axios, Framer Motion
- **Backend**: Node.js, Express.js, JWT Authentication
- **Database**: PostgreSQL with Prisma ORM
- **Hosting**: Supabase (Database), Render (Application)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL installed and running
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Khushboo-Pathshala
   ```

2. **Set up the database**
   
   Create a PostgreSQL database named `khushboo_pathshala`:
   ```sql
   CREATE DATABASE khushboo_pathshala;
   ```

3. **Configure environment variables**
   
   Edit `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/khushboo_pathshala?schema=public"
   JWT_SECRET="your-secret-key"
   PORT=5000
   ```

4. **Install dependencies and set up database**
   ```bash
   # Backend
   cd server
   npm install
   npx prisma migrate dev --name init
   npm run seed
   
   # Frontend
   cd ../client
   npm install
   ```

5. **Start the development servers**
   
   In one terminal (backend):
   ```bash
   cd server
   npm run dev
   ```
   
   In another terminal (frontend):
   ```bash
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Demo Credentials

After running the seed script, you can log in with these accounts:

| Role    | Email                     | Password    |
|---------|---------------------------|-------------|
| Student | prasad@example.com        | password123 |
| Mentor  | rakesh.sinha@cybage.com   | password123 |
| Admin   | admin@cybage.com          | password123 |

## Project Structure

```
Khushboo-Pathshala/
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/              # API service layer
│   │   ├── context/          # React Context (Auth)
│   │   ├── pages/
│   │   │   ├── auth/         # Login, Register, Profile
│   │   │   ├── student/      # Student pages
│   │   │   ├── mentor/       # Mentor pages
│   │   │   └── admin/        # Admin pages
│   │   ├── App.jsx           # Main app with routing
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   └── package.json
│
├── server/                    # Node.js backend
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.js           # Dummy data seeder
│   ├── src/
│   │   └── index.js          # Express server
│   ├── .env                  # Environment variables
│   └── package.json
│
├── Technology_Specification.pdf
├── Product_Features Specification.pdf
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/profile` - Update profile
- `GET /api/users/dashboard` - Get dashboard data

### Learning Resources
- `GET /api/resources` - List all resources
- `POST /api/resources` - Create resource (Mentor/Admin)
- `POST /api/resources/:id/track` - Track video progress

### Sessions
- `GET /api/sessions` - List sessions
- `GET /api/sessions/tracking` - Get user's tracking data

### Mentorship
- `GET /api/mentorship` - Get mentorship data
- `GET /api/mentorship/meetings` - Get meetings
- `POST /api/mentorship/meetings` - Create meeting

### Forum
- `GET /api/forum/posts` - List forum posts
- `POST /api/forum/posts` - Create post
- `POST /api/forum/posts/:id/answers` - Add answer

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/reports` - Get reports

## Auto-Attendance Feature

The platform automatically marks attendance when a student watches ≥80% of a video:

1. Student opens a learning resource
2. Video progress is tracked in real-time
3. When completion reaches 80%, attendance is automatically marked
4. Student dashboard updates with new attendance percentage

## License

This project is developed for the Cybage Khushboo Scholarship Program Hackathon.

---

**Built with ❤️ by Prasad Wadkar**
