import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, mentorshipAPI, resourceAPI, adminAPI, batchAPI, mentorAPI, announcementAPI, forumAPI, assignmentAPI, quizAPI } from '../../api';
import {
    FiSearch, FiBell, FiUser, FiLogOut, FiUsers, FiBookOpen,
    FiCalendar, FiPlus, FiUpload, FiSettings, FiCheckCircle,
    FiMessageSquare, FiLayers, FiBarChart2, FiClock, FiAlertCircle, FiChevronDown, FiChevronUp, FiFileText, FiEdit2, FiArrowRight, FiTrash2, FiMessageCircle, FiMenu, FiX, FiZap
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import '../student/Dashboard.css';
import '../admin/AdminDashboard.css';
import './MentorDashboard.css';
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
    const location = useLocation();

    const [dashboardData, setDashboardData] = useState(null);
    const [batches, setBatches] = useState([]);
    const [mentorStudents, setMentorStudents] = useState([]);
    const [meetingLogs, setMeetingLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Determine activeTab from location
    const getActiveTab = () => {
        const path = location.pathname;
        if (path === '/mentor' || path === '/mentor/') return 'overview';
        return path.split('/').pop();
    };

    const activeTab = getActiveTab();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const [announcements, setAnnouncements] = useState([]);
    const [startChatUser, setStartChatUser] = useState(null);

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

    const handleStartChat = (student) => {
        setStartChatUser(student);
        navigate('/mentor/messages');
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
        <div className="mentor-dashboard-content-wrap">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && (
                        <OverviewSection
                            data={dashboardData}
                            studentsCount={mentorStudents.length}
                            setTab={(tab) => navigate(`/mentor/${tab}`)}
                            announcements={announcements}
                            meetingLogs={meetingLogs}
                        />
                    )}
                    {activeTab === 'batches' && <BatchesSection batches={batches} />}
                    {activeTab === 'sessions' && <SessionsSection batches={batches} />}
                    {activeTab === 'mentorship' && <MentorshipSection students={mentorStudents} batches={batches} logs={meetingLogs} onRefresh={fetchData} onStartChat={handleStartChat} />}
                    {activeTab === 'forum' && <ForumSection batches={batches} />}
                    {activeTab === 'assignments' && <AssignmentsSection batches={batches} />}
                    {activeTab === 'messages' && (
                        <div style={{
                            position: 'relative',
                            height: 'calc(100vh - 100px)',
                            margin: '0',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: 'var(--color-bg, #f8fafc)'
                        }}>
                            <MessagingPage initialChatUser={startChatUser} onClearInitialChatUser={handleClearStartChat} />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const OverviewSection = ({ data, studentsCount, setTab, announcements, meetingLogs }) => (
    <div className="overview-container">
        <div className="mentor-stats-grid-5" style={{ marginBottom: '32px' }}>
            {[
                { label: 'Assigned Students', value: studentsCount, icon: <FiUsers />, tone: 'teal' },
                { label: 'Active Sessions', value: '8', icon: <FiBookOpen />, tone: 'blue' },
                { label: 'Avg. Attendance', value: '88%', icon: <FiCheckCircle />, tone: 'orange' },
                { label: 'Pending Queries', value: '5', icon: <FiMessageSquare />, tone: 'purple' },
                { label: 'Upcoming Sessions', value: '2', icon: <FiCalendar />, tone: 'indigo' }
            ].map((stat, idx) => (
                <div key={idx} className={`stat-card-glass stat-${stat.tone}`}>
                    <div className="icon-circle">
                        {stat.icon}
                    </div>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                </div>
            ))}
        </div>

        <div className="mentor-dashboard-sections">
            {/* Left: Upcoming Meetings (70%) */}
            <section className="mentor-panel">
                <header className="mentor-panel-header">
                    <h2><FiCalendar /> Upcoming Meetings</h2>
                    <span className="count-badge-modern">{meetingLogs?.length || 0}</span>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {meetingLogs?.length > 0 ? (
                        meetingLogs.slice(0, 4).map((meeting, i) => (
                            <div key={i} className="session-card" style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--admin-border-color)' }}>
                                <div className="session-date-box" style={{ width: '50px', height: '50px' }}>
                                    <span className="date-day" style={{ fontSize: '18px' }}>{new Date(meeting.meetingDate).getDate()}</span>
                                    <span className="date-month" style={{ fontSize: '9px' }}>{new Date(meeting.meetingDate).toLocaleString('default', { month: 'short' })}</span>
                                </div>
                                <div className="session-info">
                                    <div className="session-title" style={{ fontSize: '1rem' }}>{meeting.title}</div>
                                    <div className="session-meta">
                                        <span><FiClock /> {new Date(meeting.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="status-badge upcoming">Mentorship</span>
                                    </div>
                                </div>
                                <button className="btn-student-outline" style={{ height: '36px', fontSize: '0.8rem' }}>Join</button>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                            <FiCalendar size={40} style={{ marginBottom: '12px' }} />
                            <p>No upcoming meetings found.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Right: Recent Announcements (30%) */}
            <section className="mentor-panel">
                <header className="mentor-panel-header">
                    <div>
                        <h2><FiBell /> Announcements</h2>
                    </div>
                    <span className="count-badge-modern">{announcements?.length || 0}</span>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {announcements?.length > 0 ? (
                        announcements.slice(0, 3).map((ann, i) => (
                            <div key={i} className="session-card" style={{ padding: '12px', border: 'none', background: 'var(--admin-bg-color)' }}>
                                <div className="icon-circle" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', minWidth: '32px' }}>
                                    <FiBell />
                                </div>
                                <div className="session-info">
                                    <div className="session-title" style={{ fontSize: '0.9rem' }}>{ann.title}</div>
                                    <div className="session-meta">
                                        <span className="status-badge upcoming" style={{ fontSize: '0.7rem' }}>New</span>
                                        <span style={{ fontSize: '0.7rem' }}>{new Date(ann.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                            <FiBell size={40} style={{ marginBottom: '12px' }} />
                            <p>No new announcements.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    </div>
);

const BatchesSection = ({ batches }) => {
    const [selectedBatch, setSelectedBatch] = useState(null);

    const batchColors = [
        { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', light: '#ede9fe', text: '#5b21b6' },
        { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', light: '#fce7f3', text: '#be185d' },
        { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', light: '#dbeafe', text: '#1d4ed8' },
        { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', light: '#d1fae5', text: '#065f46' },
        { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', light: '#fff7ed', text: '#c2410c' },
        { gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', light: '#faf5ff', text: '#7e22ce' },
    ];

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
                            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000,
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
                                background: 'white',
                                borderRadius: '24px',
                                padding: '0',
                                width: '100%',
                                maxWidth: '800px',
                                maxHeight: '85vh',
                                overflowY: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}
                        >
                            <div style={{ padding: '28px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{selectedBatch.name}</h2>
                                    <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                                        {selectedBatch.studentsCount} Students &bull; {selectedBatch.assignedMentors?.length || 0} Mentor{selectedBatch.assignedMentors?.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedBatch(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }}>
                                    <FiX size={18} />
                                </button>
                            </div>

                            {/* Mentors Row */}
                            {selectedBatch.assignedMentors && selectedBatch.assignedMentors.length > 0 && (
                                <div style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Mentors</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {selectedBatch.assignedMentors.map(m => (
                                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '7px 14px' }}>
                                                {m.avatar
                                                    ? <img src={m.avatar} alt={m.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem' }}>{m.name.charAt(0).toUpperCase()}</div>
                                                }
                                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>{m.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ padding: '24px 32px' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Students</div>
                                {selectedBatch.students?.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        <FiUsers size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                        <p style={{ margin: 0 }}>No students enrolled yet</p>
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '8px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</th>
                                                <th style={{ padding: '8px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                                                <th style={{ padding: '8px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedBatch.students?.map(s => (
                                                <tr key={s.id} style={{ background: '#f8fafc', borderRadius: '12px' }}>
                                                    <td style={{ padding: '12px 16px', borderRadius: '12px 0 0 12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            {s.avatar
                                                                ? <img src={s.avatar} alt={s.name} style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                                                                : <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>{s.name?.charAt(0).toUpperCase() || '?'}</div>
                                                            }
                                                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{s.name}</div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>{s.email}</td>
                                                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem', borderRadius: '0 12px 12px 0' }}>
                                                        {s.joinedAt ? new Date(s.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Section Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Your Batches</h2>
                    {batches && batches.length > 0 && (
                        <div style={{
                            padding: '4px 14px', borderRadius: '20px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                            color: '#2563eb', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #bfdbfe'
                        }}>
                            {batches.length} Batch{batches.length !== 1 ? 'es' : ''}
                        </div>
                    )}
                </div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Manage and track all your assigned batches</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {batches && batches.length > 0 ? (
                    batches.map((batch, index) => {
                        const colorScheme = batchColors[index % batchColors.length];
                        return (
                            <motion.div
                                key={batch.id}
                                whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.12)' }}
                                style={{
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    background: 'white',
                                    border: '1px solid #f1f5f9',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setSelectedBatch(batch)}
                            >
                                {/* Colored Top Bar */}
                                <div style={{ height: '6px', background: colorScheme.gradient }} />

                                {/* Card Body */}
                                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{
                                                width: '46px', height: '46px', borderRadius: '14px',
                                                background: colorScheme.light,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <FiLayers size={22} color={colorScheme.text} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{batch.name}</h3>
                                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ID: #{batch.id.substring(0, 8)}</span>
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                                            background: batch.status === 'active' ? '#d1fae5' : '#fef3c7',
                                            color: batch.status === 'active' ? '#065f46' : '#92400e',
                                            textTransform: 'capitalize'
                                        }}>
                                            {batch.status}
                                        </span>
                                    </div>

                                    {/* Stats Row */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                                        padding: '16px', background: '#f8fafc', borderRadius: '14px', marginBottom: '18px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FiUsers size={16} color="#3b82f6" />
                                            <div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{batch.studentsCount}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Students</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ display: 'flex', paddingLeft: '4px' }}>
                                                {batch.assignedMentors?.slice(0, 3).map((m, i) => (
                                                    m.avatar
                                                        ? <img
                                                            key={m.id}
                                                            src={m.avatar}
                                                            alt={m.name}
                                                            title={m.name}
                                                            style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid white', marginLeft: i > 0 ? '-8px' : '0', objectFit: 'cover' }}
                                                        />
                                                        : <div
                                                            key={m.id}
                                                            title={m.name}
                                                            style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid white', marginLeft: i > 0 ? '-8px' : '0', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, flexShrink: 0 }}
                                                        >{m.name?.charAt(0).toUpperCase()}</div>
                                                ))}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{batch.assignedMentors?.length || 0}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Mentor{batch.assignedMentors?.length !== 1 ? 's' : ''}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* View Students Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedBatch(batch); }}
                                        style={{
                                            width: '100%', padding: '11px',
                                            background: colorScheme.light, border: 'none',
                                            borderRadius: '12px', color: colorScheme.text,
                                            fontWeight: 600, fontSize: '0.85rem',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            transition: 'all 0.2s', marginTop: 'auto'
                                        }}
                                    >
                                        View Students <FiArrowRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 40px', color: '#94a3b8', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                        <div style={{ background: '#fff', width: '80px', height: '80px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <FiLayers size={32} color="#94a3b8" />
                        </div>
                        <h3 style={{ margin: '0 0 8px 0', color: '#475569', fontWeight: 700 }}>No Batches Assigned</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>You haven't been assigned to any batches yet.</p>
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
            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Upload Sessions & Resources</h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Share learning content with your students</p>
                </div>
                {uploads.length > 0 && (
                    <div style={{ padding: '6px 16px', borderRadius: '20px', background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>
                        {uploads.length} Upload{uploads.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Upload Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '36px' }}>
                <motion.div
                    whileHover={{ y: -3, boxShadow: '0 12px 24px -6px rgba(59, 130, 246, 0.15)' }}
                    onClick={() => handleOpenModal('SESSION')}
                    style={{
                        padding: '28px', borderRadius: '20px', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '1px solid #bfdbfe', transition: 'all 0.3s ease',
                        display: 'flex', alignItems: 'center', gap: '20px'
                    }}
                >
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 8px rgba(59, 130, 246, 0.1)'
                    }}>
                        <FiUpload size={24} color="#3b82f6" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e40af' }}>Upload Session Video</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#3b82f6' }}>MP4, WebM or YouTube link</p>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -3, boxShadow: '0 12px 24px -6px rgba(16, 185, 129, 0.15)' }}
                    onClick={() => handleOpenModal('RESOURCE')}
                    style={{
                        padding: '28px', borderRadius: '20px', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        border: '1px solid #bbf7d0', transition: 'all 0.3s ease',
                        display: 'flex', alignItems: 'center', gap: '20px'
                    }}
                >
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 8px rgba(16, 185, 129, 0.1)'
                    }}>
                        <FiFileText size={24} color="#10b981" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#065f46' }}>Upload Notes / Resources</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#10b981' }}>PDF, PPTX or External Links</p>
                    </div>
                </motion.div>
            </div>

            {/* Uploaded Content List */}
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Your Uploaded Content</h3>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
                        <p>Loading content...</p>
                    </div>
                ) : uploads.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {uploads.map(upload => (
                            <motion.div
                                key={upload.id}
                                whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                                style={{
                                    padding: '18px 20px', borderRadius: '16px',
                                    background: 'white', border: '1px solid #f1f5f9',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                                        background: upload.type === 'SESSION' ? '#eff6ff' : '#f0fdf4',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {upload.type === 'SESSION' ?
                                            <FiUpload size={18} color="#3b82f6" /> :
                                            <FiFileText size={18} color="#10b981" />
                                        }
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{upload.title}</div>
                                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: upload.type === 'SESSION' ? '#eff6ff' : '#f0fdf4', color: upload.type === 'SESSION' ? '#2563eb' : '#16a34a', fontWeight: 600, fontSize: '0.7rem' }}>{upload.type}</span>
                                            <span>{upload.batch?.name || 'N/A'}</span>
                                            <span>•</span>
                                            <span>{upload.duration} mins</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0, marginLeft: '16px' }}>
                                    {upload.avgCompletion > 0 && (
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                                                {Math.round(upload.avgCompletion)}%
                                            </div>
                                            <div style={{ width: '80px', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px' }}>
                                                <div style={{ width: `${upload.avgCompletion}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '2px' }}></div>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleDelete(upload.id)}
                                        style={{
                                            padding: '8px', borderRadius: '10px', border: '1px solid #fee2e2',
                                            background: '#fef2f2', color: '#ef4444', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 40px', color: '#94a3b8', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                        <div style={{ background: '#fff', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <FiUpload size={24} color="#94a3b8" />
                        </div>
                        <h4 style={{ margin: '0 0 6px 0', color: '#475569', fontWeight: 700 }}>No uploads yet</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Click the cards above to upload your first session or resource!</p>
                    </div>
                )}
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
                                background: 'white',
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
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
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
                                            padding: '12px',
                                            border: '1px solid #e2e8f0',
                                            background: 'white',
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
                                            padding: '12px',
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 600,
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
                    background: 'white', padding: '24px', borderRadius: '16px',
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
                    background: 'white', padding: '24px', borderRadius: '16px',
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
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Format: Email, Status (Present/Absent)</p>
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
                    }} style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: '0.85rem', color: '#3b82f6' }}>
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
                    <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #edf2f7' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>My Mentees <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 400 }}>({filteredStudents.length})</span></h3>
                        <div className="search-box-refined" style={{ width: '300px', display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '12px', padding: '8px 16px', border: '1px solid #e2e8f0' }}>
                            <FiSearch style={{ color: '#94a3b8', marginRight: '10px' }} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#1e293b' }}
                            />
                        </div>
                    </div>

                    {/* Mentees Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((s, idx) => (
                                <div key={s.id || idx} className="mentee-card-modern" style={{ position: 'relative', padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                                        <div className="avatar-wrapper">
                                            <img src={s.avatar} alt={s.name} className="avatar-lg" style={{ width: '56px', height: '56px' }} />
                                            <div className="status-indicator online" style={{ width: '12px', height: '12px', border: '2px solid white' }}></div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>{s.batchName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{s.email}</div>
                                        </div>
                                    </div>

                                    {/* Mock Progress - can be real if data available */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px', color: '#64748b' }}>
                                            <span>Course Progress</span>
                                            <span style={{ fontWeight: 600, color: '#3b82f6' }}>75%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: '75%', height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid #f8fafc' }}>
                                        <button
                                            onClick={() => onStartChat(s)}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                                        >
                                            <FiMessageCircle size={16} /> Message
                                        </button>
                                        <button
                                            onClick={() => { setIsScheduling(true); /* Ideally pre-fill form with this student */ }}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                                        >
                                            <FiCalendar size={16} /> Schedule
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                                <FiUsers size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No students found matching "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Quick Actions Card - White Glassy */}
                    <div className="glass-card" style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                            <FiZap style={{ color: '#f59e0b' }} /> Quick Actions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={() => setIsScheduling(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '6px', display: 'flex' }}><FiCalendar size={18} /></div>
                                Schedule Meeting
                            </button>
                            <button
                                onClick={() => setIsUploadingAttendance(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ background: '#f0fdf4', color: '#10b981', padding: '6px', borderRadius: '6px', display: 'flex' }}><FiCheckCircle size={18} /></div>
                                Upload Attendance
                            </button>
                        </div>
                    </div>

                    {/* Insights Card */}
                    <div className="glass-card" style={{ padding: '24px', border: '1px solid #edf2f7' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#1e293b' }}>Insights</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6' }}>{students?.length || 0}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Mentees</div>
                            </div>
                            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{batches?.length || 0}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Active Batches</div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Sessions Preview (Mini) */}
                    <div className="glass-card" style={{ padding: '20px', border: '1px solid #edf2f7' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Upcoming</h3>
                            <span style={{ fontSize: '0.8rem', color: '#3b82f6', cursor: 'pointer' }}>View All</span>
                        </div>

                        {/* Mock Mini List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: '#fff', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px', background: '#eff6ff', borderRadius: '8px', minWidth: '50px' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 700 }}>FEB</span>
                                    <span style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 800 }}>20</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Resume Review</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>10:00 AM • Online</div>
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
            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Q&A Forum</h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Engage with your students and solve their queries</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {forumPosts.length > 0 && (
                        <div style={{ padding: '6px 16px', borderRadius: '20px', background: '#faf5ff', color: '#7c3aed', fontWeight: 700, fontSize: '0.85rem' }}>
                            {forumPosts.length} Thread{forumPosts.length !== 1 ? 's' : ''}
                        </div>
                    )}
                    <div style={{ position: 'relative' }}>
                        <select
                            style={{
                                width: '200px', padding: '10px 36px 10px 16px',
                                borderRadius: '12px', border: '1px solid #e2e8f0',
                                background: 'white', color: '#475569', fontWeight: 500,
                                cursor: 'pointer', appearance: 'none', fontSize: '0.85rem',
                                fontFamily: 'inherit'
                            }}
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                        >
                            <option value="">All My Batches</option>
                            {batches?.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <FiChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                    </div>
                </div>
            </div>

            {/* Thread Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
                        <p>Loading discussions...</p>
                    </div>
                ) : forumPosts.length > 0 ? (
                    forumPosts.map(post => (
                        <motion.div
                            key={post.id}
                            whileHover={{ y: -2, boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.08)' }}
                            style={{
                                background: 'white', borderRadius: '18px', padding: '22px 24px',
                                border: '1px solid #f1f5f9', transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                            onClick={() => handleViewPost(post.id)}
                        >
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                {/* Avatar */}
                                <div style={{ flexShrink: 0 }}>
                                    {post.author?.avatar ? (
                                        <img src={post.author.avatar} alt={post.author.name} style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                                            {post.author?.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '6px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.02rem', color: '#0f172a', fontWeight: 700, lineHeight: '1.4' }}>{post.title}</h4>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700,
                                                background: post.answersCount > 0 ? '#d1fae5' : '#fef3c7',
                                                color: post.answersCount > 0 ? '#065f46' : '#92400e'
                                            }}>
                                                {post.answersCount > 0 ? 'Answered' : 'Open'}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                                        {post.content}
                                    </p>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: post.answersCount > 0 ? '#3b82f6' : '#94a3b8', fontWeight: 500 }}>
                                                <FiMessageSquare size={14} /> {post.answersCount || 0} Replies
                                            </div>
                                            <span style={{ color: '#cbd5e1' }}>•</span>
                                            <span style={{ color: '#94a3b8' }}>
                                                by <span style={{ color: '#475569', fontWeight: 600 }}>{post.author?.name}</span>
                                            </span>
                                        </div>

                                        <button
                                            style={{
                                                padding: '7px 16px', fontSize: '0.8rem',
                                                background: '#f8fafc', color: '#3b82f6',
                                                border: '1px solid #e2e8f0', borderRadius: '10px',
                                                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                                display: 'flex', alignItems: 'center', gap: '6px'
                                            }}
                                        >
                                            View <FiArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '80px 40px', color: '#94a3b8', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                        <div style={{ background: '#fff', width: '72px', height: '72px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
                            <FiMessageSquare size={28} color="#94a3b8" />
                        </div>
                        <h3 style={{ margin: '0 0 8px 0', color: '#475569', fontWeight: 700 }}>No discussions yet</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>When students ask questions, they will appear here.</p>
                    </div>
                )}
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

            {/* Tabs & Search Bar */}
            <div style={{ marginBottom: '32px', marginTop: showCreateForm ? '0' : '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', background: '#f1f5f9', padding: '6px', borderRadius: '12px' }}>
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
                        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading assignments...</div>
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
                                            background: 'white',
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
                                            <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: '20px', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                                                {assignment.batch?.name || 'General'}
                                            </div>
                                            <div style={{ background: 'white', padding: '8px', borderRadius: '10px', color: '#2563eb' }}>
                                                <FiFileText size={20} />
                                            </div>
                                        </div>

                                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                                                {assignment.title}
                                            </h4>
                                            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                                                {assignment.description}
                                            </p>

                                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                                                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                    <span style={{ fontWeight: 600, color: pendingCount > 0 ? '#d97706' : '#64748b' }}>
                                                        {submissionsCount} Subs {pendingCount > 0 && `(${pendingCount} new)`}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => handleViewSubmissions(assignment.id)}
                                                    style={{ width: '100%', padding: '10px', background: 'white', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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
                        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                            <FiFileText size={48} style={{ marginBottom: '16px', color: '#94a3b8' }} />
                            <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>No assignments yet</h3>
                            <p style={{ color: '#64748b', margin: 0 }}>Create your first assignment to get started.</p>
                        </div>
                    )
                )}

                {activeTab === 'quizzes' && (
                    loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading quizzes...</div>
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
                                            background: 'white',
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
                                            <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: '20px', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                                                {quiz.questions?.length || 0} Questions
                                            </div>
                                            <div style={{ background: 'white', padding: '8px', borderRadius: '10px', color: '#059669' }}>
                                                <FiCheckCircle size={20} />
                                            </div>
                                        </div>

                                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                                                {quiz.title}
                                            </h4>
                                            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                                                {quiz.description || 'No description provided.'}
                                            </p>

                                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
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
                        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                            <FiCheckCircle size={48} style={{ marginBottom: '16px', color: '#94a3b8' }} />
                            <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>No quizzes yet</h3>
                            <p style={{ color: '#64748b', margin: 0 }}>Create a quiz to assess your students.</p>
                        </div>
                    )
                )}
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
                            style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <h2 style={{ margin: '0 0 24px', fontSize: '1.5rem', color: '#1e293b' }}>Create New Quiz</h2>
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
                                            style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
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
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                {b.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-label">Questions (Manual or CSV)</label>
                                    <div style={{ marginBottom: '16px', padding: '16px', background: '#f8faff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                        <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#64748b' }}>
                                            Upload a CSV file with format: <code>question, option1, option2, option3, option4, correctOptionIndex</code>
                                        </p>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleCSVUpload}
                                            style={{ display: 'block', width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                        {quizFormData.questions.length} questions added
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateQuiz(false)}
                                        style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
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
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                            <h3 style={{ margin: '0 0 16px' }}>CSV Preview ({csvPreview.length} questions)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {csvPreview.map((q, i) => (
                                    <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <p style={{ fontWeight: 600, margin: '0 0 8px' }}>{i + 1}. {q.question}</p>
                                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#64748b' }}>
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
                                    style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
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
