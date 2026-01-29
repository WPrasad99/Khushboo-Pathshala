import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mentorshipAPI } from '../../api';
import { FiArrowLeft, FiSearch, FiBell, FiUser, FiLogOut, FiCalendar, FiMessageCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './Dashboard.css';

const MentorProgram = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mentorship, setMentorship] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMentorshipData();
    }, []);

    const fetchMentorshipData = async () => {
        try {
            const [mentorshipRes, meetingsRes] = await Promise.all([
                mentorshipAPI.get(),
                mentorshipAPI.getMeetings()
            ]);
            setMentorship(mentorshipRes.data);
            setMeetings(meetingsRes.data);
        } catch (error) {
            console.error('Failed to fetch mentorship data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('en-US', { month: 'short' })
        };
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
                    <h1>Mentor–Mentee Program</h1>
                </div>

                {loading ? (
                    <div className="glass-card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ marginTop: 'var(--spacing-md)' }}>Loading mentorship data...</p>
                    </div>
                ) : (
                    <div className="mentor-grid">
                        {/* Your Mentor */}
                        <motion.div
                            className="glass-card"
                            style={{ padding: 'var(--spacing-xl)' }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Your Mentor</h3>

                            {mentorship?.mentor ? (
                                <div className="mentor-card">
                                    <img
                                        src={mentorship.mentor.avatar}
                                        alt={mentorship.mentor.name}
                                        className="avatar avatar-xl"
                                    />
                                    <div className="mentor-info">
                                        <h4>{mentorship.mentor.name}</h4>
                                        <p>Senior Software Engineer</p>
                                        <p style={{ fontSize: 'var(--text-xs)' }}>{mentorship.mentor.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                                    <FiUser style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
                                    <p>No mentor assigned yet.</p>
                                </div>
                            )}

                            <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>Recent Meetings</h3>

                            <div className="meetings-list">
                                {meetings.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No meetings scheduled yet.</p>
                                ) : (
                                    meetings.slice(0, 3).map((meeting) => {
                                        const { day, month } = formatDate(meeting.meetingDate);
                                        return (
                                            <div key={meeting.id} className="meeting-item">
                                                <div style={{ textAlign: 'center', minWidth: '50px' }}>
                                                    <div className="meeting-date">{day}</div>
                                                    <div className="meeting-month">{month}</div>
                                                </div>
                                                <div className="meeting-content">
                                                    <h4>Feedback:</h4>
                                                    <p>"{meeting.feedback || meeting.discussionSummary}"</p>
                                                </div>
                                                <button className="btn btn-secondary btn-sm">View</button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>

                        {/* Your Profile & Resources */}
                        <motion.div
                            className="glass-card"
                            style={{ padding: 'var(--spacing-xl)' }}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Your Profile</h3>

                            <div className="mentor-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                                <img
                                    src={user?.avatar}
                                    alt={user?.name}
                                    className="avatar avatar-xl"
                                />
                                <div className="mentor-info">
                                    <h4>{user?.name}</h4>
                                    <p>{user?.educationLevel || 'B.Tech'} Student</p>
                                    <p style={{ fontSize: 'var(--text-xs)' }}>{user?.email}</p>
                                </div>
                            </div>

                            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Quick Actions</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                <button className="btn btn-primary w-full" disabled>
                                    <FiCalendar /> Schedule Meeting
                                </button>
                                <button className="btn btn-secondary w-full" disabled>
                                    <FiMessageCircle /> Send Message
                                </button>
                            </div>

                            <div style={{
                                marginTop: 'var(--spacing-xl)',
                                padding: 'var(--spacing-md)',
                                background: 'rgba(74, 144, 226, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--text-sm)',
                                color: 'var(--text-secondary)'
                            }}>
                                <strong>Tip:</strong> Regular meetings with your mentor help you stay on track.
                                Schedule at least one session per month to discuss your progress and goals.
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MentorProgram;
