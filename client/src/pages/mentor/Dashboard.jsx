import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, mentorshipAPI, resourceAPI, adminAPI, batchAPI, mentorAPI } from '../../api';
import {
    FiSearch, FiBell, FiUser, FiLogOut, FiUsers, FiBook,
    FiCalendar, FiPlus, FiUpload, FiSettings, FiCheckCircle,
    FiMessageSquare, FiLayers, FiBarChart2, FiClock, FiAlertCircle, FiChevronDown, FiChevronUp, FiFileText, FiEdit2
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import '../student/Dashboard.css';
import '../admin/AdminDashboard.css';
import './MentorDashboard.css';

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
            const [dashboardRes, batchesRes, studentsRes, meetingsRes] = await Promise.all([
                userAPI.getDashboard(),
                mentorAPI.getBatches(),
                mentorAPI.getStudents(),
                mentorAPI.getMeetings()
            ]);

            setDashboardData(dashboardRes.data);
            setBatches(batchesRes.data);
            setMentorStudents(studentsRes.data);
            setMeetingLogs(meetingsRes.data);

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
                        <div className="user-info-pill" onClick={() => setActiveTab('settings')}>
                            <img src={user?.avatar} alt={user?.name} className="avatar-sm" />
                            <span>{user?.name?.split(' ')[0]}</span>
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
                                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                                <p style={{ color: '#64748b', marginTop: '4px' }}>{formatDate(new Date())}</p>
                            </div>
                        </div>

                        {activeTab === 'overview' && <OverviewSection data={dashboardData} studentsCount={mentorStudents.length} setTab={setActiveTab} />}
                        {activeTab === 'batches' && <BatchesSection batches={batches} />}
                        {activeTab === 'sessions' && <SessionsSection />}
                        {activeTab === 'mentorship' && <MentorshipSection students={mentorStudents} batches={batches} logs={meetingLogs} onRefresh={fetchData} />}
                        {activeTab === 'forum' && <ForumSection batches={batches} />}
                        {activeTab === 'assignments' && <AssignmentsSection />}
                        {activeTab === 'settings' && <SettingsSection user={user} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

const OverviewSection = ({ data, studentsCount, setTab }) => (
    <div className="overview-container">
        <div className="mentor-stats-grid-5">
            <div className="stat-card-refined read-only">
                <div className="stat-icon-refined" style={{ background: '#eff6ff', color: '#3b82f6' }}><FiUsers /></div>
                <span className="stat-value-bold">{studentsCount}</span>
                <span className="stat-label-muted">Assigned Students</span>
            </div>
            <div className="stat-card-refined clickable" onClick={() => setTab('sessions')}>
                <div className="stat-icon-refined" style={{ background: '#f0fdf4', color: '#10b981' }}><FiBook /></div>
                <span className="stat-value-bold">8</span>
                <span className="stat-label-muted">Active Sessions</span>
            </div>
            <div className="stat-card-refined">
                <div className="stat-icon-refined" style={{ background: '#fff7ed', color: '#f59e0b' }}><FiCheckCircle /></div>
                <span className="stat-value-bold">88%</span>
                <span className="stat-label-muted">Avg. Attendance</span>
            </div>
            <div className="stat-card-refined clickable" onClick={() => setTab('forum')}>
                <div className="stat-icon-refined" style={{ background: '#faf5ff', color: '#a855f7' }}><FiMessageSquare /></div>
                <span className="stat-value-bold">5</span>
                <span className="stat-label-muted">Pending Queries</span>
            </div>
            <div className="stat-card-refined">
                <div className="stat-icon-refined" style={{ background: '#eff6ff', color: '#3b82f6' }}><FiCalendar /></div>
                <span className="stat-value-bold">2</span>
                <span className="stat-label-muted">Upcoming Sessions</span>
            </div>
        </div>

        <div className="mentor-grid">
            <div className="glass-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                <h3><FiClock style={{ marginRight: '8px' }} /> Recent Updates</h3>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>No new updates since your last visit.</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
                <h3>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                    <button className="btn-glass-primary" onClick={() => setTab('sessions')} style={{ gridColumn: 'span 2', height: '50px', fontSize: '1rem' }}>
                        <FiPlus /> New Session
                    </button>
                    <button className="btn-glass-secondary" onClick={() => setTab('assignments')} style={{ height: '50px' }}>
                        <FiPlus /> Assignment
                    </button>
                    <button className="btn-glass-secondary" onClick={() => setTab('mentorship')} style={{ height: '50px' }}>
                        <FiCalendar /> Meeting
                    </button>
                    <button className="btn-glass-secondary" style={{ height: '50px', gridColumn: 'span 2' }}>
                        <FiUpload /> Offline Attendance
                    </button>
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
                    <div key={batch.id} className="batch-accordion-item read-only">
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
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8' }}>Mentor(s)</div>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                        {batch.assignedMentors?.map(m => (
                                            <img key={m.id} src={m.avatar} alt={m.name} className="avatar-xs" title={m.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                        ))}
                                    </div>
                                </div>
                                {expandedBatch === batch.id ? <FiChevronUp /> : <FiChevronDown />}
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

const MentorshipSection = ({ students, batches, logs, onRefresh }) => {
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
            <div className="mentor-grid">
                {/* Auto-Fetched Student List */}
                <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>Students From Your Batches</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {students && students.length > 0 ? (
                            students.map(s => (
                                <div key={s.id} className="mentee-card read-only">
                                    <img src={s.avatar} alt="" className="avatar-sm" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            Batch: {s.batchName} • <span style={{ color: '#10b981' }}>{s.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#64748b', textAlign: 'center' }}>No students assigned yet.</p>
                        )}
                    </div>
                </div>

                {/* Schedule Meeting Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
                        <h3><FiCalendar style={{ marginRight: '8px' }} /> Schedule Batch Meeting</h3>
                        <form onSubmit={handleScheduleMeeting} style={{ marginTop: '20px' }}>
                            <div className="glass-form-group">
                                <label className="glass-label">Meeting Title</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="e.g. Weekly Sync-up"
                                    value={meetingForm.title}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="glass-form-group">
                                    <label className="glass-label">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        className="glass-input"
                                        value={meetingForm.date}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-label">Mode</label>
                                    <select
                                        className="glass-input"
                                        value={meetingForm.mode}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, mode: e.target.value })}
                                    >
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                    </select>
                                </div>
                            </div>
                            <div className="glass-form-group">
                                <label className="glass-label">Select Batch</label>
                                <select
                                    className="glass-input"
                                    value={meetingForm.batchId}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, batchId: e.target.value })}
                                    required
                                >
                                    <option value="">Choose a batch...</option>
                                    {batches?.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            {meetingForm.mode === 'Online' && (
                                <div className="glass-form-group">
                                    <label className="glass-label">Meeting Link (Mandatory for Online)</label>
                                    <input
                                        type="url"
                                        className="glass-input"
                                        placeholder="https://zoom.us/j/..."
                                        value={meetingForm.link}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, link: e.target.value })}
                                        required={meetingForm.mode === 'Online'}
                                    />
                                </div>
                            )}
                            <div className="glass-form-group">
                                <label className="glass-label">Description / Agenda</label>
                                <textarea
                                    className="glass-input"
                                    rows="3"
                                    placeholder="What will be discussed?"
                                    value={meetingForm.description}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                                ></textarea>
                            </div>
                            <button type="submit" className="btn-glass-primary" style={{ width: '100%', marginTop: '10px' }} disabled={isSubmitting}>
                                {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
                            </button>
                        </form>
                    </div>

                    {/* Meeting Logs Card - Inside Schedule Meeting Section */}
                    <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
                        <h3>Meeting Logs</h3>
                        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {logs && logs.length > 0 ? (
                                logs.map(log => (
                                    <div key={log.id} style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.title}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {new Date(log.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#3b82f6', margin: '4px 0' }}>
                                            Batch: {batches?.find(b => b.id === log.batchId)?.name || 'Unknown'}
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0' }}>{log.description}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                            <span className={`status-indicator status-${log.status === 'Completed' ? 'resolved' : 'progress'}`} style={{ fontSize: '0.65rem' }}>
                                                {log.status}
                                            </span>
                                            {log.link && (
                                                <a href={log.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none' }}>
                                                    Join Meeting
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#64748b', textAlign: 'center', fontSize: '0.9rem' }}>No meeting logs found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ForumSection = ({ batches }) => (
    <div className="forum-container">
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Q&A / Discussion Forum</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select className="glass-input" style={{ width: '200px', padding: '8px' }}>
                        <option value="">All My Batches</option>
                        {batches?.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="forum-threads">
                {[
                    { id: 1, title: 'Question about React useEffect', user: 'Student Alpha', status: 'open', replies: 0 },
                    { id: 2, title: 'Prisma Migration issue', user: 'Student Beta', status: 'progress', replies: 3 },
                    { id: 3, title: 'Assignment submission deadline?', user: 'Student Gamma', status: 'resolved', replies: 1 }
                ].map(thread => (
                    <div key={thread.id} className="forum-thread-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h4 style={{ margin: 0 }}>{thread.title}</h4>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                                    Started by {thread.user} • 2 hours ago
                                </div>
                            </div>
                            <span className={`status-indicator status-${thread.status}`}>
                                {thread.status === 'open' && <FiAlertCircle size={12} />}
                                {thread.status.charAt(0).toUpperCase() + thread.status.slice(1)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#64748b' }}>
                                <span><FiMessageSquare style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {thread.replies} Replies</span>
                            </div>
                            <button className="btn-glass-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>View & Reply</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const AssignmentsSection = () => (
    <div className="assignments-container">
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Assignments & Tasks</h3>
                <button className="btn-glass-primary"><FiPlus /> Create Assignment</button>
            </div>

            <div className="assignments-grid">
                {[1, 2].map(i => (
                    <div key={i} className="glass-card" style={{ background: 'rgba(255,255,255,0.4)', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="stat-icon-wrapper" style={{ background: '#dbeafe', color: '#2563eb' }}><FiFileText /></div>
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Due: Feb 10</span>
                        </div>
                        <h4 style={{ margin: '16px 0 8px' }}>Project Submission: Module {i}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Complete the project using the tools learned in this module.</p>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>12/15 Reviewed</div>
                            <button className="btn-glass-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Review Now</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const SettingsSection = ({ user }) => (
    <div className="settings-container">
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)', maxWidth: '800px', margin: '0 auto' }}>
            <h3>Mentor Settings</h3>
            <div style={{ display: 'flex', gap: '30px', marginTop: '30px' }}>
                <div style={{ textAlign: 'center' }}>
                    <img
                        src={user?.avatar}
                        alt=""
                        style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    />
                    <button className="btn-glass-secondary" style={{ marginTop: '16px', width: '100%' }}>Change Avatar</button>
                </div>
                <div style={{ flex: 1 }}>
                    <div className="glass-form-group">
                        <label className="glass-label">Full Name</label>
                        <input type="text" className="glass-input" defaultValue={user?.name} />
                    </div>
                    <div className="glass-form-group">
                        <label className="glass-label">Email Address</label>
                        <input type="email" className="glass-input" defaultValue={user?.email} disabled />
                    </div>
                    <div className="glass-form-group">
                        <label className="glass-label">Notification Preferences</label>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                <input type="checkbox" defaultChecked /> Email
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                <input type="checkbox" defaultChecked /> In-app
                            </label>
                        </div>
                    </div>
                    <button className="btn-glass-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>Save Changes</button>
                </div>
            </div>
        </div>
    </div>
);

export default MentorDashboard;
