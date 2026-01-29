import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sessionAPI } from '../../api';
import { FiArrowLeft, FiSearch, FiBell, FiUser, FiLogOut, FiPlay, FiCheckCircle, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './Dashboard.css';

const SessionTracking = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [trackings, setTrackings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrackings();
    }, []);

    const fetchTrackings = async () => {
        try {
            const response = await sessionAPI.getTracking();
            setTrackings(response.data);
        } catch (error) {
            console.error('Failed to fetch session trackings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

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
                    </button>
                    <button className="icon-btn">
                        <FiUser />
                    </button>
                    <div className="user-menu">
                        <img src={user?.avatar} alt={user?.name} className="avatar" />
                        <button className="icon-btn" onClick={handleLogout}>
                            <FiLogOut />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="dashboard-content">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/student')}>
                        <FiArrowLeft /> Back to Dashboard
                    </button>
                    <h1>Session Tracking</h1>
                </div>

                <motion.div
                    className="glass-card"
                    style={{ padding: 'var(--spacing-xl)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="sessions-grid">
                        {loading ? (
                            <div className="loading-spinner" style={{ margin: '40px auto' }}></div>
                        ) : trackings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                                <FiPlay style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
                                <p>No sessions tracked yet. Start watching courses to track your progress!</p>
                                <button
                                    className="btn btn-primary"
                                    style={{ marginTop: 'var(--spacing-md)' }}
                                    onClick={() => navigate('/student/resources')}
                                >
                                    Browse Learning Resources
                                </button>
                            </div>
                        ) : (
                            trackings.map((tracking, index) => (
                                <motion.div
                                    key={tracking.id}
                                    className="session-card glass-card"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: 'var(--radius-md)',
                                        background: tracking.attendanceMarked ? 'var(--green-light)' : 'var(--primary-100)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: tracking.attendanceMarked ? 'var(--green)' : 'var(--primary-500)',
                                        fontSize: 'var(--text-xl)'
                                    }}>
                                        {tracking.attendanceMarked ? <FiCheckCircle /> : <FiPlay />}
                                    </div>

                                    <div className="course-info" style={{ flex: 1 }}>
                                        <div className="course-title">{tracking.resource?.title}</div>
                                        <div className="course-meta">
                                            <FiClock /> {Math.round(tracking.watchDuration / 60)} min watched •
                                            {tracking.attendanceMarked ? (
                                                <span style={{ color: 'var(--green)' }}> Attendance Marked ✓</span>
                                            ) : (
                                                <span style={{ color: 'var(--orange)' }}> {Math.round(tracking.completionPercentage)}% completed</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="session-progress">
                                        <div className="session-progress-bar">
                                            <div
                                                className="session-progress-fill"
                                                style={{
                                                    width: `${tracking.completionPercentage}%`,
                                                    background: tracking.completionPercentage >= 80 ? 'var(--green)' : 'var(--primary-500)'
                                                }}
                                            />
                                        </div>
                                        <span style={{
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: '600',
                                            color: tracking.completionPercentage >= 80 ? 'var(--green)' : 'var(--primary-500)'
                                        }}>
                                            {Math.round(tracking.completionPercentage)}%
                                        </span>
                                    </div>

                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => navigate('/student/resources')}
                                    >
                                        View
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Summary Stats */}
                    {trackings.length > 0 && (
                        <div className="stats-grid" style={{ marginTop: 'var(--spacing-xl)', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="stat-card stat-card-teal">
                                <span className="stat-label">Total Sessions</span>
                                <span className="stat-value">{trackings.length}</span>
                            </div>
                            <div className="stat-card stat-card-blue">
                                <span className="stat-label">Completed</span>
                                <span className="stat-value">{trackings.filter(t => t.attendanceMarked).length}</span>
                            </div>
                            <div className="stat-card stat-card-orange">
                                <span className="stat-label">In Progress</span>
                                <span className="stat-value">{trackings.filter(t => !t.attendanceMarked).length}</span>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default SessionTracking;
