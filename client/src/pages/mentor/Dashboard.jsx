import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, mentorshipAPI, resourceAPI, adminAPI, batchAPI, mentorAPI, announcementAPI, forumAPI, assignmentAPI, quizAPI } from '../../api';
import {
    FiSearch, FiBell, FiUser, FiLogOut, FiUsers, FiBookOpen,
    FiCalendar, FiPlus, FiUpload, FiSettings, FiCheckCircle,
    FiMessageSquare, FiLayers, FiBarChart2, FiClock, FiAlertCircle, FiChevronDown, FiChevronUp, FiFileText, FiEdit2, FiArrowRight, FiTrash2, FiMessageCircle, FiMenu, FiX, FiZap,
    FiSun, FiMoon
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import '../student/Dashboard.css';
import '../admin/AdminDashboard.css';
import './MentorDashboard.css';

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
import MessagingPage from '../MessagingPage';
import CalendarWidget from '../../components/dashboard/CalendarWidget';

const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const MentorDashboard = () => {
    const { user, logout, socket } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [batches, setBatches] = useState([]);
    const [mentorStudents, setMentorStudents] = useState([]);
    const [meetingLogs, setMeetingLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const [announcements, setAnnouncements] = useState([]);
    const [startChatUser, setStartChatUser] = useState(null);

    // Theme Architecture State
    const [theme, setTheme] = useState(localStorage.getItem('admin-theme') || 'light');

    useEffect(() => {
        fetchData();
    }, []);

    // Theme Application Effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('admin-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        if (socket) {
            socket.on('notification', () => {
                setUnreadNotifications(prev => prev + 1);
                fetchData();
            });
            return () => socket.off('notification');
        }
    }, [socket]);

    const handleStartChat = (student) => {
        setStartChatUser(student);
        setActiveTab('messages');
    };

    const handleClearStartChat = () => {
        setStartChatUser(null);
    };

    const fetchData = async () => {
        try {
            const [dashboardRes, batchesRes, studentsRes, meetingsRes, announcementsRes] = await Promise.all([
                userAPI.getDashboard(),
                mentorAPI.getBatches(),
                mentorAPI.getStudents(),
                mentorAPI.getMeetings(),
                announcementAPI.getAll()
            ]);

            setDashboardData(dashboardRes.data);
            setBatches(batchesRes.data || []);
            setMentorStudents(studentsRes.data || []);
            setMeetingLogs(meetingsRes.data || []);
            setAnnouncements(announcementsRes.data || []);

            if (dashboardRes.data.unreadCount) {
                setUnreadNotifications(dashboardRes.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="glass-card p-xl">
                    <div className="loading-spinner"></div>
                    <p>Loading Mentor Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mentor-dashboard-page">
            <nav className="mentor-navbar">
                <div className="navbar-brand-mentor">
                    <img src="/logo.png" alt="Logo" className="navbar-logo" style={{ height: '40px', width: 'auto' }} />
                    <span className="mentor-logo-text">Khushboo Pathshala</span>
                </div>

                {/* Mobile Menu Button - Visible only on mobile */}
                <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                <div className="navbar-actions-mentor">
                    <div className="mentor-tabs-container">
                        <div className="mentor-tabs nav-links-desktop">
                            <button
                                className={`mentor-tab ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <FiBarChart2 /> Overview
                            </button>
                            <button
                                className={`mentor-tab ${activeTab === 'batches' ? 'active' : ''}`}
                                onClick={() => setActiveTab('batches')}
                            >
                                <FiLayers /> Batches
                            </button>
                            <button
                                className={`mentor-tab ${activeTab === 'sessions' ? 'active' : ''}`}
                                onClick={() => setActiveTab('sessions')}
                            >
                                <FiBookOpen /> Sessions
                            </button>
                            <button
                                className={`mentor-tab ${activeTab === 'mentorship' ? 'active' : ''}`}
                                onClick={() => setActiveTab('mentorship')}
                            >
                                <FiUsers /> Mentorship
                            </button>
                            <button
                                className={`mentor-tab ${activeTab === 'forum' ? 'active' : ''}`}
                                onClick={() => setActiveTab('forum')}
                            >
                                <FiMessageSquare /> Forum
                            </button>
                            <button
                                className={`mentor-tab ${activeTab === 'assignments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('assignments')}
                            >
                                <FiFileText /> Assignments
                            </button>
                            <button
                                className={`mentor-tab ${activeTab === 'messages' ? 'active' : ''}`}
                                onClick={() => setActiveTab('messages')}
                            >
                                <FiMessageCircle /> Messages
                            </button>
                        </div>
                    </div>

                    <div className="navbar-right-actions">
                        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'light' ? <FiMoon /> : <FiSun />}
                        </button>
                        <button className="icon-btn" style={{ position: 'relative' }}>
                            <FiBell />
                            {unreadNotifications > 0 && <span className="notification-dot"></span>}
                        </button>
                        <div className="user-info-pill" onClick={() => navigate('/settings')}>
                            <img src={user?.avatar} alt={user?.name} className="avatar-sm" />
                            <span>{user?.name?.split(' ')[0]}</span>
                        </div>
                        <button className="icon-btn" onClick={handleLogout} title="Logout">
                            <FiLogOut />
                        </button>
                        {/* Mobile Toggle moved outside */}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu - Sidebar Style via Portal */}
            {ReactDOM.createPortal(
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className="mobile-menu-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <motion.div
                                className="mobile-menu"
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.3 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="mobile-menu-header">
                                    <h3>Menu</h3>
                                    <button onClick={() => setIsMobileMenuOpen(false)}>
                                        <FiX size={24} />
                                    </button>
                                </div>
                                <div className="mobile-menu-links">
                                    <button className={`mobile-menu-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}>
                                        <FiBarChart2 /> <span>Overview</span>
                                    </button>
                                    <button className={`mobile-menu-link ${activeTab === 'batches' ? 'active' : ''}`} onClick={() => { setActiveTab('batches'); setIsMobileMenuOpen(false); }}>
                                        <FiLayers /> <span>Batches</span>
                                    </button>
                                    <button className={`mobile-menu-link ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => { setActiveTab('sessions'); setIsMobileMenuOpen(false); }}>
                                        <FiBookOpen /> <span>Sessions</span>
                                    </button>
                                    <button className={`mobile-menu-link ${activeTab === 'mentorship' ? 'active' : ''}`} onClick={() => { setActiveTab('mentorship'); setIsMobileMenuOpen(false); }}>
                                        <FiUsers /> <span>Mentorship</span>
                                    </button>
                                    <button className={`mobile-menu-link ${activeTab === 'forum' ? 'active' : ''}`} onClick={() => { setActiveTab('forum'); setIsMobileMenuOpen(false); }}>
                                        <FiMessageSquare /> <span>Forum</span>
                                    </button>
                                    <button className={`mobile-menu-link ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => { setActiveTab('assignments'); setIsMobileMenuOpen(false); }}>
                                        <FiFileText /> <span>Assignments</span>
                                    </button>
                                    <button className={`mobile-menu-link ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }}>
                                        <FiMessageCircle /> <span>Messages</span>
                                    </button>
                                </div>
                                <div className="mobile-menu-footer">
                                    <button className="mobile-settings-btn" onClick={() => { navigate('/settings'); setIsMobileMenuOpen(false); }}>
                                        <FiSettings />
                                        <span>Settings</span>
                                    </button>
                                    <button className="mobile-logout-btn" onClick={() => { logout(); navigate('/login'); setIsMobileMenuOpen(false); }}>
                                        <FiLogOut />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}


            <div className="dashboard-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && (
                            <div className="dashboard-header-modern" style={{ marginBottom: '30px' }}>
                                <div>
                                    <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
                                        {activeTab === 'overview'
                                            ? `Welcome back, ${user?.name?.split(' ')[0]}! 👋`
                                            : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                    </h1>
                                    <p style={{ color: 'var(--color-text-)', marginTop: '4px', fontWeight: 'var(--fw-medium)' }}>{formatDate(new Date())}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'overview' && (
                            <OverviewSection
                                data={dashboardData}
                                studentsCount={mentorStudents.length}
                                setTab={setActiveTab}
                                announcements={announcements}
                                meetingLogs={meetingLogs}
                                batches={batches}
                            />
                        )}
                        {activeTab === 'batches' && <BatchesSection batches={batches} />}
                        {activeTab === 'sessions' && <SessionsSection batches={batches} />}
                        {activeTab === 'mentorship' && <MentorshipSection students={mentorStudents} batches={batches} logs={meetingLogs} onRefresh={fetchData} onStartChat={handleStartChat} />}
                        {activeTab === 'forum' && <ForumSection batches={batches} />}
                        {activeTab === 'assignments' && <AssignmentsSection batches={batches} />}
                        {activeTab === 'messages' && (
                            <div style={{
                                position: 'fixed',
                                top: '80px',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 100,
                                background: 'var(--bg-secondary)'
                            }}>
                                <MessagingPage initialChatUser={startChatUser} onClearInitialChatUser={handleClearStartChat} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div >
    );
};

const OverviewSection = ({ data, studentsCount, setTab, announcements, meetingLogs, batches }) => {
    const attendanceSeries = useMemo(() => {
        const bucket = new Map();
        const today = new Date();

        meetingLogs.forEach((meeting) => {
            const key = new Date(meeting.meetingDate).toISOString().slice(0, 10);
            bucket.set(key, (bucket.get(key) || 0) + 1);
        });

        return Array.from({ length: 7 }).map((_, offset) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - offset));
            const key = date.toISOString().slice(0, 10);

            return {
                label: date.toLocaleDateString(undefined, { weekday: 'short' }),
                value: bucket.get(key) || 0
            };
        });
    }, [meetingLogs]);

    const attendanceMax = Math.max(...attendanceSeries.map((item) => item.value), 1);
    const attendancePoints = attendanceSeries
        .map((item, index) => {
            const x = (index / Math.max(1, attendanceSeries.length - 1)) * 300;
            const y = 110 - (item.value / attendanceMax) * 100;
            return `${x},${y}`;
        })
        .join(' ');

    const submissionBars = useMemo(() => {
        if (!batches || batches.length === 0) {
            return [];
        }

        return batches.slice(0, 5).map((batch) => ({
            label: batch.name.length > 10 ? `${batch.name.slice(0, 10)}...` : batch.name,
            value: batch.studentsCount > 0 ? Math.min(100, Math.round((batch.studentsCount / (studentsCount || 1)) * 100)) : 0
        }));
    }, [batches, studentsCount]);

    const donutSegments = useMemo(() => {
        if (!batches || batches.length === 0) {
            return [];
        }

        const palette = ['#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444'];
        return batches.slice(0, 5).map((batch, index) => ({
            label: batch.name,
            value: batch.studentsCount || 0,
            color: palette[index % palette.length]
        }));
    }, [batches]);

    const donutTotal = Math.max(
        donutSegments.reduce((sum, segment) => sum + segment.value, 0),
        1
    );
    const donutCircumference = 2 * Math.PI * 46;
    let cumulativeFraction = 0;

    const upcomingMeetings = useMemo(
        () =>
            [...meetingLogs]
                .filter((meeting) => new Date(meeting.meetingDate).getTime() >= Date.now())
                .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate))
                .slice(0, 4),
        [meetingLogs]
    );

    const kpiItems = [
        { label: 'Assigned Students', value: studentsCount, icon: <FiUsers /> },
        { label: 'Uploaded Resources', value: data?.uploadedResources || 0, icon: <FiBookOpen /> },
        { label: 'Recent Meetings', value: meetingLogs.length, icon: <FiCalendar /> },
        { label: 'Announcements', value: announcements?.length || 0, icon: <FiBell /> }
    ];

    return (
        <div className="mentor-overview-v2">
            <section className="mentor-kpi-grid">
                {kpiItems.map((item) => (
                    <article key={item.label} className="mentor-kpi-card">
                        <span className="mentor-kpi-icon">{item.icon}</span>
                        <strong>{item.value}</strong>
                        <small>{item.label}</small>
                    </article>
                ))}
            </section>

            <section className="mentor-analytics-grid">
                <article className="mentor-analytics-card">
                    <header>
                        <h3>Attendance Trend</h3>
                        <span>Last 7 days</span>
                    </header>

                    <svg viewBox="0 0 300 120" role="img" aria-label="Attendance trend line chart">
                        <polyline className="mentor-line-area" points={`0,110 ${attendancePoints} 300,110`} />
                        <polyline className="mentor-line-path" points={attendancePoints} />
                        {attendanceSeries.map((item, index) => {
                            const x = (index / Math.max(1, attendanceSeries.length - 1)) * 300;
                            const y = 110 - (item.value / attendanceMax) * 100;
                            return <circle key={item.label} cx={x} cy={y} r="3" className="mentor-line-point" />;
                        })}
                    </svg>

                    <div className="mentor-line-axis">
                        {attendanceSeries.map((item) => (
                            <span key={item.label}>{item.label}</span>
                        ))}
                    </div>
                </article>

                <article className="mentor-analytics-card">
                    <header>
                        <h3>Submission Rate</h3>
                        <span>Estimated by batch</span>
                    </header>

                    <div className="mentor-bar-chart">
                        {submissionBars.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                                No batch data available yet.
                            </div>
                        ) : (
                            submissionBars.map((bar) => (
                                <div key={bar.label} className="mentor-bar-item">
                                    <div className="mentor-bar-track">
                                        <div className="mentor-bar-fill" style={{ height: `${bar.value}%` }} />
                                    </div>
                                    <small>{bar.label}</small>
                                    <strong>{bar.value}%</strong>
                                </div>
                            ))
                        )}
                    </div>
                </article>

                <article className="mentor-analytics-card">
                    <header>
                        <h3>Batch Comparison</h3>
                        <span>Student distribution</span>
                    </header>

                    {donutSegments.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                            No batch data available yet.
                        </div>
                    ) : (
                        <>
                            <div className="mentor-donut-layout">
                                <svg viewBox="0 0 120 120" className="mentor-donut-chart" role="img" aria-label="Batch distribution donut chart">
                                    <circle cx="60" cy="60" r="46" className="mentor-donut-base" />
                                    {donutSegments.map((segment) => {
                                        const fraction = segment.value / donutTotal;
                                        const dash = fraction * donutCircumference;
                                        const offset = -cumulativeFraction * donutCircumference;
                                        cumulativeFraction += fraction;

                                        return (
                                            <circle
                                                key={segment.label}
                                                cx="60"
                                                cy="60"
                                                r="46"
                                                className="mentor-donut-segment"
                                                style={{
                                                    stroke: segment.color,
                                                    strokeDasharray: `${dash} ${donutCircumference - dash}`,
                                                    strokeDashoffset: offset
                                                }}
                                            />
                                        );
                                    })}
                                </svg>

                                <div className="mentor-donut-center">
                                    <strong>{donutTotal}</strong>
                                    <small>Students</small>
                                </div>
                            </div>

                            <div className="mentor-donut-legend">
                                {donutSegments.map((segment) => (
                                    <div key={segment.label} className="mentor-donut-legend-row">
                                        <span className="mentor-dot" style={{ background: segment.color }} />
                                        <span>{segment.label}</span>
                                        <strong>{segment.value}</strong>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </article>
            </section>

            <section className="mentor-insights-grid">
                <article className="mentor-insight-card">
                    <header>
                        <h3>Recent Updates</h3>
                        <span>{announcements?.length || 0}</span>
                    </header>

                    <div className="mentor-insight-list">
                        {announcements && announcements.length > 0 ? (
                            announcements.slice(0, 4).map((announcement) => (
                                <div key={announcement.id} className="mentor-insight-item">
                                    <strong>{announcement.title}</strong>
                                    <p>{announcement.content}</p>
                                    <small>{new Date(announcement.createdAt).toLocaleDateString()}</small>
                                </div>
                            ))
                        ) : (
                            <div className="mentor-empty-state">No announcements yet.</div>
                        )}
                    </div>
                </article>

                <article className="mentor-insight-card">
                    <header>
                        <h3>Upcoming Meetings</h3>
                        <span>{upcomingMeetings.length}</span>
                    </header>

                    {upcomingMeetings.length > 0 ? (
                        <div className="mentor-insight-list">
                            {upcomingMeetings.map((meeting) => (
                                <div key={meeting.id} className="mentor-meeting-item">
                                    <div>
                                        <strong>{new Date(meeting.meetingDate).toLocaleDateString()}</strong>
                                        <p>{new Date(meeting.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <span>{meeting.duration} min</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <CalendarWidget meetings={meetingLogs} />
                    )}
                </article>
            </section>
        </div>
    );
};

const BatchesSection = ({ batches }) => {
    const [selectedBatch, setSelectedBatch] = useState(null);

    return (
        <div className="batches-container">
            <AnimatePresence>
                {selectedBatch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                        }}
                        onClick={() => setSelectedBatch(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-secondary)',
                                borderRadius: '24px',
                                padding: '32px',
                                width: '100%',
                                maxWidth: '800px',
                                maxHeight: '85vh',
                                overflowY: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 'var(--fs-h2)', color: 'var(--text-primary)' }}>{selectedBatch.name}</h2>
                                    <p style={{ margin: '4px 0 0', color: 'var(--color-text-)' }}>{selectedBatch.studentsCount} Students • {selectedBatch.status}</p>
                                </div>
                                <button onClick={() => setSelectedBatch(null)} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-)' }}>
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table className="student-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                            <th style={{ padding: 'var(--space-24)', textAlign: 'left', color: 'var(--color-text-)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)' }}>Student</th>
                                            <th style={{ padding: 'var(--space-24)', textAlign: 'left', color: 'var(--color-text-)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)' }}>Joined Date</th>
                                            <th style={{ padding: 'var(--space-24)', textAlign: 'right', color: 'var(--color-text-)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBatch.students?.map(s => (
                                            <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: 'var(--space-24)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <img src={s.avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                                        <div>
                                                            <div style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{s.name}</div>
                                                            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)' }}>{s.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: 'var(--space-24)', color: 'var(--color-text-)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                                                <td style={{ padding: 'var(--space-24)', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', opacity: 0.5 }}>
                                                        <button style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'var(--bg-secondary)', color: 'var(--color-text-)', cursor: 'not-allowed' }}><FiUser size={14} /></button>
                                                        <button style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'var(--bg-secondary)', color: 'var(--color-text-)', cursor: 'not-allowed' }}><FiEdit2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', marginBottom: '24px' }}>Your Batches</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {batches && batches.length > 0 ? (
                    batches.map(batch => (
                        <motion.div
                            key={batch.id}
                            whileHover={{ y: -5 }}
                            className="glass-card"
                            style={{
                                padding: '0',
                                overflow: 'hidden',
                                background: 'var(--bg-secondary)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '20px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Creative Header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                padding: '24px',
                                borderBottom: '1px solid #e2e8f0',
                                position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute', top: '20px', right: '20px',
                                    background: '#dbeafe', color: '#1e40af',
                                    padding: '4px 12px', borderRadius: '20px',
                                    fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)'
                                }}>
                                    {batch.status}
                                </div>
                                <div style={{
                                    width: '48px', height: '48px',
                                    background: 'var(--bg-secondary)', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <FiLayers size={24} color="#3b82f6" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: 'var(--fs-h3)', color: 'var(--color-text-)' }}>{batch.name}</h3>
                                <p style={{ margin: '4px 0 0', fontSize: 'var(--fs-body)', color: 'var(--color-text-)' }}>Batch ID: #{batch.id.substring(0, 8)}</p>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', marginBottom: '4px' }}>Students</div>
                                        <div style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-)' }}>{batch.studentsCount}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', marginBottom: '4px', textAlign: 'right' }}>Mentors</div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingLeft: '8px' }}>
                                            {batch.assignedMentors?.map((m, i) => (
                                                <img
                                                    key={m.id}
                                                    src={m.avatar}
                                                    alt={m.name}
                                                    title={m.name}
                                                    style={{
                                                        width: '28px', height: '28px', borderRadius: '50%',
                                                        border: '2px solid white', marginLeft: i > 0 ? '-10px' : '0',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto' }}>
                                    <button
                                        onClick={() => setSelectedBatch(batch)}
                                        style={{
                                            width: '100%',
                                            padding: 'var(--space-20)',
                                            background: 'var(--bg-tertiary)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            color: '#3b82f6',
                                            fontWeight: 'var(--fw-semibold)',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => { e.target.style.background = '#e0f2fe'; e.target.style.borderColor = '#bae6fd'; }}
                                        onMouseOut={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; }}
                                    >
                                        View Students <FiArrowRight />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--color-text-)' }}>
                        <div style={{ background: 'var(--bg-tertiary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <FiLayers size={32} opacity={0.5} />
                        </div>
                        <h3>No Batches Assigned</h3>
                        <p>You haven't been assigned to any batches yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SessionsSection = ({ batches }) => {
    const [showModal, setShowModal] = useState(false);
    const [uploadType, setUploadType] = useState(null); // 'SESSION' or 'RESOURCE'
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        videoUrl: '',
        batchId: '',
        duration: '45'
    });

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    useEffect(() => {
        fetchUploads();
    }, []);

    const fetchUploads = async () => {
        try {
            setLoading(true);
            const response = await mentorAPI.getUploads();
            setUploads(response.data || []);
        } catch (error) {
            console.error('Failed to fetch uploads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (type) => {
        setUploadType(type);
        setFile(null);
        setFormData({
            title: '',
            description: '',
            videoUrl: '',
            batchId: '',
            duration: '45'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (uploadType === 'SESSION') {
                await mentorAPI.uploadSession(formData);
            } else {
                // Resource Upload Logic
                if (!file) {
                    alert('Please select a file to upload');
                    setIsSubmitting(false);
                    return;
                }

                const data = new FormData();
                data.append('title', formData.title);
                data.append('description', formData.description || '');
                data.append('batchId', formData.batchId);
                data.append('file', file);

                await mentorAPI.uploadResource(data);
            }

            setShowModal(false);
            fetchUploads(); // Refresh list
            alert(`${uploadType === 'SESSION' ? 'Session' : 'Resource'} uploaded successfully!`);
        } catch (error) {
            console.error('Upload error:', error);
            alert(error.response?.data?.error || `Failed to upload ${uploadType.toLowerCase()}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this upload?')) return;

        try {
            await mentorAPI.deleteUpload(id);
            fetchUploads();
            alert('Deleted successfully!');
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete');
        }
    };

    return (
        <div className="sessions-container">
            <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h3 className="mentor-section-title">Learning Sessions & Resources Management</h3>
                </div>

                <div className="mentor-grid" style={{ marginBottom: '30px' }}>
                    <div
                        className="compact-upload-zone"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenModal('SESSION')}
                    >
                        <FiUpload size={32} color="#3b82f6" />
                        <h4 style={{ marginTop: '12px' }}>Upload Session Video</h4>
                        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)' }}>MP4, WebM or YouTube link</p>
                    </div>
                    <div
                        className="compact-upload-zone"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenModal('RESOURCE')}
                    >
                        <FiFileText size={32} color="#10b981" />
                        <h4 style={{ marginTop: '12px' }}>Upload Notes / Resources</h4>
                        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)' }}>PDF, PPTX or External Links</p>
                    </div>
                </div>

                <div style={{ marginTop: '40px' }}>
                    <h4>Your Uploaded Content</h4>
                    {loading ? (
                        <p style={{ color: 'var(--color-text-)', textAlign: 'center', padding: '40px' }}>Loading...</p>
                    ) : uploads.length > 0 ? (
                        <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                            {uploads.map(upload => (
                                <div key={upload.id} className="glass-card" style={{ padding: 'var(--space-24)', background: 'rgba(255,255,255,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                        <div style={{
                                            width: '80px',
                                            height: '45px',
                                            background: upload.type === 'SESSION' ? '#dbeafe' : '#d1fae5',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: upload.type === 'SESSION' ? '#1e40af' : '#065f46',
                                            fontWeight: 'var(--fw-bold)',
                                            fontSize: 'var(--fs-small)'
                                        }}>
                                            {upload.type}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: '4px' }}>{upload.title}</div>
                                            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)' }}>
                                                Batch: {upload.batch?.name || 'N/A'} • {upload.duration} mins • {upload.studentCount || 0} students
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {upload.avgCompletion > 0 && (
                                            <div style={{ textAlign: 'right', marginRight: '12px' }}>
                                                <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)' }}>
                                                    {Math.round(upload.avgCompletion)}% Avg
                                                </div>
                                                <div style={{ width: '100px', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '4px' }}>
                                                    <div style={{ width: `${upload.avgCompletion}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
                                                </div>
                                            </div>
                                        )}
                                        <button
                                            className="action-icon-btn"
                                            onClick={() => handleDelete(upload.id)}
                                            style={{ color: '#ef4444' }}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-text-)', textAlign: 'center', padding: '40px' }}>
                            No uploads yet. Click above to upload your first session or resource!
                        </p>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-secondary)',
                                borderRadius: '16px',
                                padding: '32px',
                                maxWidth: '500px',
                                width: '90%'
                            }}
                        >
                            <h2 style={{ margin: 0, marginBottom: '24px' }}>
                                Upload {uploadType === 'SESSION' ? 'Session' : 'Resource'}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                <div className="glass-form-group">
                                    <label className="glass-label">Title *</label>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        placeholder="Enter title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="glass-form-group">
                                    <label className="glass-label">Description</label>
                                    <textarea
                                        className="glass-input"
                                        placeholder="Enter description"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="glass-form-group">
                                    <label className="glass-label">
                                        {uploadType === 'SESSION' ? 'Video URL (YouTube or Direct Link) *' : 'Upload Resource File *'}
                                    </label>

                                    {uploadType === 'SESSION' ? (
                                        <input
                                            type="url"
                                            className="glass-input"
                                            placeholder="https://youtube.com/watch?v=..."
                                            value={formData.videoUrl}
                                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                            required
                                        />
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="file"
                                                className="glass-input"
                                                onChange={handleFileChange}
                                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                required
                                                style={{ padding: '10px' }}
                                            />
                                            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)', marginTop: '4px' }}>
                                                Accepted formats: PDF, Word, PowerPoint, Excel
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="glass-form-group">
                                    <label className="glass-label">Batch *</label>
                                    <select
                                        className="glass-input"
                                        value={formData.batchId}
                                        onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Batch</option>
                                        {batches?.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {uploadType === 'SESSION' && (
                                    <div className="glass-form-group">
                                        <label className="glass-label">Duration (minutes)</label>
                                        <input
                                            type="number"
                                            className="glass-input"
                                            placeholder="45"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        style={{
                                            flex: 1,
                                            padding: 'var(--space-20)',
                                            border: '1px solid #e2e8f0',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        style={{
                                            flex: 1,
                                            padding: 'var(--space-20)',
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 'var(--fw-semibold)',
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            opacity: isSubmitting ? 0.6 : 1
                                        }}
                                    >
                                        {isSubmitting ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

{/* Modals placed before MentorshipSection or inside Dashboard if they were used there, but here is fine */ }
const ScheduleMeetingModal = ({ isOpen, onClose, batches, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [meetingForm, setMeetingForm] = useState({
        title: '',
        date: '',
        duration: '60',
        mode: 'Online',
        link: '',
        description: '',
        batchId: ''
    });

    const handleScheduleMeeting = async (e) => {
        e.preventDefault();
        if (meetingForm.mode === 'Online' && !meetingForm.link) {
            alert('Meeting link is mandatory for online meetings');
            return;
        }
        setIsSubmitting(true);
        try {
            await mentorAPI.scheduleMeeting({
                ...meetingForm,
                discussionSummary: meetingForm.description + (meetingForm.link ? `\n\nLink: ${meetingForm.link}` : ''),
                remarks: meetingForm.link
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to schedule meeting:', error);
            alert('Failed to schedule meeting');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                    background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px',
                    width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Schedule New Meeting</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><FiX size={24} /></button>
                </div>
                <form onSubmit={handleScheduleMeeting}>
                    <div className="glass-form-group">
                        <label className="glass-label">Title</label>
                        <input type="text" className="glass-input" value={meetingForm.title} onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="glass-form-group">
                            <label className="glass-label">Date</label>
                            <input type="datetime-local" className="glass-input" value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} required />
                        </div>
                        <div className="glass-form-group">
                            <label className="glass-label">Mode</label>
                            <select className="glass-input" value={meetingForm.mode} onChange={e => setMeetingForm({ ...meetingForm, mode: e.target.value })}>
                                <option value="Online">Online</option>
                                <option value="Offline">Offline</option>
                            </select>
                        </div>
                    </div>
                    <div className="glass-form-group">
                        <label className="glass-label">Batch</label>
                        <select className="glass-input" value={meetingForm.batchId} onChange={e => setMeetingForm({ ...meetingForm, batchId: e.target.value })} required>
                            <option value="">Select Batch</option>
                            {batches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    {meetingForm.mode === 'Online' && (
                        <div className="glass-form-group">
                            <label className="glass-label">Link</label>
                            <input type="url" className="glass-input" placeholder="Zoom/GMeet Link" value={meetingForm.link} onChange={e => setMeetingForm({ ...meetingForm, link: e.target.value })} required />
                        </div>
                    )}
                    <div className="glass-form-group">
                        <label className="glass-label">Description</label>
                        <textarea className="glass-input" value={meetingForm.description} onChange={e => setMeetingForm({ ...meetingForm, description: e.target.value })} />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                        {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const UploadAttendanceModal = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Please select a CSV file.");
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = async ({ target }) => {
            const csv = target.result;
            const lines = csv.split('\n');
            const records = [];

            // Simple CSV parsing: assumes header is Email, Status
            const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const [email, status] = line.split(',');
                if (email && status) {
                    records.push({ email: email.trim(), status: status.trim() }); // status: Present/Absent
                }
            }

            try {
                // Call API (using axios directly or api helper)
                // Assuming `mentorAPI` exists or importing `api`
                // Since this file uses `import api from '../../api'`, I'll use `api` if available, or just declare it if not imported?
                // `api` is usually imported at top.
                const response = await api.post('/mentor/attendance', { date, records });
                onSuccess(response.data.stats);
            } catch (error) {
                console.error('Upload failed', error);
                alert('Upload failed');
            } finally {
                setIsUploading(false);
            }
        };

        reader.readAsText(file);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                    background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px',
                    width: '100%', maxWidth: '400px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Upload Attendance</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><FiX size={24} /></button>
                </div>
                <form onSubmit={handleUpload}>
                    <div className="glass-form-group">
                        <label className="glass-label">Date</label>
                        <input type="date" className="glass-input" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>
                    <div className="glass-form-group">
                        <label className="glass-label">CSV File</label>
                        <input type="file" accept=".csv" className="glass-input" onChange={handleFileChange} required />
                        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)', marginTop: '4px' }}>Format: Email, Status (Present/Absent)</p>
                    </div>
                    <button type="submit" disabled={isUploading} className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        const csvContent = "data:text/csv;charset=utf-8,Email,Status\nstudent@example.com,Present";
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "attendance_template.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }} style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: 'var(--fs-body)', color: '#3b82f6' }}>
                        Download Template
                    </a>
                </form>
            </motion.div>
        </motion.div>
    );
};

const MentorshipSection = ({ students, batches, logs, onRefresh, onStartChat }) => {
    const [isScheduling, setIsScheduling] = useState(false);
    const [isUploadingAttendance, setIsUploadingAttendance] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleScheduleSuccess = () => {
        setIsScheduling(false);
        onRefresh();
        alert('Meeting scheduled successfully!');
    };

    const handleAttendanceSuccess = (stats) => {
        setIsUploadingAttendance(false);
        alert(`Attendance Uploaded! Success: ${stats.success}, Failed: ${stats.failed}`);
        onRefresh();
    };

    const filteredStudents = students?.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="mentorship-container">
            {/* Modals */}
            <AnimatePresence>
                {isScheduling && (
                    <ScheduleMeetingModal
                        isOpen={isScheduling}
                        onClose={() => setIsScheduling(false)}
                        batches={batches}
                        onSuccess={handleScheduleSuccess}
                    />
                )}
                {isUploadingAttendance && (
                    <UploadAttendanceModal
                        isOpen={isUploadingAttendance}
                        onClose={() => setIsUploadingAttendance(false)}
                        onSuccess={handleAttendanceSuccess}
                    />
                )}
            </AnimatePresence>

            {/* Header Removed as per request */}

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px', alignItems: 'start', marginTop: '20px' }}>
                {/* Left Column: Mentees Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Search & Filter Bar */}
                    <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-subtle)' }}>
                        <h3 className="mentor-section-title" style={{ margin: 0 }}>My Mentees <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>({filteredStudents.length})</span></h3>
                        <div className="courses-search" style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}>
                            <FiSearch style={{ color: 'var(--text-muted)', marginRight: '10px' }} />
                            <input
                                type="text"
                                className="search-input-clean"
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Mentees Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((s, idx) => (
                                <div key={s.id || idx} className="mentee-card-modern" style={{ position: 'relative', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                                        <div className="avatar-wrapper">
                                            <img src={s.avatar} alt={s.name} className="avatar-lg" style={{ width: '56px', height: '56px' }} />
                                            <div className="status-indicator online" style={{ width: '12px', height: '12px', border: '2px solid white' }}></div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-h3)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                            <div style={{ fontSize: 'var(--fs-body)', color: 'var(--color-text-)', marginTop: '4px' }}>{s.batchName}</div>
                                            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)', marginTop: '2px' }}>{s.email}</div>
                                        </div>
                                    </div>

                                    {/* Mock Progress - can be real if data available */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-small)', marginBottom: '6px', color: 'var(--color-text-)' }}>
                                            <span>Course Progress</span>
                                            <span style={{ fontWeight: 'var(--fw-semibold)', color: '#3b82f6' }}>75%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: '75%', height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid #f8fafc' }}>
                                        <button
                                            onClick={() => onStartChat(s)}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)' }}
                                        >
                                            <FiMessageCircle size={16} /> Message
                                        </button>
                                        <button
                                            onClick={() => { setIsScheduling(true); /* Ideally pre-fill form with this student */ }}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)' }}
                                        >
                                            <FiCalendar size={16} /> Schedule
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--color-text-)', background: 'var(--bg-tertiary)', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                                <FiUsers size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-medium)' }}>No students found matching "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Quick Actions Card */}
                    <div className="sidebar-widget-card">
                        <h3 className="sidebar-widget-title">
                            <FiZap style={{ color: '#f59e0b' }} /> Quick Actions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={() => setIsScheduling(true)}
                                className="widget-action-btn"
                            >
                                <div className="widget-action-icon primary">
                                    <FiCalendar size={18} />
                                </div>
                                Schedule Meeting
                            </button>
                            <button
                                onClick={() => setIsUploadingAttendance(true)}
                                className="widget-action-btn"
                            >
                                <div className="widget-action-icon success">
                                    <FiCheckCircle size={18} />
                                </div>
                                Upload Attendance
                            </button>
                        </div>
                    </div>

                    {/* Insights Card */}
                    <div className="sidebar-widget-card">
                        <h3 className="sidebar-widget-title">Insights</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="widget-metric-box">
                                <div className="widget-metric-value primary">{students?.length || 0}</div>
                                <div className="widget-metric-label">Total Mentees</div>
                            </div>
                            <div className="widget-metric-box">
                                <div className="widget-metric-value success">{batches?.length || 0}</div>
                                <div className="widget-metric-label">Active Batches</div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Sessions Preview (Mini) */}
                    <div className="glass-card" style={{ padding: '20px', border: '1px solid #edf2f7' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 className="sidebar-widget-title" style={{ margin: 0 }}>Upcoming</h3>
                            <span style={{ fontSize: '0.8rem', color: '#3b82f6', cursor: 'pointer' }}>View All</span>
                        </div>

                        {/* Mock Mini List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px', background: '#eff6ff', borderRadius: '8px', minWidth: '50px' }}>
                                    <span style={{ fontSize: 'var(--fs-small)', color: '#3b82f6', fontWeight: 'var(--fw-bold)' }}>FEB</span>
                                    <span style={{ fontSize: 'var(--fs-h3)', color: 'var(--text-primary)', fontWeight: 'var(--fw-bold)' }}>20</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>Resume Review</div>
                                    <div style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)' }}>10:00 AM • Online</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const ForumSection = ({ batches }) => {
    const [forumPosts, setForumPosts] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedPost, setSelectedPost] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchForumPosts();
    }, [selectedBatch]);

    const fetchForumPosts = async () => {
        try {
            setLoading(true);
            const response = await forumAPI.getPosts(selectedBatch || undefined);
            setForumPosts(response.data || []);
        } catch (error) {
            console.error('Failed to fetch forum posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewPost = async (postId) => {
        try {
            const response = await forumAPI.getPostById(postId);
            setSelectedPost(response.data);
            setShowModal(true);
        } catch (error) {
            console.error('Failed to fetch post details:', error);
            alert('Failed to load post details');
        }
    };

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setIsSubmitting(true);
        try {
            await forumAPI.createAnswer(selectedPost.id, replyContent);
            setReplyContent('');
            // Refresh post data
            const response = await forumAPI.getPostById(selectedPost.id);
            setSelectedPost(response.data);
            // Refresh posts list
            fetchForumPosts();
        } catch (error) {
            console.error('Failed to submit reply:', error);
            alert('Failed to submit reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (answersCount) => {
        if (answersCount === 0) return { label: 'Open', class: 'open', icon: <FiAlertCircle size={12} /> };
        return { label: 'Active', class: 'resolved', icon: null };
    };

    return (
        <div className="forum-container">
            <div className="glass-card" style={{ padding: 'var(--spacing-xl)', background: 'linear-gradient(to bottom, #ffffff, #f8fafc)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h3 style={{ fontSize: 'var(--fs-h2)', margin: 0, color: 'var(--text-primary)' }}>Q&A / Discussion Forum</h3>
                        <p style={{ margin: '4px 0 0', color: 'var(--color-text-)', fontSize: 'var(--fs-body)' }}>Engage with your students and solve their queries</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative' }}>
                            <select
                                className="glass-input"
                                style={{
                                    width: '220px',
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--color-text-)',
                                    fontWeight: 'var(--fw-medium)',
                                    cursor: 'pointer',
                                    appearance: 'none'
                                }}
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                            >
                                <option value="">All My Batches</option>
                                {batches?.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <FiChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-)', pointerEvents: 'none' }} />
                        </div>
                    </div>
                </div>

                <div className="forum-threads" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-)' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
                            <p>Loading discussions...</p>
                        </div>
                    ) : forumPosts.length > 0 ? (
                        forumPosts.map(post => {
                            return (
                                <motion.div
                                    key={post.id}
                                    className="forum-thread-card-modern"
                                    whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        border: '1px solid #f1f5f9',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => handleViewPost(post.id)}
                                >
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                        {/* Author Avatar or Initials */}
                                        <div style={{ flexShrink: 0 }}>
                                            {post.author?.avatar ? (
                                                <img src={post.author.avatar} alt={post.author.name} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-h3)' }}>
                                                    {post.author?.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <h4 style={{ margin: 0, fontSize: 'var(--fs-h3)', color: 'var(--text-primary)', fontWeight: 'var(--fw-bold)', lineHeight: '1.4' }}>{post.title}</h4>
                                                <span style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                                    {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>

                                            <p style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-body)', color: 'var(--color-text-)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {post.content}
                                            </p>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 'var(--fs-body)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: post.answersCount > 0 ? '#3b82f6' : '#94a3b8', fontWeight: 'var(--fw-medium)' }}>
                                                        <FiMessageSquare /> {post.answersCount || 0} Replies
                                                    </div>
                                                    <div style={{ color: 'var(--color-text-)' }}>
                                                        Posted by <span style={{ color: 'var(--color-text-)', fontWeight: 'var(--fw-semibold)' }}>{post.author?.name}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    style={{
                                                        padding: '8px 20px',
                                                        fontSize: 'var(--fs-body)',
                                                        background: 'var(--bg-secondary)',
                                                        color: '#3b82f6',
                                                        border: '1px solid #dbeafe',
                                                        borderRadius: '8px',
                                                        fontWeight: 'var(--fw-semibold)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'flex', alignItems: 'center', gap: '6px'
                                                    }}
                                                    className="btn-reply-hover"
                                                >
                                                    View Thread <FiArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--color-text-)', background: 'var(--bg-tertiary)', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ background: 'var(--bg-secondary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <FiMessageSquare size={32} color="#94a3b8" />
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text-)' }}>No discussions yet</h3>
                            <p style={{ margin: 0, fontSize: 'var(--fs-body)' }}>When students ask questions, they will appear here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* View & Reply Modal */}
            <AnimatePresence>
                {showModal && selectedPost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '20px'
                        }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-secondary)',
                                borderRadius: '16px',
                                padding: '32px',
                                maxWidth: '700px',
                                width: '100%',
                                maxHeight: '80vh',
                                overflowY: 'auto'
                            }}
                        >
                            {/* Post Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 'var(--fs-h2)', color: 'var(--text-primary)' }}>{selectedPost.title}</h2>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: 'var(--fs-body)', color: 'var(--color-text-)' }}>
                                        <span>By {selectedPost.author?.name}</span>
                                        <span>•</span>
                                        <span>{new Date(selectedPost.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{ background: 'none', border: 'none', fontSize: 'var(--fs-h2)', color: 'var(--color-text-)', cursor: 'pointer' }}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Post Content */}
                            <div style={{
                                padding: '20px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '12px',
                                marginBottom: '24px',
                                borderLeft: '4px solid #3b82f6'
                            }}>
                                <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: '1.6' }}>{selectedPost.content}</p>
                            </div>

                            {/* Answers Section */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: 'var(--fs-h3)', color: 'var(--text-primary)', marginBottom: '16px' }}>
                                    {selectedPost.answers?.length || 0} Answer{selectedPost.answers?.length !== 1 ? 's' : ''}
                                </h3>

                                {selectedPost.answers && selectedPost.answers.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {selectedPost.answers.map(answer => (
                                            <div key={answer.id} style={{
                                                padding: 'var(--space-24)',
                                                background: answer.author?.role === 'MENTOR' ? '#f0f9ff' : '#f8fafc',
                                                borderRadius: '12px',
                                                border: answer.author?.role === 'MENTOR' ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <img
                                                            src={answer.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                                            alt={answer.author?.name}
                                                            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                                                        />
                                                        <div>
                                                            <div style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
                                                                {answer.author?.name}
                                                                {answer.author?.role === 'MENTOR' && (
                                                                    <span style={{
                                                                        marginLeft: '8px',
                                                                        fontSize: 'var(--fs-small)',
                                                                        background: '#3b82f6',
                                                                        color: 'white',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '4px'
                                                                    }}>
                                                                        Mentor
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)' }}>
                                                                {new Date(answer.createdAt).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p style={{ margin: '8px 0 0', color: 'var(--text-primary)', lineHeight: '1.6' }}>{answer.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--color-text-)', textAlign: 'center', padding: '20px' }}>No answers yet. Be the first to reply!</p>
                                )}
                            </div>

                            {/* Reply Form */}
                            <form onSubmit={handleSubmitReply}>
                                <h4 style={{ fontSize: 'var(--fs-body-lg)', color: 'var(--text-primary)', marginBottom: '12px' }}>Your Answer</h4>
                                <textarea
                                    className="glass-input"
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: 'var(--space-20)',
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                    placeholder="Type your answer here..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    required
                                />
                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        style={{
                                            padding: '10px 20px',
                                            background: 'var(--bg-tertiary)',
                                            color: 'var(--color-text-)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 'var(--fw-semibold)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !replyContent.trim()}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 'var(--fw-semibold)',
                                            cursor: 'pointer',
                                            opacity: (isSubmitting || !replyContent.trim()) ? 0.6 : 1
                                        }}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Reply'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};




const AssignmentsSection = ({ batches }) => {
    const [assignments, setAssignments] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState('assignments');
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [reviewingSubmission, setReviewingSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        batchId: '',
        maxMarks: 100
    });
    const [reviewData, setReviewData] = useState({
        status: 'APPROVED',
        marks: '',
        feedback: ''
    });

    // Quiz-related states
    const [quizzes, setQuizzes] = useState([]);
    const [showCreateQuiz, setShowCreateQuiz] = useState(false);
    const [quizFormData, setQuizFormData] = useState({
        title: '',
        description: '',
        duration: 30,
        totalMarks: 0,
        marksPerQuestion: 1,
        passingMarks: 40,
        dueDate: '',
        batches: [],
        questions: []
    });

    // Auto-calculate total marks whenever marksPerQuestion or questions length changes
    useEffect(() => {
        if (showCreateQuiz) {
            const total = (quizFormData.questions?.length || 0) * (parseInt(quizFormData.marksPerQuestion) || 0);
            setQuizFormData(prev => ({ ...prev, totalMarks: total }));
        }
    }, [quizFormData.questions?.length, quizFormData.marksPerQuestion, showCreateQuiz]);
    const [csvFile, setCsvFile] = useState(null);
    const [csvPreview, setCsvPreview] = useState([]);
    const [showCsvPreview, setShowCsvPreview] = useState(false);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const response = await assignmentAPI.getAssignments();
            setAssignments(response.data || []);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        try {
            console.log('Creating assignment with data:', formData);
            await assignmentAPI.createAssignment(formData);
            setFormData({ title: '', description: '', dueDate: '', batchId: '', maxMarks: 100 });
            setShowCreateForm(false);
            fetchAssignments();
            alert('Assignment created successfully!');
        } catch (error) {
            console.error('Failed to create assignment:', error);
            const errorMsg = error.response?.data?.error || 'Failed to create assignment. Please check all fields.';
            alert(errorMsg);
        }
    };

    const handleViewSubmissions = async (assignmentId) => {
        try {
            const response = await assignmentAPI.getAssignmentDetails(assignmentId);
            setSelectedAssignment(response.data);
            setShowSubmissionsModal(true);
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
            alert('Failed to load submissions');
        }
    };

    const handleReviewSubmission = async (e) => {
        e.preventDefault();

        if (reviewData.status === 'REJECTED' && !reviewData.feedback.trim()) {
            alert('Please provide feedback/reason for rejection so the student knows what to improve.');
            return;
        }

        try {
            // Prepare review data - only include marks if it's a valid number
            const submitData = {
                status: reviewData.status,
                feedback: reviewData.feedback || ''
            };

            // Only add marks if it's a valid number (not empty string or NaN)
            if (reviewData.marks !== '' && !isNaN(reviewData.marks)) {
                submitData.marks = parseInt(reviewData.marks);
            }

            await assignmentAPI.reviewSubmission(reviewingSubmission.id, submitData);
            setReviewingSubmission(null);
            setReviewData({ status: 'APPROVED', marks: '', feedback: '' });
            // Refresh assignment details
            handleViewSubmissions(selectedAssignment.id);
            alert('Review submitted successfully!');
        } catch (error) {
            console.error('Failed to review submission:', error);
            alert('Failed to submit review');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            PENDING: { bg: '#fef9c3', text: '#854d0e' },
            APPROVED: { bg: '#dcfce7', text: '#166534' },
            REJECTED: { bg: '#fee2e2', text: '#991b1b' }
        };
        const color = colors[status] || colors.PENDING;
        return { bg: color.bg, text: color.text };
    };

    // Quiz functions
    const fetchQuizzes = async () => {
        try {
            const response = await quizAPI.getMentorQuizzes();
            setQuizzes(response.data || []);
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
        }
    };

    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setCsvFile(file);
        const reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            const dataLines = lines[0].toLowerCase().includes('question') ? lines.slice(1) : lines;

            const questions = dataLines.map((line, idx) => {
                const parts = line.split(',').map(p => p.trim());
                if (parts.length >= 6) {
                    return {
                        id: `q_${idx + 1}`,
                        question: parts[0],
                        options: [parts[1], parts[2], parts[3], parts[4]],
                        correctOption: parseInt(parts[5]) || 0
                    };
                }
                return null;
            }).filter(q => q !== null);

            setCsvPreview(questions);
            setShowCsvPreview(true);
        };

        reader.readAsText(file);
    };

    const handleUseCsvQuestions = () => {
        setQuizFormData({ ...quizFormData, questions: csvPreview });
        setShowCsvPreview(false);
        setCsvFile(null);
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        try {
            await quizAPI.createQuiz(quizFormData);
            setQuizFormData({
                title: '',
                description: '',
                duration: 30,
                totalMarks: 100,
                passingMarks: 40,
                dueDate: '',
                batches: [],
                questions: []
            });
            setShowCreateQuiz(false);
            fetchQuizzes();
            alert('Quiz created successfully!');
        } catch (error) {
            console.error('Failed to create quiz:', error);
            alert('Failed to create quiz. Please check all fields.');
        }
    };

    const handleBatchSelect = (batchId) => {
        const currentBatches = quizFormData.batches || [];
        if (currentBatches.includes(batchId)) {
            setQuizFormData({ ...quizFormData, batches: currentBatches.filter(b => b !== batchId) });
        } else {
            setQuizFormData({ ...quizFormData, batches: [...currentBatches, batchId] });
        }
    };

    // Fetch both assignments and quizzes on mount
    useEffect(() => {
        fetchQuizzes();
    }, []);

    return (
        <div className="assignments-container">
            <div className="glass-card" style={{ padding: 'var(--spacing-xl)', background: '#f8faff', border: '1px solid #edf2f7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, color: '#1e3a8a' }}>Assignments & Quizzes</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            className="btn-glass-primary"
                            onClick={() => setShowCreateQuiz(true)}
                            style={{ background: '#10b981', color: 'white', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <FiPlus /> Create Quiz
                        </button>
                        <button
                            className="btn-glass-primary"
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <FiPlus /> {showCreateForm ? 'Cancel' : 'Create Assignment'}
                        </button>
                    </div>
                </div>

                {/* Create Assignment Form */}
                <AnimatePresence>
                    {showCreateForm && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden', marginBottom: '24px' }}
                        >
                            <form onSubmit={handleCreateAssignment} style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                                <div className="glass-form-group">
                                    <label className="glass-label">Title</label>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-label">Description</label>
                                    <textarea
                                        className="glass-input"
                                        style={{ minHeight: '100px', resize: 'vertical' }}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    <div className="glass-form-group">
                                        <label className="glass-label">Due Date</label>
                                        <input
                                            type="datetime-local"
                                            className="glass-input"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="glass-form-group">
                                        <label className="glass-label">Batch</label>
                                        <select
                                            className="glass-input"
                                            value={formData.batchId}
                                            onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Batch</option>
                                            {batches?.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="glass-form-group">
                                        <label className="glass-label">Max Marks</label>
                                        <input
                                            type="number"
                                            className="glass-input"
                                            value={formData.maxMarks}
                                            onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) })}
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" style={{ width: '100%', background: '#3b82f6', color: 'white', padding: 'var(--space-20)', borderRadius: '8px', border: 'none', fontWeight: 'var(--fw-semibold)', marginTop: '16px', cursor: 'pointer' }}>
                                    Create Assignment
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs & Search Bar */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: '12px' }}>
                            <button
                                onClick={() => setActiveTab('assignments')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeTab === 'assignments' ? 'white' : 'transparent',
                                    color: activeTab === 'assignments' ? '#3b82f6' : '#64748b',
                                    fontWeight: activeTab === 'assignments' ? 700 : 500,
                                    boxShadow: activeTab === 'assignments' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <FiFileText /> Assignments
                            </button>
                            <button
                                onClick={() => setActiveTab('quizzes')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeTab === 'quizzes' ? 'white' : 'transparent',
                                    color: activeTab === 'quizzes' ? '#3b82f6' : '#64748b',
                                    fontWeight: activeTab === 'quizzes' ? 700 : 500,
                                    boxShadow: activeTab === 'quizzes' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <FiCheckCircle /> Quizzes
                            </button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    {activeTab === 'assignments' && (
                        loading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-)' }}>Loading assignments...</div>
                        ) : assignments.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                {assignments.map(assignment => {
                                    const submissionsCount = assignment.submissions?.length || 0;
                                    const pendingCount = assignment.submissions?.filter(s => s.status === 'PENDING').length || 0;

                                    return (
                                        <motion.div
                                            key={assignment.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                background: 'var(--bg-secondary)',
                                                borderRadius: '16px',
                                                border: '1px solid #e2e8f0',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                                transition: 'transform 0.2s, box-shadow 0.2s'
                                            }}
                                            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        >
                                            <div style={{
                                                height: '100px',
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                padding: '20px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start'
                                            }}>
                                                <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: '20px', color: 'white', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' }}>
                                                    {assignment.batch?.name || 'General'}
                                                </div>
                                                <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '10px', color: '#2563eb' }}>
                                                    <FiFileText size={20} />
                                                </div>
                                            </div>

                                            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <h4 style={{ margin: '0 0 8px', fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
                                                    {assignment.title}
                                                </h4>
                                                <p style={{ fontSize: 'var(--fs-body)', color: 'var(--color-text-)', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                                                    {assignment.description}
                                                </p>

                                                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-body)', color: 'var(--color-text-)', background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
                                                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                        <span style={{ fontWeight: 'var(--fw-semibold)', color: pendingCount > 0 ? '#d97706' : '#64748b' }}>
                                                            {submissionsCount} Subs {pendingCount > 0 && `(${pendingCount} new)`}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => handleViewSubmissions(assignment.id)}
                                                        style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                    >
                                                        View Submissions
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                <FiFileText size={48} style={{ marginBottom: '16px', color: 'var(--color-text-)' }} />
                                <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No assignments yet</h3>
                                <p style={{ color: 'var(--color-text-)', margin: 0 }}>Create your first assignment to get started.</p>
                            </div>
                        )
                    )}

                    {activeTab === 'quizzes' && (
                        loading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-)' }}>Loading quizzes...</div>
                        ) : quizzes.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                {quizzes.map(quiz => {
                                    const submissionsCount = quiz.submissions?.length || 0;

                                    return (
                                        <motion.div
                                            key={quiz.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                background: 'var(--bg-secondary)',
                                                borderRadius: '16px',
                                                border: '1px solid #e2e8f0',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                                transition: 'transform 0.2s, box-shadow 0.2s'
                                            }}
                                            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        >
                                            <div style={{
                                                height: '100px',
                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                padding: '20px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start'
                                            }}>
                                                <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: '20px', color: 'white', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' }}>
                                                    {quiz.questions?.length || 0} Questions
                                                </div>
                                                <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '10px', color: '#059669' }}>
                                                    <FiCheckCircle size={20} />
                                                </div>
                                            </div>

                                            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <h4 style={{ margin: '0 0 8px', fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
                                                    {quiz.title}
                                                </h4>
                                                <p style={{ fontSize: 'var(--fs-body)', color: 'var(--color-text-)', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                                                    {quiz.description || 'No description provided.'}
                                                </p>

                                                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 'var(--fs-body)', color: 'var(--color-text-)', background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px' }}>
                                                        <span>⏱ {quiz.duration} mins</span>
                                                        <span>🎯 {quiz.totalMarks} Marks</span>
                                                        <span>👥 {submissionsCount} Attempts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                <FiCheckCircle size={48} style={{ marginBottom: '16px', color: 'var(--color-text-)' }} />
                                <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No quizzes yet</h3>
                                <p style={{ color: 'var(--color-text-)', margin: 0 }}>Create a quiz to assess your students.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Create Quiz Modal */}
            <AnimatePresence>
                {showCreateQuiz && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                        onClick={() => setShowCreateQuiz(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '32px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <h2 style={{ margin: '0 0 24px', fontSize: 'var(--fs-h2)', color: 'var(--text-primary)' }}>Create New Quiz</h2>
                            <form onSubmit={handleCreateQuiz}>
                                <div className="glass-form-group">
                                    <label className="glass-label">Title</label>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        value={quizFormData.title}
                                        onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-label">Description</label>
                                    <textarea
                                        className="glass-input"
                                        value={quizFormData.description}
                                        onChange={(e) => setQuizFormData({ ...quizFormData, description: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    <div className="glass-form-group">
                                        <label className="glass-label">Duration (mins)</label>
                                        <input
                                            type="number"
                                            className="glass-input"
                                            value={quizFormData.duration}
                                            onChange={(e) => setQuizFormData({ ...quizFormData, duration: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="glass-form-group">
                                        <label className="glass-label">Marks Per Question</label>
                                        <input
                                            type="number"
                                            className="glass-input"
                                            value={quizFormData.marksPerQuestion}
                                            onChange={(e) => setQuizFormData({ ...quizFormData, marksPerQuestion: parseInt(e.target.value) })}
                                            min="1"
                                        />
                                    </div>
                                    <div className="glass-form-group">
                                        <label className="glass-label">Total Marks (Auto)</label>
                                        <input
                                            type="number"
                                            className="glass-input"
                                            value={quizFormData.totalMarks}
                                            readOnly
                                            style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                    <div className="glass-form-group">
                                        <label className="glass-label">Passing Marks</label>
                                        <input
                                            type="number"
                                            className="glass-input"
                                            value={quizFormData.passingMarks}
                                            onChange={(e) => setQuizFormData({ ...quizFormData, passingMarks: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-label">Due Date</label>
                                    <input
                                        type="datetime-local"
                                        className="glass-input"
                                        value={quizFormData.dueDate}
                                        onChange={(e) => setQuizFormData({ ...quizFormData, dueDate: e.target.value })}
                                    />
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-label">Assign Batches</label>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        {batches?.map(b => (
                                            <div
                                                key={b.id}
                                                onClick={() => handleBatchSelect(b.id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: quizFormData.batches.includes(b.id) ? '#3b82f6' : '#f1f5f9',
                                                    color: quizFormData.batches.includes(b.id) ? 'white' : '#64748b',
                                                    borderRadius: '20px',
                                                    cursor: 'pointer',
                                                    border: '1px solid transparent',
                                                    fontSize: 'var(--fs-body)'
                                                }}
                                            >
                                                {b.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-label">Questions (Manual or CSV)</label>
                                    <div style={{ marginBottom: '16px', padding: 'var(--space-24)', background: '#f8faff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                        <p style={{ margin: '0 0 12px', fontSize: 'var(--fs-body)', color: 'var(--color-text-)' }}>
                                            Upload a CSV file with format: <code>question, option1, option2, option3, option4, correctOptionIndex</code>
                                        </p>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleCSVUpload}
                                            style={{ display: 'block', width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ fontSize: 'var(--fs-body)', color: 'var(--color-text-)' }}>
                                        {quizFormData.questions.length} questions added
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateQuiz(false)}
                                        style={{ flex: 1, padding: 'var(--space-20)', background: 'var(--bg-tertiary)', color: 'var(--color-text-)', border: 'none', borderRadius: '8px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ flex: 1, padding: 'var(--space-20)', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}
                                    >
                                        Create Quiz
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CSV Preview Modal */}
            <AnimatePresence>
                {showCsvPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
                    >
                        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                            <h3 style={{ margin: '0 0 16px' }}>CSV Preview ({csvPreview.length} questions)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {csvPreview.map((q, i) => (
                                    <div key={i} style={{ padding: 'var(--space-20)', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <p style={{ fontWeight: 'var(--fw-semibold)', margin: '0 0 8px' }}>{i + 1}. {q.question}</p>
                                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--fs-body)', color: 'var(--color-text-)' }}>
                                            {q.options.map((opt, optIdx) => (
                                                <li key={optIdx} style={{ color: optIdx === q.correctOption ? '#16a34a' : 'inherit', fontWeight: optIdx === q.correctOption ? 600 : 400 }}>
                                                    {opt} {optIdx === q.correctOption && '(Correct)'}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button
                                    onClick={() => setShowCsvPreview(false)}
                                    style={{ flex: 1, padding: '10px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUseCsvQuestions}
                                    style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    Use Questions
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submissions Modal */}
            <AnimatePresence>
                {showSubmissionsModal && selectedAssignment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
                        onClick={() => setShowSubmissionsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '32px', maxWidth: '800px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 'var(--fs-h2)', color: 'var(--text-primary)' }}>{selectedAssignment.title}</h2>
                                    <p style={{ margin: '8px 0 0', color: 'var(--color-text-)' }}>{selectedAssignment.submissions?.length || 0} Submissions</p>
                                </div>
                                <button onClick={() => setShowSubmissionsModal(false)} style={{ background: 'none', border: 'none', fontSize: 'var(--fs-h2)', color: 'var(--color-text-)', cursor: 'pointer' }}>×</button>
                            </div>

                            {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {selectedAssignment.submissions.map(submission => {
                                        const statusStyle = getStatusBadge(submission.status);
                                        return (
                                            <div key={submission.id} style={{ padding: 'var(--space-24)', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <img src={submission.student?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={submission.student?.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                                        <div>
                                                            <div style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{submission.student?.name}</div>
                                                            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)' }}>Submitted: {new Date(submission.submittedAt).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)', background: statusStyle.bg, color: statusStyle.text }}>
                                                        {submission.status}
                                                    </span>
                                                </div>
                                                <p style={{ margin: '12px 0', color: 'var(--text-primary)', lineHeight: '1.6', background: 'var(--bg-secondary)', padding: 'var(--space-20)', borderRadius: '8px' }}>
                                                    {submission.content.startsWith('/uploads') ? (
                                                        <a
                                                            href={`http://localhost:5001${submission.content}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#2563eb', textDecoration: 'none', fontWeight: 'var(--fw-medium)' }}
                                                        >
                                                            <FiFileText /> View Submission File
                                                            <FiArrowRight size={14} />
                                                        </a>
                                                    ) : (
                                                        submission.content
                                                    )}
                                                </p>
                                                {submission.feedback && (
                                                    <div style={{ marginTop: '12px', padding: 'var(--space-20)', background: '#fff7ed', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                                                        <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)', color: '#92400e', marginBottom: '4px' }}>Feedback:</div>
                                                        <p style={{ margin: 0, fontSize: 'var(--fs-body)', color: '#78350f' }}>{submission.feedback}</p>
                                                        {submission.marks !== null && <div style={{ marginTop: '8px', fontWeight: 'var(--fw-semibold)', color: '#92400e' }}>Marks: {submission.marks}/{selectedAssignment.maxMarks}</div>}
                                                    </div>
                                                )}
                                                {submission.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => setReviewingSubmission(submission)}
                                                        style={{ marginTop: '12px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}
                                                    >
                                                        Review Submission
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-)' }}>No submissions yet</div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Review Submission Modal */}
            <AnimatePresence>
                {reviewingSubmission && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px' }}
                        onClick={() => setReviewingSubmission(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%' }}
                        >
                            <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)' }}>Review Submission</h3>
                            <form onSubmit={handleReviewSubmission}>
                                <div className="glass-form-group">
                                    <label className="glass-label">Status</label>
                                    <select
                                        className="glass-input"
                                        value={reviewData.status}
                                        onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                                        required
                                    >
                                        <option value="APPROVED">Approve</option>
                                        <option value="REJECTED">Reject</option>
                                    </select>
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-label">Marks (out of {selectedAssignment.maxMarks})</label>
                                    <input
                                        type="number"
                                        className="glass-input"
                                        value={reviewData.marks}
                                        onChange={(e) => setReviewData({ ...reviewData, marks: e.target.value })}
                                        min="0"
                                        max={selectedAssignment.maxMarks}
                                    />
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-label">Feedback</label>
                                    <textarea
                                        className="glass-input"
                                        style={{ minHeight: '100px', resize: 'vertical' }}
                                        value={reviewData.feedback}
                                        onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                                        placeholder={reviewData.status === 'REJECTED' ? "Explain what needs improvement (Required for rejection)..." : "Provide optional feedback..."}
                                        required={reviewData.status === 'REJECTED'}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setReviewingSubmission(null)}
                                        style={{ flex: 1, padding: 'var(--space-20)', background: 'var(--bg-tertiary)', color: 'var(--color-text-)', border: 'none', borderRadius: '8px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ flex: 1, padding: 'var(--space-20)', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}
                                    >
                                        Submit Review
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


export default MentorDashboard;
