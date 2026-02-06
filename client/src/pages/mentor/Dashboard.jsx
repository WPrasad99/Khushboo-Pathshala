import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, mentorshipAPI, resourceAPI, adminAPI, batchAPI, mentorAPI, announcementAPI, forumAPI, assignmentAPI } from '../../api';
import {
    FiSearch, FiBell, FiUser, FiLogOut, FiUsers, FiBook,
    FiCalendar, FiPlus, FiUpload, FiSettings, FiCheckCircle,
    FiMessageSquare, FiLayers, FiBarChart2, FiClock, FiAlertCircle, FiChevronDown, FiChevronUp, FiFileText, FiEdit2, FiArrowRight
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import '../student/Dashboard.css';
import '../admin/AdminDashboard.css';
import './MentorDashboard.css';

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
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('notification', () => {
                setUnreadNotifications(prev => prev + 1);
                fetchData();
            });
            return () => socket.off('notification');
        }
    }, [socket]);

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
            <nav className="navbar">
                <div className="navbar-brand-mentor">
                    <img src="/logo.png" alt="Logo" className="navbar-logo" style={{ height: '40px', width: 'auto' }} />
                    <span className="mentor-logo-text">Khushboo Pathshala</span>
                </div>

                <div className="navbar-actions-mentor">
                    <div className="mentor-tabs-container">
                        <div className="mentor-tabs">
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
                                <FiBook /> Sessions
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
                        </div>
                    </div>

                    <div className="navbar-right-actions">
                        <button className="icon-btn" style={{ position: 'relative' }}>
                            <FiBell />
                            {unreadNotifications > 0 && <span className="notification-dot"></span>}
                        </button>
                        <div className="user-info-pill" onClick={() => navigate('/settings')}>
                            <img src={user?.avatar} alt={user?.name} className="avatar-sm" />
                            <span>{user?.name?.split(' ')[0]} (Mentor)</span>
                        </div>
                        <button className="icon-btn" onClick={handleLogout} title="Logout">
                            <FiLogOut />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="dashboard-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="dashboard-header-modern" style={{ marginBottom: '30px' }}>
                            <div>
                                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {activeTab === 'overview'
                                        ? `Welcome back, ${user?.name?.split(' ')[0]}! 👋`
                                        : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                </h1>
                                <p style={{ color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{formatDate(new Date())}</p>
                            </div>
                        </div>

                        {activeTab === 'overview' && (
                            <OverviewSection
                                data={dashboardData}
                                studentsCount={mentorStudents.length}
                                setTab={setActiveTab}
                                announcements={announcements}
                                meetingLogs={meetingLogs}
                            />
                        )}
                        {activeTab === 'batches' && <BatchesSection batches={batches} />}
                        {activeTab === 'sessions' && <SessionsSection />}
                        {activeTab === 'mentorship' && <MentorshipSection students={mentorStudents} batches={batches} logs={meetingLogs} onRefresh={fetchData} />}
                        {activeTab === 'forum' && <ForumSection batches={batches} />}
                        {activeTab === 'assignments' && <AssignmentsSection batches={batches} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

const OverviewSection = ({ data, studentsCount, setTab, announcements, meetingLogs }) => (
    <div className="overview-container">
        <div className="mentor-stats-grid-5">
            {[
                { label: 'Assigned Students', value: studentsCount, icon: <FiUsers />, color: '#3b82f6' },
                { label: 'Active Sessions', value: '8', icon: <FiBook />, color: '#3b82f6' },
                { label: 'Avg. Attendance', value: '88%', icon: <FiCheckCircle />, color: '#3b82f6' },
                { label: 'Pending Queries', value: '5', icon: <FiMessageSquare />, color: '#3b82f6' },
                { label: 'Upcoming Sessions', value: '2', icon: <FiCalendar />, color: '#3b82f6' }
            ].map((stat, idx) => (
                <div key={idx} className="stat-card-refined read-only" style={{ background: '#f8faff', border: '1px solid #edf2f7' }}>
                    <div className="stat-icon-refined" style={{ background: 'white', color: stat.color, boxShadow: '0 2px 10px rgba(59, 130, 246, 0.05)' }}>
                        {stat.icon}
                    </div>
                    <span className="stat-value-bold" style={{ color: '#1e3a8a', fontSize: '1.4rem' }}>{stat.value}</span>
                    <span className="stat-label-muted" style={{ color: '#64748b', fontWeight: 600 }}>{stat.label}</span>
                </div>
            ))}
        </div>

        <div className="mentor-grid">
            <div className="glass-card" style={{ padding: 'var(--spacing-xl)', background: '#f8faff', border: '1px solid #edf2f7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#1e3a8a' }}>
                        <FiClock color="#3b82f6" /> Recent Updates
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{announcements?.length || 0} Total</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    {announcements && announcements.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {announcements.map((ann, idx) => (
                                <div key={idx} style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>{ann.title}</h4>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                            {formatDate(new Date(ann.createdAt))}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>{ann.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ background: '#f0f7ff', padding: '16px', borderRadius: '50%' }}>
                                <FiBell size={24} color="#3b82f6" />
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>No new announcements from admin.</p>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: '24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <FiClock color="#3b82f6" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e3a8a', fontWeight: 700 }}>Meeting Logs</h3>
                </div>

                <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    paddingRight: '8px'
                }}>
                    {meetingLogs && meetingLogs.length > 0 ? (
                        meetingLogs.map(log => (
                            <div key={log.id} style={{
                                padding: '16px',
                                borderRadius: '12px',
                                background: 'white',
                                border: '1px solid #edf2f7'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {log.title || 'Meeting Session'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                        {new Date(log.meetingDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, marginTop: '4px' }}>
                                    {log.batch?.name || 'Batch Session'}
                                </div>
                                {log.discussionSummary && (
                                    <p style={{
                                        fontSize: '0.8rem',
                                        color: '#64748b',
                                        margin: '8px 0',
                                        lineHeight: '1.5',
                                        display: '-webkit-box',
                                        WebkitLineClamp: '2',
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {log.discussionSummary}
                                    </p>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: '#dcfce7',
                                        color: '#166534'
                                    }}>
                                        Completed
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        {log.duration} mins
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '0.9rem', padding: '40px 20px' }}>No meeting logs found.</p>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const BatchesSection = ({ batches }) => {
    const [expandedBatch, setExpandedBatch] = useState(null);

    return (
        <div className="batches-container">
            {batches && batches.length > 0 ? (
                batches.map(batch => (
                    <div key={batch.id} className="batch-accordion-item read-only" style={{ background: '#f8faff', border: '1px solid #edf2f7', borderRadius: '16px', marginBottom: '16px', overflow: 'hidden' }}>
                        <div
                            className="batch-accordion-header"
                            onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="stat-icon-wrapper" style={{ margin: 0 }}><FiLayers /></div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{batch.name}</h3>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {batch.studentsCount} Students • {batch.status}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Mentor(s)</div>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                        {batch.assignedMentors?.map(m => (
                                            <img key={m.id} src={m.avatar} alt={m.name} className="avatar-xs" title={m.name} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                                        ))}
                                    </div>
                                </div>
                                {expandedBatch === batch.id ? <FiChevronUp color="#3b82f6" /> : <FiChevronDown color="#3b82f6" />}
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedBatch === batch.id && (
                                <motion.div
                                    className="batch-accordion-content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                                        <table className="student-table">
                                            <thead>
                                                <tr>
                                                    <th>Student</th>
                                                    <th>Joined Date</th>
                                                    <th>Actions (Disabled)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {batch.students?.map(s => (
                                                    <tr key={s.id} className="student-row">
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <img src={s.avatar} className="avatar-sm" alt="" />
                                                                <div>
                                                                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px', opacity: 0.5, pointerEvents: 'none' }}>
                                                                <button className="action-icon-btn"><FiUser /></button>
                                                                <button className="action-icon-btn"><FiEdit2 /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))
            ) : (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: '#64748b' }}>You are not assigned to any batches yet.</p>
                </div>
            )}
        </div>
    );
};

const SessionsSection = () => (
    <div className="sessions-container">
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3>Learning Sessions Management</h3>
                <button className="btn-glass-primary"><FiPlus /> Upload New Session</button>
            </div>

            <div className="mentor-grid">
                <div className="compact-upload-zone">
                    <FiUpload size={32} color="#3b82f6" />
                    <h4 style={{ marginTop: '12px' }}>Upload Session Video</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>MP4, WebM or YouTube link</p>
                </div>
                <div className="compact-upload-zone">
                    <FiFileText size={32} color="#10b981" />
                    <h4 style={{ marginTop: '12px' }}>Upload Notes / Resources</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>PDF, PPTX or External Links</p>
                </div>
            </div>

            <div style={{ marginTop: '40px' }}>
                <h4>Recent Sessions</h4>
                <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                    {[1, 2].map(i => (
                        <div key={i} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '80px', height: '45px', background: '#cbd5e1', borderRadius: '4px' }}></div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Introduction to React Hooks - Session {i}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned to: Python Beginner 2024 • 45 mins</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>8/15 Completed</div>
                                <div style={{ width: '100px', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '4px' }}>
                                    <div style={{ width: '53%', height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const MentorshipSection = ({ students, batches, onRefresh }) => {
    const [meetingForm, setMeetingForm] = useState({
        title: '',
        date: '',
        duration: '60',
        mode: 'Online',
        link: '',
        description: '',
        batchId: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleScheduleMeeting = async (e) => {
        e.preventDefault();
        if (meetingForm.mode === 'Online' && !meetingForm.link) {
            alert('Meeting link is mandatory for online meetings');
            return;
        }
        setIsSubmitting(true);
        try {
            await mentorAPI.scheduleMeeting(meetingForm);
            setMeetingForm({
                title: '',
                date: '',
                duration: '60',
                mode: 'Online',
                link: '',
                description: '',
                batchId: ''
            });
            alert('Meeting scheduled successfully!');
            onRefresh();
        } catch (error) {
            console.error('Failed to schedule meeting:', error);
            alert('Failed to schedule meeting');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mentorship-container">
            <div className="mentorship-grid-modern" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 450px', gap: '24px', alignItems: 'start' }}>
                {/* Left Column: Student List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
                    <div className="glass-card" style={{ padding: '24px', background: '#f8faff', border: '1px solid #edf2f7', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Student Directory</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Manage and track students from your assigned batches</p>
                            </div>
                            <div style={{ background: '#f0f9ff', color: '#0369a1', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                                {students?.length || 0} Students
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {students && students.length > 0 ? (
                                students.map(s => (
                                    <div key={s.id} className="mentee-card-modern" style={{
                                        padding: '20px',
                                        borderRadius: '16px',
                                        border: '1px solid #edf2f7',
                                        background: '#f8faff',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img src={s.avatar} alt={s.name} style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover' }} />
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '-2px',
                                                    right: '-2px',
                                                    width: '14px',
                                                    height: '14px',
                                                    borderRadius: '50%',
                                                    background: '#10b981',
                                                    border: '2px solid white'
                                                }}></div>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{s.batchName}</div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '8px', fontWeight: 600 }}>{s.status}</span>
                                            <button className="icon-btn-minimal" style={{ padding: '6px', color: '#3b82f6', background: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><FiMessageSquare size={16} /></button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    <FiUsers size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                    <p>No students assigned yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Meeting Scheduler - Always Open */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '24px', background: '#f8faff', border: '1px solid #edf2f7' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Schedule New Meeting</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Create a meeting for your students</p>
                        </div>

                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                            <form onSubmit={handleScheduleMeeting}>
                                <div className="glass-form-group">
                                    <label className="glass-label" style={{ fontSize: '0.8rem' }}>Title</label>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        style={{ padding: '10px' }}
                                        placeholder="Meeting Title"
                                        value={meetingForm.title}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="glass-form-group">
                                        <label className="glass-label" style={{ fontSize: '0.8rem' }}>Date</label>
                                        <input
                                            type="datetime-local"
                                            className="glass-input"
                                            style={{ padding: '10px' }}
                                            value={meetingForm.date}
                                            onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="glass-form-group">
                                        <label className="glass-label" style={{ fontSize: '0.8rem' }}>Mode</label>
                                        <select
                                            className="glass-input"
                                            style={{ padding: '10px' }}
                                            value={meetingForm.mode}
                                            onChange={(e) => setMeetingForm({ ...meetingForm, mode: e.target.value })}
                                        >
                                            <option value="Online">Online</option>
                                            <option value="Offline">Offline</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-label" style={{ fontSize: '0.8rem' }}>Batch</label>
                                    <select
                                        className="glass-input"
                                        style={{ padding: '10px' }}
                                        value={meetingForm.batchId}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, batchId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Batch</option>
                                        {batches?.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {meetingForm.mode === 'Online' && (
                                    <div className="glass-form-group">
                                        <label className="glass-label" style={{ fontSize: '0.8rem' }}>Link</label>
                                        <input
                                            type="url"
                                            className="glass-input"
                                            style={{ padding: '10px' }}
                                            placeholder="Zoom/GMeet Link"
                                            value={meetingForm.link}
                                            onChange={(e) => setMeetingForm({ ...meetingForm, link: e.target.value })}
                                            required={meetingForm.mode === 'Online'}
                                        />
                                    </div>
                                )}
                                <div className="glass-form-group">
                                    <label className="glass-label" style={{ fontSize: '0.8rem' }}>Description</label>
                                    <textarea
                                        className="glass-input"
                                        style={{ padding: '10px', minHeight: '80px', resize: 'vertical' }}
                                        placeholder="Meeting description..."
                                        value={meetingForm.description}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                                    />
                                </div>
                                <button type="submit" disabled={isSubmitting} style={{
                                    width: '100%',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    marginTop: '10px',
                                    cursor: 'pointer'
                                }}>
                                    {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
                                </button>
                            </form>
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
            <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>Q&A / Discussion Forum</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select
                            className="glass-input"
                            style={{ width: '200px', padding: '8px' }}
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                        >
                            <option value="">All My Batches</option>
                            {batches?.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="forum-threads">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            <p>Loading forum posts...</p>
                        </div>
                    ) : forumPosts.length > 0 ? (
                        forumPosts.map(post => {
                            return (
                                <div key={post.id} className="forum-thread-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</h4>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                                                Started by {post.author?.name || 'Unknown'} • {new Date(post.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#64748b' }}>
                                            <span><FiMessageSquare style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {post.answersCount || 0} Replies</span>
                                        </div>
                                        <button
                                            className="btn-glass-primary"
                                            style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                                            onClick={() => handleViewPost(post.id)}
                                        >
                                            View & Reply
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            <FiMessageSquare size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <p>No forum posts yet from students in your batches.</p>
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
                                background: 'white',
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
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>{selectedPost.title}</h2>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                                        <span>By {selectedPost.author?.name}</span>
                                        <span>•</span>
                                        <span>{new Date(selectedPost.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Post Content */}
                            <div style={{
                                padding: '20px',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                marginBottom: '24px',
                                borderLeft: '4px solid #3b82f6'
                            }}>
                                <p style={{ margin: 0, color: '#1e293b', lineHeight: '1.6' }}>{selectedPost.content}</p>
                            </div>

                            {/* Answers Section */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '16px' }}>
                                    {selectedPost.answers?.length || 0} Answer{selectedPost.answers?.length !== 1 ? 's' : ''}
                                </h3>

                                {selectedPost.answers && selectedPost.answers.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {selectedPost.answers.map(answer => (
                                            <div key={answer.id} style={{
                                                padding: '16px',
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
                                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                                                                {answer.author?.name}
                                                                {answer.author?.role === 'MENTOR' && (
                                                                    <span style={{
                                                                        marginLeft: '8px',
                                                                        fontSize: '0.75rem',
                                                                        background: '#3b82f6',
                                                                        color: 'white',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '4px'
                                                                    }}>
                                                                        Mentor
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                                {new Date(answer.createdAt).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p style={{ margin: '8px 0 0', color: '#1e293b', lineHeight: '1.6' }}>{answer.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No answers yet. Be the first to reply!</p>
                                )}
                            </div>

                            {/* Reply Form */}
                            <form onSubmit={handleSubmitReply}>
                                <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '12px' }}>Your Answer</h4>
                                <textarea
                                    className="glass-input"
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '12px',
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
                                            background: '#f1f5f9',
                                            color: '#64748b',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 600,
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
                                            fontWeight: 600,
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

    return (
        <div className="assignments-container">
            <div className="glass-card" style={{ padding: 'var(--spacing-xl)', background: '#f8faff', border: '1px solid #edf2f7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, color: '#1e3a8a' }}>Assignments Management</h3>
                    <button
                        className="btn-glass-primary"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <FiPlus /> {showCreateForm ? 'Cancel' : 'Create Assignment'}
                    </button>
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
                            <form onSubmit={handleCreateAssignment} style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #edf2f7' }}>
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
                                <button type="submit" style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 600, marginTop: '16px', cursor: 'pointer' }}>
                                    Create Assignment
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Assignments List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading assignments...</div>
                ) : assignments.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {assignments.map(assignment => {
                            const submissionsCount = assignment.submissions?.length || 0;
                            const pendingCount = assignment.submissions?.filter(s => s.status === 'PENDING').length || 0;
                            return (
                                <div key={assignment.id} style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div className="stat-icon-wrapper" style={{ background: '#dbeafe', color: '#2563eb' }}><FiFileText /></div>
                                        <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {assignment.title}
                                    </h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {assignment.description}
                                    </p>
                                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, marginBottom: '16px' }}>
                                        📚 {assignment.batch?.name}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                                            {submissionsCount} Submissions
                                            {pendingCount > 0 && <span style={{ color: '#f59e0b', marginLeft: '8px' }}>({pendingCount} pending)</span>}
                                        </div>
                                        <button
                                            className="btn-glass-secondary"
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                            onClick={() => handleViewSubmissions(assignment.id)}
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        <FiFileText size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p>No assignments created yet. Create your first assignment!</p>
                    </div>
                )}
            </div>

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
                            style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '800px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>{selectedAssignment.title}</h2>
                                    <p style={{ margin: '8px 0 0', color: '#64748b' }}>{selectedAssignment.submissions?.length || 0} Submissions</p>
                                </div>
                                <button onClick={() => setShowSubmissionsModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
                            </div>

                            {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {selectedAssignment.submissions.map(submission => {
                                        const statusStyle = getStatusBadge(submission.status);
                                        return (
                                            <div key={submission.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <img src={submission.student?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={submission.student?.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{submission.student?.name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Submitted: {new Date(submission.submittedAt).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: statusStyle.bg, color: statusStyle.text }}>
                                                        {submission.status}
                                                    </span>
                                                </div>
                                                <p style={{ margin: '12px 0', color: '#1e293b', lineHeight: '1.6', background: 'white', padding: '12px', borderRadius: '8px' }}>
                                                    {submission.content.startsWith('/uploads') ? (
                                                        <a
                                                            href={`http://localhost:5000${submission.content}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
                                                        >
                                                            <FiFileText /> View Submission File
                                                            <FiArrowRight size={14} />
                                                        </a>
                                                    ) : (
                                                        submission.content
                                                    )}
                                                </p>
                                                {submission.feedback && (
                                                    <div style={{ marginTop: '12px', padding: '12px', background: '#fff7ed', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Feedback:</div>
                                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f' }}>{submission.feedback}</p>
                                                        {submission.marks !== null && <div style={{ marginTop: '8px', fontWeight: 600, color: '#92400e' }}>Marks: {submission.marks}/{selectedAssignment.maxMarks}</div>}
                                                    </div>
                                                )}
                                                {submission.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => setReviewingSubmission(submission)}
                                                        style={{ marginTop: '12px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                                    >
                                                        Review Submission
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No submissions yet</div>
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
                            style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%' }}
                        >
                            <h3 style={{ margin: '0 0 20px', color: '#1e293b' }}>Review Submission</h3>
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
                                        style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
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
