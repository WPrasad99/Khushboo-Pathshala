
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import {
    FiBell, FiUser, FiPlayCircle, FiCheckCircle, FiBriefcase,
    FiCalendar, FiArrowRight, FiActivity
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import ActivityHeatmap from './ActivityHeatmap';
import Sidebar from '../../components/student/Sidebar';
import './Dashboard.css';

const StudentDashboard = () => {
    const { user } = useAuth();
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

    // Mock Active Days (Replacing Placement Status calculation for now)
    // In a real app, this would come from stats.activeDays
    const activeDaysCount = 15;

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="main-content">
                {/* Top Header */}
                <header className="content-header">
                    <div>
                        <h1 className="welcome-title">Hello, {user?.name?.split(' ')[0]} 👋</h1>
                        <p className="welcome-subtitle">Here's what's happening with your learning today.</p>
                    </div>
                    <div className="header-actions">
                        <button className="icon-btn-minimal">
                            <FiBell />
                            <span className="dot"></span>
                        </button>
                        <div className="user-profile-minimal">
                            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`} alt="Profile" />
                        </div>
                    </div>
                </header>

                {/* Minimal Stats Grid */}
                <div className="minimal-stats-grid">
                    <div className="min-stat-card">
                        <div className="min-stat-icon teal-bg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
                        </div>
                        <div className="min-stat-info">
                            <span className="label">Attendance</span>
                            <span className="value">{stats?.attendancePercentage || 0}%</span>
                        </div>
                    </div>

                    <div className="min-stat-card">
                        <div className="min-stat-icon blue-bg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                        </div>
                        <div className="min-stat-info">
                            <span className="label">Courses</span>
                            <span className="value">{stats?.completedCourses || 0}</span>
                        </div>
                    </div>

                    <div className="min-stat-card">
                        <div className="min-stat-icon orange-bg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                        </div>
                        <div className="min-stat-info">
                            <span className="label">Badges</span>
                            <span className="value">{stats?.badgesCount || 0}</span>
                        </div>
                    </div>

                    <div className="min-stat-card active-days-card">
                        <div className="min-stat-icon purple-bg">
                            <FiActivity />
                        </div>
                        <div className="min-stat-info">
                            <span className="label">Active Days</span>
                            <div className="value-group">
                                <span className="value">{activeDaysCount}</span>
                                <span className="trend positive">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                                    Streak
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Creative Grid Layout */}
                <div className="creative-grid">
                    {/* Column 1: Activities & Sessions */}
                    <div className="grid-col-left">
                        <motion.div
                            className="content-card wide-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="card-header">
                                <h3>Recent Activities</h3>
                                <button className="btn-text">View All</button>
                            </div>
                            <div className="activities-minimal-list">
                                {recentActivities?.slice(0, 3).map((activity, i) => (
                                    <div key={i} className="activity-row">
                                        {getActivityIcon(activity.type)}
                                        <div className="activity-details">
                                            <span className="act-title">{activity.title}</span>
                                            <span className="act-time">Today, 10:23 AM</span>
                                        </div>
                                    </div>
                                )) || (
                                        <div className="empty-state">No recent activities</div>
                                    )}
                            </div>
                        </motion.div>

                        <motion.div
                            className="content-card wide-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="card-header">
                                <h3>Upcoming Sessions</h3>
                                <button className="btn-icon"><FiArrowRight /></button>
                            </div>
                            <div className="sessions-minimal-list">
                                {upcomingSessions?.slice(0, 2).map((session, i) => (
                                    <div key={i} className="session-pill">
                                        <div className="date-box">
                                            <span className="d-day">{new Date(session.scheduledAt).getDate()}</span>
                                            <span className="d-month">{new Date(session.scheduledAt).toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                        <div className="sess-details">
                                            <span className="sess-title">{session.title}</span>
                                            <span className="sess-time">
                                                <FiCalendar size={12} />
                                                {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {i === 0 && <span className="tag-soon">Soon</span>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Column 2: Announcements */}
                    <div className="grid-col-right">
                        <motion.div
                            className="content-card tall-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="card-header">
                                <h3>Announcements</h3>
                            </div>
                            <div className="announcements-timeline">
                                {announcements?.slice(0, 3).map((ann, i) => (
                                    <div key={i} className="timeline-item">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <h4>{ann.title}</h4>
                                            <p>{ann.description || "Important update regarding your course..."}</p>
                                            <span className="time-ago">2h ago</span>
                                        </div>
                                    </div>
                                )) || (
                                        <div className="timeline-item">
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-content">
                                                <h4>System Update</h4>
                                                <p>Platform maintenance scheduled for tonight.</p>
                                                <span className="time-ago">1d ago</span>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom Section: Heatmap */}
                <motion.div
                    className="heatmap-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <ActivityHeatmap />
                </motion.div>

            </main>
        </div>
    );
};

export default StudentDashboard;
