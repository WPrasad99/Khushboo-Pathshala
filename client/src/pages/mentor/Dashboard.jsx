import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, mentorshipAPI } from '../../api';
import {
    FiBell, FiUsers, FiCalendar, FiAlertTriangle, FiCheckCircle,
    FiClock, FiArrowRight, FiMessageCircle, FiActivity, FiX,
    FiUpload, FiTrendingUp, FiBook
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import '../student/Dashboard.css';

const MentorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [mentorships, setMentorships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dashboardRes, mentorshipRes] = await Promise.all([
                userAPI.getDashboard(),
                mentorshipAPI.get()
            ]);
            setDashboardData(dashboardRes.data);
            setMentorships(Array.isArray(mentorshipRes.data) ? mentorshipRes.data : []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            // Mock data for demo
            setMentorships([
                { id: 1, mentee: { name: 'Priya Sharma', email: 'priya@demo.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya' }, status: 'active', lastActive: new Date() },
                { id: 2, mentee: { name: 'Rahul Verma', email: 'rahul@demo.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul' }, status: 'at-risk', lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                { id: 3, mentee: { name: 'Ananya Patel', email: 'ananya@demo.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ananya' }, status: 'active', lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            ]);
            setDashboardData({
                totalMentees: 3,
                uploadedResources: 12,
                recentMeetings: [
                    { id: 1, mentorship: { mentee: { name: 'Priya Sharma' } }, meetingDate: new Date(), duration: 30 },
                    { id: 2, mentorship: { mentee: { name: 'Rahul Verma' } }, meetingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), duration: 45 },
                ],
                pendingFeedback: 2
            });
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'at-risk': return 'status-at-risk';
            case 'inactive': return 'status-inactive';
            default: return 'status-active';
        }
    };

    const atRiskMentees = mentorships.filter(m => m.status === 'at-risk' ||
        (new Date() - new Date(m.lastActive)) > 5 * 24 * 60 * 60 * 1000);
    const activeMentees = mentorships.filter(m => m.status !== 'at-risk' &&
        (new Date() - new Date(m.lastActive)) <= 5 * 24 * 60 * 60 * 1000);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-content">
            {/* Header */}
            <header className="dashboard-header">
                <div>
                    <h1 className="welcome-title">Hello, {user?.name?.split(' ')[0]} 👋</h1>
                    <p className="welcome-subtitle">Here's your mentorship overview for today.</p>
                </div>
                <div className="header-actions">
                    <div className="notification-wrapper">
                        <button
                            className="header-icon-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <FiBell />
                            {dashboardData?.pendingFeedback > 0 && (
                                <span className="notification-badge">{dashboardData.pendingFeedback}</span>
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
                                        <h4>Pending Actions</h4>
                                        <button onClick={() => setShowNotifications(false)}>
                                            <FiX />
                                        </button>
                                    </div>
                                    <div className="notification-list">
                                        <div className="notification-item">
                                            <div className="notif-icon warning">
                                                <FiAlertTriangle size={14} />
                                            </div>
                                            <div className="notif-content">
                                                <span className="notif-title">{atRiskMentees.length} mentees need attention</span>
                                                <span className="notif-time">Review now</span>
                                            </div>
                                        </div>
                                        <div className="notification-item">
                                            <div className="notif-icon info">
                                                <FiMessageCircle size={14} />
                                            </div>
                                            <div className="notif-content">
                                                <span className="notif-title">2 feedback requests pending</span>
                                                <span className="notif-time">Due today</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Quick Answer Stats - "What should I do next?" */}
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
                        <span className="stat-label">Total Mentees</span>
                        <span className="stat-value">{mentorships.length}</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card stat-orange"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ cursor: 'pointer' }}
                    onClick={() => document.getElementById('at-risk-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <div className="stat-icon">
                        <FiAlertTriangle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Need Attention</span>
                        <span className="stat-value">{atRiskMentees.length}</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card stat-blue"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="stat-icon">
                        <FiCalendar size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Meetings This Week</span>
                        <span className="stat-value">{dashboardData?.recentMeetings?.length || 0}</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card stat-purple"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="stat-icon">
                        <FiBook size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Resources Shared</span>
                        <span className="stat-value">{dashboardData?.uploadedResources || 0}</span>
                    </div>
                </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="content-grid">
                {/* Left Column */}
                <div className="grid-col-left">
                    {/* At-Risk Mentees - Priority Section */}
                    {atRiskMentees.length > 0 && (
                        <motion.div
                            id="at-risk-section"
                            className="content-card priority-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="card-header">
                                <h3><FiAlertTriangle className="icon-warning" /> Needs Attention</h3>
                                <span className="badge-count">{atRiskMentees.length}</span>
                            </div>
                            <div className="mentee-list">
                                {atRiskMentees.map((mentorship) => (
                                    <div key={mentorship.id} className="mentee-item at-risk">
                                        <img
                                            src={mentorship.mentee?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                            alt={mentorship.mentee?.name}
                                            className="mentee-avatar"
                                        />
                                        <div className="mentee-info">
                                            <span className="mentee-name">{mentorship.mentee?.name}</span>
                                            <span className="mentee-status">
                                                <FiClock size={12} /> Inactive for {formatTimeAgo(mentorship.lastActive)}
                                            </span>
                                        </div>
                                        <button className="action-btn danger">
                                            Reach Out <FiArrowRight size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Active Mentees */}
                    <motion.div
                        className="content-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="card-header">
                            <h3><FiCheckCircle className="icon-success" /> Active Mentees</h3>
                            <Link to="/mentor/meetings" className="btn-link">View All</Link>
                        </div>
                        <div className="mentee-list">
                            {activeMentees.length > 0 ? activeMentees.map((mentorship) => (
                                <div key={mentorship.id} className="mentee-item">
                                    <img
                                        src={mentorship.mentee?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                        alt={mentorship.mentee?.name}
                                        className="mentee-avatar"
                                    />
                                    <div className="mentee-info">
                                        <span className="mentee-name">{mentorship.mentee?.name}</span>
                                        <span className="mentee-email">{mentorship.mentee?.email}</span>
                                    </div>
                                    <div className={`status-indicator ${getStatusClass(mentorship.status)}`}>
                                        <span className="status-dot"></span>
                                        Active
                                    </div>
                                </div>
                            )) : (
                                <div className="empty-state">No active mentees</div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column */}
                <div className="grid-col-right">
                    {/* Upcoming Meetings */}
                    <motion.div
                        className="content-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="card-header">
                            <h3>Upcoming Meetings</h3>
                            <Link to="/mentor/meetings" className="btn-icon"><FiArrowRight /></Link>
                        </div>
                        <div className="sessions-list">
                            {dashboardData?.recentMeetings?.slice(0, 3).map((meeting, i) => (
                                <div key={meeting.id || i} className="session-item">
                                    <div className="session-date">
                                        <span className="date-day">{new Date(meeting.meetingDate).getDate()}</span>
                                        <span className="date-month">{new Date(meeting.meetingDate).toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                    <div className="session-info">
                                        <span className="session-title">Meeting with {meeting.mentorship?.mentee?.name}</span>
                                        <span className="session-time">
                                            <FiClock size={12} /> {meeting.duration} min
                                        </span>
                                    </div>
                                    {i === 0 && <span className="badge-soon">Next</span>}
                                </div>
                            )) || (
                                    <div className="empty-state">No scheduled meetings</div>
                                )}
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
                            <Link to="/mentor/upload" className="quick-action-btn">
                                <FiUpload size={20} />
                                <span>Upload Resource</span>
                            </Link>
                            <Link to="/mentor/meetings" className="quick-action-btn">
                                <FiCalendar size={20} />
                                <span>Schedule Meeting</span>
                            </Link>
                            <Link to="/mentor/attendance" className="quick-action-btn">
                                <FiCheckCircle size={20} />
                                <span>Mark Attendance</span>
                            </Link>
                            <button className="quick-action-btn" disabled>
                                <FiTrendingUp size={20} />
                                <span>View Reports</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Activity Timeline */}
                    <motion.div
                        className="content-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <div className="card-header">
                            <h3>Recent Activity</h3>
                        </div>
                        <div className="announcements-timeline">
                            <div className="timeline-item">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                    <h4>Priya completed React Basics</h4>
                                    <p>Course completion rate: 100%</p>
                                    <span className="time-ago">2h ago</span>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <div className="timeline-dot warning"></div>
                                <div className="timeline-content">
                                    <h4>Rahul hasn't logged in</h4>
                                    <p>Last active 7 days ago</p>
                                    <span className="time-ago">Action needed</span>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                    <h4>New resource uploaded</h4>
                                    <p>JavaScript Fundamentals</p>
                                    <span className="time-ago">Yesterday</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default MentorDashboard;
