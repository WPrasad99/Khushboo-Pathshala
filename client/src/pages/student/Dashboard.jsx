import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import {
    FiBell, FiPlayCircle, FiCheckCircle, FiBriefcase,
    FiCalendar, FiArrowRight, FiActivity
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import ActivityHeatmap from './ActivityHeatmap';
import './Dashboard.css';

const StudentDashboard = () => {
    const { user } = useAuth();
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

    const getActivityIcon = (type) => {
        switch (type) {
            case 'watched': return <FiPlayCircle className="activity-icon watched" />;
            case 'completed': return <FiCheckCircle className="activity-icon completed" />;
            case 'placement': return <FiBriefcase className="activity-icon placement" />;
            default: return <FiActivity className="activity-icon" />;
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    const { stats, recentActivities, upcomingSessions, announcements } = dashboardData || {};
    const activeDaysCount = stats?.activeDays || 15;

    return (
        <div className="dashboard-content">
            {/* Header */}
            <header className="dashboard-header">
                <div>
                    <h1 className="welcome-title">Hello, {user?.name?.split(' ')[0]} 👋</h1>
                    <p className="welcome-subtitle">Here's what's happening with your learning today.</p>
                </div>
                <div className="header-actions">
                    <button className="header-icon-btn">
                        <FiBell />
                        <span className="notification-dot"></span>
                    </button>
                    <div className="header-avatar">
                        <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=4F46E5&color=fff`} alt="Profile" />
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                <motion.div
                    className="stat-card stat-teal"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                >
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <polyline points="17 11 19 13 23 9" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Attendance</span>
                        <span className="stat-value">{stats?.attendancePercentage || 0}%</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card stat-blue"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Courses</span>
                        <span className="stat-value">{stats?.completedCourses || 0}</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card stat-orange"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="8" r="7" />
                            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Badges</span>
                        <span className="stat-value">{stats?.badgesCount || 0}</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card stat-purple"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="stat-icon">
                        <FiActivity size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Active Days</span>
                        <div className="stat-value-row">
                            <span className="stat-value">{activeDaysCount}</span>
                            <span className="streak-badge">🔥 Streak</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Creative Grid */}
            <div className="content-grid">
                {/* Left Column */}
                <div className="grid-col-left">
                    {/* Recent Activities Card */}
                    <motion.div
                        className="content-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="card-header">
                            <h3>Recent Activities</h3>
                            <button className="btn-link">View All</button>
                        </div>
                        <div className="activities-list">
                            {recentActivities?.slice(0, 4).map((activity, i) => (
                                <div key={i} className="activity-item">
                                    {getActivityIcon(activity.type)}
                                    <div className="activity-info">
                                        <span className="activity-title">{activity.title}</span>
                                        <span className="activity-time">Today</span>
                                    </div>
                                </div>
                            )) || (
                                    <div className="empty-state">No recent activities</div>
                                )}
                        </div>
                    </motion.div>

                    {/* Upcoming Sessions Card */}
                    <motion.div
                        className="content-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="card-header">
                            <h3>Upcoming Sessions</h3>
                            <button className="btn-icon"><FiArrowRight /></button>
                        </div>
                        <div className="sessions-list">
                            {upcomingSessions?.slice(0, 3).map((session, i) => (
                                <div key={i} className="session-item">
                                    <div className="session-date">
                                        <span className="date-day">{new Date(session.scheduledAt).getDate()}</span>
                                        <span className="date-month">{new Date(session.scheduledAt).toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                    <div className="session-info">
                                        <span className="session-title">{session.title}</span>
                                        <span className="session-time">
                                            <FiCalendar size={12} />
                                            {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {i === 0 && <span className="badge-soon">Soon</span>}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column - Announcements */}
                <div className="grid-col-right">
                    <motion.div
                        className="content-card announcements-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="card-header">
                            <h3>Announcements</h3>
                        </div>
                        <div className="announcements-timeline">
                            {announcements?.slice(0, 4).map((ann, i) => (
                                <div key={i} className="timeline-item">
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <h4>{ann.title}</h4>
                                        <p>{ann.description || 'Important update for your learning journey.'}</p>
                                        <span className="time-ago">2h ago</span>
                                    </div>
                                </div>
                            )) || (
                                    <div className="timeline-item">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <h4>Welcome to Pathshala!</h4>
                                            <p>Start your learning journey today.</p>
                                            <span className="time-ago">Just now</span>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Activity Heatmap */}
            <motion.div
                className="heatmap-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
            >
                <ActivityHeatmap />
            </motion.div>
        </div>
    );
};

export default StudentDashboard;
