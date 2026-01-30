import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import RoleSelection from './pages/auth/RoleSelection';
import StudentDashboard from './pages/student/Dashboard';
import LearningResources from './pages/student/LearningResources';
import SessionTracking from './pages/student/SessionTracking';
import MentorProgram from './pages/student/MentorProgram';
import Forum from './pages/student/Forum';
import MentorDashboard from './pages/mentor/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
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
  /* 
    if (!user.profileCompleted && window.location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" replace />;
    } */

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
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
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RoleSelection mode="register" />} />


      {/* Profile Completion - REMOVED */}
      {/* <Route path="/complete-profile" element={
        <ProtectedRoute>
          <AdditionalInfo />
        </ProtectedRoute>
      } /> */}

      {/* Dashboard Router */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardRouter />
        </ProtectedRoute>
      } />

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/resources" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <LearningResources />
        </ProtectedRoute>
      } />
      <Route path="/student/sessions" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <SessionTracking />
        </ProtectedRoute>
      } />
      <Route path="/student/mentor" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <MentorProgram />
        </ProtectedRoute>
      } />
      <Route path="/student/forum" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <Forum />
        </ProtectedRoute>
      } />

      {/* Mentor Routes */}
      <Route path="/mentor" element={
        <ProtectedRoute allowedRoles={['MENTOR']}>
          <MentorDashboard />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
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
