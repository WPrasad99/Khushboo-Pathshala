import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import RoleSelection from './pages/auth/RoleSelection';
// Layouts
import StudentLayout from './components/layout/StudentLayout';
import MentorLayout from './components/layout/MentorLayout';
import AdminLayout from './components/layout/AdminLayout';
// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import Courses from './pages/student/Courses';
import CoursePlayer from './pages/student/CoursePlayer';
import MentorProgram from './pages/student/MentorProgram';
import Forum from './pages/student/Forum';
// Mentor Pages
import MentorDashboard from './pages/mentor/Dashboard';
import UploadResource from './pages/mentor/UploadResource';
import Meetings from './pages/mentor/Meetings';
import AttendanceUpload from './pages/mentor/AttendanceUpload';
// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Announcements from './pages/admin/Announcements';
import Reports from './pages/admin/Reports';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-xl">
          <div className="animate-pulse text-primary">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to legitimate dashboard based on their actual role
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    if (user.role === 'MENTOR') return <Navigate to="/mentor" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  }

  return children;
};

// Dashboard Router - redirects to appropriate dashboard based on role
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'STUDENT') return <Navigate to="/student" replace />;
  if (user?.role === 'MENTOR') return <Navigate to="/mentor" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;

  return <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-xl">
          <div className="animate-pulse text-primary">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <RoleSelection />
      } />

      {/* Dashboard Router */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardRouter />
        </ProtectedRoute>
      } />

      {/* Student Routes with Layout */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<StudentDashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:courseId" element={<CoursePlayer />} />
        <Route path="resources" element={<Courses />} />
        <Route path="mentor" element={<MentorProgram />} />
        <Route path="forum" element={<Forum />} />
      </Route>

      {/* Mentor Routes with Layout */}
      <Route path="/mentor" element={
        <ProtectedRoute allowedRoles={['MENTOR']}>
          <MentorLayout />
        </ProtectedRoute>
      }>
        <Route index element={<MentorDashboard />} />
        <Route path="upload" element={<UploadResource />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="attendance" element={<AttendanceUpload />} />
      </Route>

      {/* Admin Routes with Layout */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
