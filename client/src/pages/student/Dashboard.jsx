import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import {
    FiSearch, FiBell, FiUser, FiLogOut, FiBook, FiUsers,
    FiMessageSquare, FiCalendar, FiClock, FiAward, FiTrendingUp,
    FiCheckCircle, FiPlayCircle, FiBriefcase
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import './Dashboard.css';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await userAPI.getDashboard();
            setDashboardData(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'watched': return <FiPlayCircle className="activity-icon watched" />;
            case 'completed': return <FiCheckCircle className="activity-icon completed" />;
            case 'placement': return <FiBriefcase className="activity-icon placement" />;
            default: return <FiBook className="activity-icon" />;
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="glass-card p-xl">
                    <div className="loading-spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const { stats, recentActivities, upcomingSessions, announcements } = dashboardData || {};

    return (
        <div className="dashboard-page">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="10" fill="url(#gradient)" />
                        <path d="M10 28V12L20 8L30 12V28L20 32L10 28Z" fill="white" opacity="0.9" />
                        <path d="M15 18L20 16L25 18V24L20 26L15 24V18Z" fill="#4A90E2" />
                        <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#4A90E2" />
                                <stop offset="1" stopColor="#357ABD" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="navbar-actions">
                    <div className="search-box">
                        <FiSearch />
                        <input type="text" placeholder="Search..." />
                    </div>
                    <button className="icon-btn">
                        <FiBell />
                        <span className="notification-dot"></span>
                    </button>
                    <button className="icon-btn">
                        <FiUser />
                    </button>
                    <div className="user-menu">
                        <img src={user?.avatar} alt={user?.name} className="avatar" />
                        <button className="icon-btn" onClick={handleLogout} title="Logout">
                            <FiLogOut />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="dashboard-content">
                <div className="dashboard-grid">
                    {/* Welcome Card */}
                    <motion.div
                        className="glass-card welcome-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="welcome-header">
                            <h1>Welcome Back, {user?.name?.split(' ')[0]}!</h1>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card stat-card-teal">
                                <span className="stat-label">Attendance</span>
                                <span className="stat-value">{stats?.attendancePercentage || 85}%</span>
                                <span className="stat-sublabel">Present</span>
                            </div>
                            <div className="stat-card stat-card-blue">
                                <span className="stat-label">Courses Completed</span>
                                <span className="stat-value">{stats?.completedCourses || 12}</span>
                                <span className="stat-sublabel">Courses</span>
                            </div>
                            <div className="stat-card stat-card-orange">
                                <span className="stat-label">Achievements</span>
                                <span className="stat-value">{stats?.badgesCount || 3}</span>
                                <span className="stat-sublabel">Badges</span>
                            </div>
                            <div className="stat-card stat-card-purple">
                                <span className="stat-label">Placement Status</span>
                                <div className="stat-status">
                                    <FiTrendingUp />
                                    <span>{stats?.placementStatus || 'Interview Scheduled'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="welcome-sections">
                            <div className="activities-section">
                                <h3>Recent Activities</h3>
                                <ul className="activities-list">
                                    {recentActivities?.map((activity, index) => (
                                        <li key={index} className="activity-item">
                                            {getActivityIcon(activity.type)}
                                            <span>{activity.title}</span>
                                        </li>
                                    )) || (
                                            <>
                                                <li className="activity-item">
                                                    <FiPlayCircle className="activity-icon watched" />
                                                    <span>Watched: Python Basics</span>
                                                </li>
                                                <li className="activity-item">
                                                    <FiCheckCircle className="activity-icon completed" />
                                                    <span>Completed: Soft Skills Workshop</span>
                                                </li>
                                                <li className="activity-item">
                                                    <FiBriefcase className="activity-icon placement" />
                                                    <span>Placement Update: Interview with Infosys</span>
                                                </li>
                                            </>
                                        )}
                                </ul>
                            </div>

                            <div className="sessions-section">
                                <h3>Upcoming Sessions</h3>
                                <ul className="sessions-list">
                                    {upcomingSessions?.map((session, index) => (
                                        <li key={index} className="session-item">
                                            <FiCalendar className="session-icon" />
                                            <div className="session-info">
                                                <span className="session-title">{session.title}</span>
                                                <span className="session-time">
                                                    {new Date(session.scheduledAt).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </li>
                                    )) || (
                                            <>
                                                <li className="session-item">
                                                    <FiCalendar className="session-icon" />
                                                    <div className="session-info">
                                                        <span className="session-title">Advanced Java</span>
                                                        <span className="session-time">Tomorrow, 3:00 PM</span>
                                                    </div>
                                                </li>
                                            </>
                                        )}
                                </ul>

                                <h3 style={{ marginTop: 'var(--spacing-lg)' }}>Latest Announcements</h3>
                                <div className="announcements-list">
                                    {announcements?.slice(0, 2).map((announcement, index) => (
                                        <div key={index} className="announcement-item">
                                            <FiBell className="announcement-icon" />
                                            <span>{announcement.title}</span>
                                        </div>
                                    )) || (
                                            <div className="announcement-item">
                                                <FiBell className="announcement-icon" />
                                                <span>Career Guidance Seminar this Friday</span>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        className="quick-links"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Link to="/student/resources" className="quick-link-card glass-card">
                            <div className="quick-link-icon">
                                <FiBook />
                            </div>
                            <span>Learning Resources</span>
                        </Link>
                        <Link to="/student/sessions" className="quick-link-card glass-card">
                            <div className="quick-link-icon">
                                <FiClock />
                            </div>
                            <span>Session Tracking</span>
                        </Link>
                        <Link to="/student/mentor" className="quick-link-card glass-card">
                            <div className="quick-link-icon">
                                <FiUsers />
                            </div>
                            <span>Mentor Program</span>
                        </Link>
                        <Link to="/student/forum" className="quick-link-card glass-card">
                            <div className="quick-link-icon">
                                <FiMessageSquare />
                            </div>
                            <span>Q&A Forum</span>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
