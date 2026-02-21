import { useState, useEffect } from 'react';
import { userAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { FiActivity, FiArrowRight, FiCalendar, FiCheckCircle, FiPlayCircle, FiBriefcase, FiBell, FiSun, FiMoon } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import ActivityHeatmap from './ActivityHeatmap';
import StudentAssignmentSection from '../../components/StudentAssignmentSection';
import StudentResourcesSection from '../../components/StudentResourcesSection';

import './Dashboard.css';
import './DashboardMobileFix.css';

// Simple CountUp Component for Animated Metrics
const CountUp = ({ value, duration = 1500 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeProgress * value));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setCount(value);
            }
        };
        window.requestAnimationFrame(step);
    }, [value, duration]);

    return <span>{count}</span>;
};

const StudentDashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginDates, setLoginDates] = useState([]);

    // Determine active view based on URL path
    const isAssignmentsView = location.pathname.includes('/assignments') || location.pathname.includes('/quizzes');
    const isResourcesView = location.pathname.includes('/resources');
    const isOverview = !isAssignmentsView && !isResourcesView;

    const [filteredData, setFilteredData] = useState({
        recentActivities: [],
        upcomingSessions: [],
        announcements: []
    });

    // Theme Architecture State
    const [theme, setTheme] = useState(localStorage.getItem('admin-theme') || 'light');

    useEffect(() => {
        fetchDashboard();
    }, []);

    // Theme Application Effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('admin-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getStudentDashboard();
            console.log('Dashboard API Response:', response.data);
            console.log('Announcements:', response.data.announcements);
            console.log('Upcoming Sessions:', response.data.upcomingSessions);
            setDashboardData(response.data);
            setFilteredData({
                recentActivities: response.data.recentActivities || [],
                upcomingSessions: response.data.upcomingSessions || [],
                announcements: response.data.announcements || []
            });
            setLoginDates(response.data.loginDates || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
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

    const formatTimeAgo = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    const { stats } = dashboardData || {};
    const { recentActivities, upcomingSessions, announcements } = filteredData;
    const activeDaysThisMonth = stats?.activeDaysThisMonth || 0;
    const totalDaysInMonth = stats?.totalDaysInMonth || 30;

    return (
        <div className="dashboard-content">
            {/* Header - Only Show in Overview */}
            {isOverview && (
                <header className="dashboard-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="welcome-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Hello, {user?.name?.split(' ')[0]} 👋</h1>
                        <p className="welcome-subtitle" style={{ color: 'var(--admin-text-muted)', marginTop: '4px' }}>Here's what's happening with your learning today.</p>
                    </div>
                    <div className="header-actions">
                        <button className="header-icon-btn" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'light' ? <FiMoon /> : <FiSun />}
                        </button>
                    </div>
                </header>
            )}

            {/* Content Sections */}
            {isOverview && (
                <>
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
                                <span className="stat-value"><CountUp value={stats?.attendancePercentage || 0} />%</span>
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
                                <span className="stat-label">Courses Completed</span>
                                <span className="stat-value"><CountUp value={stats?.completedCourses || 0} /></span>
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
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                </svg>
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Learning Resources</span>
                                <span className="stat-value"><CountUp value={stats?.learningResources || 0} /></span>
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
                                <span className="stat-label">Login Streak</span>
                                <div className="stat-value-row">
                                    {stats?.streakStatus === 'paused' ? (
                                        <>
                                            <span className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--admin-status-danger)' }}>Paused</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="stat-value"><CountUp value={stats?.loginStreak || 0} /></span>
                                            <span className="stat-of">days</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Dashboard Sections - 70/30 Grid */}
                    <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '24px' }}>

                        {/* Left: Upcoming Sessions (70%) */}
                        <section>
                            <div className="dashboard-section-header">
                                <h2><FiCalendar /> Upcoming Sessions & Meetings</h2>
                                <span className="count">{upcomingSessions.length}</span>
                            </div>
                            <div className="list-container">
                                {upcomingSessions.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon"><FiCalendar /></div>
                                        <p>No upcoming sessions scheduled</p>
                                    </div>
                                ) : (
                                    upcomingSessions.map((session, i) => (
                                        <div key={i} className="list-item">
                                            <div className="date-badge">
                                                <span className="day">{new Date(session.scheduledAt).getDate()}</span>
                                                <span className="month">{new Date(session.scheduledAt).toLocaleString('default', { month: 'short' })}</span>
                                            </div>
                                            <div className="list-item-content">
                                                <span className="list-item-title">{session.title}</span>
                                                <span className="list-item-subtitle">
                                                    {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.type === 'meeting' ? 'Mentorship' : 'Class'}
                                                </span>
                                            </div>
                                            <div className="list-item-action">
                                                <a href={session.link} target="_blank" rel="noopener noreferrer" className="btn-primary-sm" style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '6px 12px', background: '#4f46e5', color: 'white', borderRadius: '8px' }}>
                                                    Join
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Right: Announcements (30%) - Meeting Card Style */}
                        <section>
                            <div className="dashboard-section-header">
                                <h2><FiBell /> Announcements</h2>
                                <span className="count">{announcements.length}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {announcements.length === 0 ? (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                                        <FiBell style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.3 }} />
                                        <p>No announcements</p>
                                    </div>
                                ) : (
                                    announcements.slice(0, 3).map((announcement, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '12px',
                                                borderRadius: '16px',
                                                background: 'var(--admin-surface)',
                                                border: '1px solid var(--admin-border-color)',
                                                boxShadow: 'var(--admin-shadow-sm)',
                                                cursor: 'pointer',
                                                transition: 'var(--admin-transition)'
                                            }}
                                            whileHover={{
                                                transform: 'translateY(-2px)',
                                                boxShadow: 'var(--admin-shadow-md)',
                                                borderColor: 'var(--admin-accent-primary)'
                                            }}
                                        >
                                            <div style={{
                                                width: '44px',
                                                height: '54px',
                                                background: 'var(--admin-bg-color)',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                border: '1px solid var(--admin-border-color)'
                                            }}>
                                                <FiBell style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--admin-status-danger)' }} />
                                                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--admin-status-danger)', marginTop: '2px' }}>
                                                    New
                                                </span>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: '700',
                                                    color: 'var(--admin-text-primary)',
                                                    margin: '0 0 4px 0',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {announcement.title}
                                                </h4>
                                                <p style={{
                                                    fontSize: '0.7rem',
                                                    color: 'var(--admin-text-secondary)',
                                                    margin: 0,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {announcement.content}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </section>

                    </div>

                    {/* Activity Heatmap */}
                    <motion.div
                        style={{ marginTop: '32px' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <ActivityHeatmap loginDates={loginDates} />
                    </motion.div>

                </>
            )}

            {isAssignmentsView && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                >
                    <StudentAssignmentSection />
                </motion.div>
            )}



            {isResourcesView && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                >
                    <StudentResourcesSection />
                </motion.div>
            )}

        </div>
    );
};

export default StudentDashboard;
