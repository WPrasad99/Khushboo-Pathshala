import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api';
import {
    FiBell, FiUsers, FiBook, FiCalendar, FiTrendingUp, FiTrendingDown,
    FiActivity, FiArrowRight, FiAlertCircle, FiCheckCircle, FiX,
    FiUserPlus, FiMessageSquare, FiBarChart2, FiPercent
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import '../student/Dashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await adminAPI.getReports();
            setDashboardData(response.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            // Mock data for demo
            setDashboardData({
                stats: {
                    totalStudents: 156,
                    totalMentors: 12,
                    totalResources: 48,
                    totalSessions: 234,
                    activeUsers: 89,
                    attendanceRate: 78,
                    engagementRate: 65,
                    completionRate: 42
                },
                trends: {
                    students: { value: 12, direction: 'up' },
                    mentors: { value: 2, direction: 'up' },
                    engagement: { value: 5, direction: 'up' },
                    attendance: { value: 3, direction: 'down' }
                },
                alerts: [
                    { type: 'warning', message: '5 students with attendance below 50%' },
                    { type: 'info', message: '3 new mentor applications pending' },
                ],
                recentTrackings: [
                    { user: { name: 'Priya Sharma' }, resource: { title: 'React Fundamentals' }, completionPercentage: 85, attendanceMarked: true },
                    { user: { name: 'Rahul Verma' }, resource: { title: 'JavaScript Basics' }, completionPercentage: 45, attendanceMarked: false },
                    { user: { name: 'Ananya Patel' }, resource: { title: 'CSS Mastery' }, completionPercentage: 100, attendanceMarked: true },
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    const stats = dashboardData?.stats || {};
    const trends = dashboardData?.trends || {};
    const alerts = dashboardData?.alerts || [];

    const TrendIndicator = ({ value, direction }) => (
        <span className={`trend-indicator ${direction}`}>
            {direction === 'up' ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
            {value}%
        </span>
    );

    return (
        <div className="dashboard-content">
            {/* Header */}
            <header className="dashboard-header">
                <div>
                    <h1 className="welcome-title">Admin Dashboard</h1>
                    <p className="welcome-subtitle">Program health overview and key metrics at a glance.</p>
                </div>
                <div className="header-actions">
                    <div className="notification-wrapper">
                        <button
                            className="header-icon-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <FiBell />
                            {alerts.length > 0 && (
                                <span className="notification-badge">{alerts.length}</span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    className="notification-dropdown"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <div className="notification-header">
                                        <h4>System Alerts</h4>
                                        <button onClick={() => setShowNotifications(false)}>
                                            <FiX />
                                        </button>
                                    </div>
                                    <div className="notification-list">
                                        {alerts.map((alert, i) => (
                                            <div key={i} className="notification-item">
                                                <div className={`notif-icon ${alert.type}`}>
                                                    <FiAlertCircle size={14} />
                                                </div>
                                                <div className="notif-content">
                                                    <span className="notif-title">{alert.message}</span>
                                                    <span className="notif-time">Review now</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Primary KPIs */}
            <div className="stats-grid">
                <motion.div
                    className="stat-card stat-teal"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="stat-icon">
                        <FiUsers size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Students</span>
                        <div className="stat-value-row">
                            <span className="stat-value">{stats.totalStudents || 0}</span>
                            {trends.students && <TrendIndicator {...trends.students} />}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card stat-blue"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="stat-icon">
                        <FiUserPlus size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Active Mentors</span>
                        <div className="stat-value-row">
                            <span className="stat-value">{stats.totalMentors || 0}</span>
                            {trends.mentors && <TrendIndicator {...trends.mentors} />}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card stat-orange"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="stat-icon">
                        <FiPercent size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Attendance Rate</span>
                        <div className="stat-value-row">
                            <span className="stat-value">{stats.attendanceRate || 0}%</span>
                            {trends.attendance && <TrendIndicator {...trends.attendance} />}
                        </div>
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
                        <span className="stat-label">Engagement Rate</span>
                        <div className="stat-value-row">
                            <span className="stat-value">{stats.engagementRate || 0}%</span>
                            {trends.engagement && <TrendIndicator {...trends.engagement} />}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Secondary Metrics Row */}
            <motion.div
                className="metrics-row"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="metric-card">
                    <div className="metric-icon"><FiBook /></div>
                    <div className="metric-info">
                        <span className="metric-value">{stats.totalResources || 0}</span>
                        <span className="metric-label">Resources</span>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><FiCalendar /></div>
                    <div className="metric-info">
                        <span className="metric-value">{stats.totalSessions || 0}</span>
                        <span className="metric-label">Sessions</span>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><FiCheckCircle /></div>
                    <div className="metric-info">
                        <span className="metric-value">{stats.completionRate || 0}%</span>
                        <span className="metric-label">Completion</span>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><FiMessageSquare /></div>
                    <div className="metric-info">
                        <span className="metric-value">{stats.activeUsers || 0}</span>
                        <span className="metric-label">Active Today</span>
                    </div>
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="content-grid">
                {/* Left Column */}
                <div className="grid-col-left">
                    {/* Program Health */}
                    <motion.div
                        className="content-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="card-header">
                            <h3><FiBarChart2 /> Program Health</h3>
                        </div>
                        <div className="health-metrics">
                            <div className="health-item">
                                <div className="health-label">
                                    <span>Mentor Coverage</span>
                                    <span className="health-value">
                                        {stats.totalMentors > 0 ? Math.round(stats.totalStudents / stats.totalMentors) : 0} : 1
                                    </span>
                                </div>
                                <div className="health-bar">
                                    <div
                                        className="health-fill good"
                                        style={{ width: `${Math.min((stats.totalMentors / stats.totalStudents) * 100 * 10, 100)}%` }}
                                    ></div>
                                </div>
                                <span className="health-status good">Healthy ratio</span>
                            </div>

                            <div className="health-item">
                                <div className="health-label">
                                    <span>Attendance Compliance</span>
                                    <span className="health-value">{stats.attendanceRate || 0}%</span>
                                </div>
                                <div className="health-bar">
                                    <div
                                        className={`health-fill ${stats.attendanceRate >= 70 ? 'good' : stats.attendanceRate >= 50 ? 'warning' : 'danger'}`}
                                        style={{ width: `${stats.attendanceRate || 0}%` }}
                                    ></div>
                                </div>
                                <span className={`health-status ${stats.attendanceRate >= 70 ? 'good' : 'warning'}`}>
                                    {stats.attendanceRate >= 70 ? 'On target' : 'Needs improvement'}
                                </span>
                            </div>

                            <div className="health-item">
                                <div className="health-label">
                                    <span>Course Completion</span>
                                    <span className="health-value">{stats.completionRate || 0}%</span>
                                </div>
                                <div className="health-bar">
                                    <div
                                        className={`health-fill ${stats.completionRate >= 60 ? 'good' : 'warning'}`}
                                        style={{ width: `${stats.completionRate || 0}%` }}
                                    ></div>
                                </div>
                                <span className={`health-status ${stats.completionRate >= 60 ? 'good' : 'warning'}`}>
                                    {stats.completionRate >= 60 ? 'Good progress' : 'Below target'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        className="content-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="card-header">
                            <h3>Recent Activity</h3>
                            <Link to="/admin/reports" className="btn-link">View All</Link>
                        </div>
                        <div className="activities-list">
                            {dashboardData?.recentTrackings?.slice(0, 4).map((tracking, i) => (
                                <div key={i} className="activity-item">
                                    <div className={`activity-icon ${tracking.attendanceMarked ? 'completed' : 'watched'}`}>
                                        {tracking.attendanceMarked ? <FiCheckCircle /> : <FiActivity />}
                                    </div>
                                    <div className="activity-info">
                                        <span className="activity-title">
                                            {tracking.user?.name} - {tracking.resource?.title}
                                        </span>
                                        <span className="activity-time">
                                            Progress: {tracking.completionPercentage}%
                                        </span>
                                    </div>
                                </div>
                            )) || (
                                    <div className="empty-state">No recent activity</div>
                                )}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column */}
                <div className="grid-col-right">
                    {/* Alerts & Anomalies */}
                    <motion.div
                        className="content-card alerts-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="card-header">
                            <h3><FiAlertCircle /> Alerts & Actions</h3>
                        </div>
                        <div className="alerts-list">
                            <div className="alert-item warning">
                                <FiAlertCircle className="alert-icon" />
                                <div className="alert-content">
                                    <span className="alert-title">Low Attendance Alert</span>
                                    <span className="alert-desc">5 students below 50% attendance</span>
                                </div>
                                <button className="alert-action">Review</button>
                            </div>
                            <div className="alert-item info">
                                <FiUserPlus className="alert-icon" />
                                <div className="alert-content">
                                    <span className="alert-title">Pending Applications</span>
                                    <span className="alert-desc">3 mentor applications awaiting review</span>
                                </div>
                                <button className="alert-action">View</button>
                            </div>
                            <div className="alert-item success">
                                <FiCheckCircle className="alert-icon" />
                                <div className="alert-content">
                                    <span className="alert-title">Milestone Reached</span>
                                    <span className="alert-desc">10 students completed certification</span>
                                </div>
                                <button className="alert-action">Details</button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        className="content-card quick-actions-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="card-header">
                            <h3>Quick Actions</h3>
                        </div>
                        <div className="quick-actions-grid">
                            <Link to="/admin/users" className="quick-action-btn">
                                <FiUsers size={20} />
                                <span>Manage Users</span>
                            </Link>
                            <Link to="/admin/announcements" className="quick-action-btn">
                                <FiBell size={20} />
                                <span>Announcements</span>
                            </Link>
                            <Link to="/admin/reports" className="quick-action-btn">
                                <FiBarChart2 size={20} />
                                <span>View Reports</span>
                            </Link>
                            <button className="quick-action-btn" disabled>
                                <FiActivity size={20} />
                                <span>Export Data</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* User Distribution */}
                    <motion.div
                        className="content-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <div className="card-header">
                            <h3>User Distribution</h3>
                        </div>
                        <div className="distribution-chart">
                            <div className="distribution-item">
                                <div className="distribution-bar students" style={{ width: '70%' }}></div>
                                <div className="distribution-label">
                                    <span>Students</span>
                                    <span className="distribution-value">{stats.totalStudents || 0}</span>
                                </div>
                            </div>
                            <div className="distribution-item">
                                <div className="distribution-bar mentors" style={{ width: '20%' }}></div>
                                <div className="distribution-label">
                                    <span>Mentors</span>
                                    <span className="distribution-value">{stats.totalMentors || 0}</span>
                                </div>
                            </div>
                            <div className="distribution-item">
                                <div className="distribution-bar admins" style={{ width: '10%' }}></div>
                                <div className="distribution-label">
                                    <span>Admins</span>
                                    <span className="distribution-value">3</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
