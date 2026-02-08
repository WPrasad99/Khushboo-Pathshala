import { useState, useEffect } from 'react';
import { userAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { FiActivity, FiArrowRight, FiCalendar, FiCheckCircle, FiPlayCircle, FiBriefcase } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import ActivityHeatmap from './ActivityHeatmap';
import StudentAssignmentSection from '../../components/StudentAssignmentSection';
import './Dashboard.css';

const StudentDashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginDates, setLoginDates] = useState([]);

    // Determine active view based on URL path
    const isAssignmentsView = location.pathname.includes('/assignments');
    const isOverview = !isAssignmentsView;

    const [filteredData, setFilteredData] = useState({
        recentActivities: [],
        upcomingSessions: [],
        announcements: []
    });

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getStudentDashboard();
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
                <header className="dashboard-header" style={{ marginBottom: '30px' }}>
                    <div>
                        <h1 className="welcome-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Hello, {user?.name?.split(' ')[0]} 👋</h1>
                        <p className="welcome-subtitle" style={{ color: '#64748b', marginTop: '4px' }}>Here's what's happening with your learning today.</p>
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
                                <span className="stat-label">Active This Month</span>
                                <div className="stat-value-row">
                                    <span className="stat-value">{activeDaysThisMonth}</span>
                                    <span className="stat-of">of {totalDaysInMonth}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>





                    {/* Activity Heatmap */}
                    <motion.div
                        className="heatmap-section"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
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


        </div>
    );
};

export default StudentDashboard;
