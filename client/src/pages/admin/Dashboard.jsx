import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, announcementAPI, batchAPI } from '../../api';
import {
    FiSearch, FiBell, FiLogOut, FiUsers, FiBook,
    FiCalendar, FiMessageSquare, FiMessageCircle, FiPlus, FiEdit2, FiBarChart2, FiLayers, FiSettings, FiMoreVertical, FiTrash2, FiMenu, FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingAnimation from '../../components/LoadingAnimation';
import MessagingPage from '../MessagingPage';
import BatchManagement from '../../components/admin/BatchManagement';
import CreateUserModal from '../../components/admin/CreateUserModal';
import BulkUserModal from '../../components/admin/BulkUserModal';
import '../student/Dashboard.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, logout, socket } = useAuth(); // Get socket from auth context
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showBulkUserModal, setShowBulkUserModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [announcements, setAnnouncements] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [batches, setBatches] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: '',
        priority: 'normal',
        batchIds: []
    });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchData();
    }, []);

    // Filter Users Effect
    useEffect(() => {
        if (!searchQuery) {
            setFilteredUsers(users);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = users.filter(u =>
                u.name.toLowerCase().includes(lowerQuery) ||
                u.email.toLowerCase().includes(lowerQuery) ||
                u.role.toLowerCase().includes(lowerQuery)
            );
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

    // Socket.IO Listeners
    useEffect(() => {
        if (socket) {
            socket.on('notification', (data) => {
                // Increment unread count or show toast
                setUnreadNotifications(prev => prev + 1);
                // Optionally refetch data
                fetchData();
            });

            return () => {
                socket.off('notification');
            };
        }
    }, [socket]);

    // Refresh data when switching to overview
    useEffect(() => {
        if (activeTab === 'overview') {
            fetchData();
        }
    }, [activeTab]);

    const fetchData = async () => {
        try {
            const [dashboardRes, usersRes, announcementsRes, batchesRes] = await Promise.all([
                adminAPI.getReports(),
                adminAPI.getUsers(),
                announcementAPI.getAll ? announcementAPI.getAll() : { data: [] },
                batchAPI.getAll()
            ]);

            // Merge batches into dashboard data to ensure overview is always up to date
            const data = dashboardRes.data;
            data.recentBatches = batchesRes.data;

            setDashboardData(data);
            setUsers(usersRes.data);
            setFilteredUsers(usersRes.data);
            setAnnouncements(announcementsRes.data || []);
            setBatches(batchesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAnnouncement = async (e) => {
        e.preventDefault();
        try {
            await announcementAPI.create(newAnnouncement);
            setNewAnnouncement({ title: '', content: '', priority: 'normal', batchIds: [] });

            // Success alert
            alert('✅ Announcement published successfully! Students in the selected batches will see it on their dashboard.');

            fetchData();
        } catch (error) {
            console.error('Failed to create announcement:', error);

            // Error alert
            alert('❌ Failed to publish announcement. Please try again or check your connection.');
        }
    };

    const handleBatchSelection = (batchId) => {
        const currentBatchIds = newAnnouncement.batchIds || [];
        const isSelected = currentBatchIds.includes(batchId);

        setNewAnnouncement({
            ...newAnnouncement,
            batchIds: isSelected
                ? currentBatchIds.filter(id => id !== batchId)
                : [...currentBatchIds, batchId]
        });
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await adminAPI.deleteUser(userId);
                fetchData();
            } catch (error) {
                console.error('Failed to delete user:', error);
                alert('Failed to delete user. Please try again.');
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const stats = dashboardData?.stats || {};
    const engagementSeries = useMemo(() => {
        const source = dashboardData?.recentTrackings || [];
        const today = new Date();
        const grouped = new Map();

        source.forEach((tracking) => {
            const key = new Date(tracking.createdAt).toISOString().slice(0, 10);
            grouped.set(key, (grouped.get(key) || 0) + 1);
        });

        return Array.from({ length: 7 }).map((_, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - index));
            const key = date.toISOString().slice(0, 10);

            return {
                label: date.toLocaleDateString(undefined, { weekday: 'short' }),
                value: grouped.get(key) || 0
            };
        });
    }, [dashboardData]);

    const batchDistribution = useMemo(() => {
        const source = dashboardData?.recentBatches || [];
        if (source.length === 0) {
            return [
                { label: 'Batch A', value: 22 },
                { label: 'Batch B', value: 14 },
                { label: 'Batch C', value: 10 }
            ];
        }

        return source.slice(0, 5).map((batch) => ({
            label: batch.name,
            value: batch._count?.students ?? batch.students?.length ?? 0
        }));
    }, [dashboardData]);

    const systemHealth = useMemo(
        () => [
            {
                label: 'API Uptime',
                value: '99.9%',
                status: 'healthy'
            },
            {
                label: 'Queue Throughput',
                value: `${dashboardData?.recentTrackings?.length || 0} events`,
                status: (dashboardData?.recentTrackings?.length || 0) > 0 ? 'healthy' : 'watch'
            },
            {
                label: 'Announcement Delivery',
                value: `${announcements?.length || 0} sent`,
                status: 'healthy'
            }
        ],
        [announcements?.length, dashboardData?.recentTrackings?.length]
    );

    const engagementMax = Math.max(...engagementSeries.map((point) => point.value), 1);
    const engagementPath = engagementSeries
        .map((point, index) => {
            const x = (index / Math.max(1, engagementSeries.length - 1)) * 320;
            const y = 120 - (point.value / engagementMax) * 104;
            return `${x},${y}`;
        })
        .join(' ');

    const batchMax = Math.max(...batchDistribution.map((batch) => batch.value), 1);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="glass-card p-xl">
                    <LoadingAnimation size={120} />
                    <p style={{ marginTop: '20px', textAlign: 'center' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Navbar Refined to match Mentor/Student */}
            {/* Navbar Refined to match Mentor/Student */}
            <nav className="admin-navbar">
                <div className="navbar-brand-mentor" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
                    <img src="/logo.png" alt="Logo" className="navbar-logo" style={{ height: '40px', width: 'auto' }} />
                    <span className="mentor-logo-text">Khushboo Pathshala</span>
                </div>

                {/* Mobile Menu Button - Visible only on mobile */}
                <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                <div className="navbar-actions-mentor">
                    <div className="mentor-tabs-container nav-links-desktop">
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
                                className={`mentor-tab ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                <FiUsers /> Users
                            </button>
                            <button
                                className={`mentor-tab ${activeTab === 'announcements' ? 'active' : ''}`}
                                onClick={() => setActiveTab('announcements')}
                            >
                                <FiBell /> Announcements
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
                        <button className="icon-btn" style={{ position: 'relative' }} onClick={() => setShowNotifications(!showNotifications)}>
                            <FiBell />
                            {unreadNotifications > 0 && <span className="notification-dot"></span>}
                        </button>
                        <div className="user-info-pill" onClick={() => navigate('/settings')}>
                            <img src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky'} alt={user?.name} className="avatar-sm" />
                            <span>{user?.name?.split(' ')[0]} (Admin)</span>
                        </div>
                        <button className="icon-btn" onClick={handleLogout} title="Logout">
                            <FiLogOut />
                        </button>
                        {/* Mobile Toggle removed from here */}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu - Sidebar Style via Portal */}
            {ReactDOM.createPortal(
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            className="mobile-menu-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
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
                                    <button onClick={() => setIsMenuOpen(false)}>
                                        <FiX size={24} />
                                    </button>
                                </div>
                                <div className="mobile-menu-links">
                                    <button className={`mobile-menu-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setIsMenuOpen(false); }}>
                                        <FiBarChart2 /> <span>Overview</span>
                                    </button>
                                    <button className={`mobile-menu-link ${activeTab === 'batches' ? 'active' : ''}`} onClick={() => { setActiveTab('batches'); setIsMenuOpen(false); }}>
                                        <FiLayers /> <span>Batches</span>
                                    </button>
                                    <button className={`mobile-menu-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setIsMenuOpen(false); }}>
                                        <FiUsers /> <span>Users</span>
                                    </button>
                                    <button className={`mobile-menu-link ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => { setActiveTab('announcements'); setIsMenuOpen(false); }}>
                                        <FiBell /> <span>Announcements</span>
                                    </button>
                                    <button className={`mobile-menu-link ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => { setActiveTab('messages'); setIsMenuOpen(false); }}>
                                        <FiMessageCircle /> <span>Messages</span>
                                    </button>
                                </div>
                                <div className="mobile-menu-footer">
                                    <button className="mobile-settings-btn" onClick={() => { navigate('/settings'); setIsMenuOpen(false); }}>
                                        <FiSettings />
                                        <span>Settings</span>
                                    </button>
                                    <button className="mobile-logout-btn" onClick={() => { logout(); navigate('/login'); setIsMenuOpen(false); }}>
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

            {/* Notifications Dropdown */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="notification-dropdown-refined"
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0 }}>Notifications</h4>
                            <button className="btn-ghost btn-sm" onClick={() => setUnreadNotifications(0)}>Clear all</button>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {unreadNotifications > 0 ? (
                                <div className="mentee-card" style={{ marginBottom: '8px', cursor: 'pointer' }}>
                                    <FiBell style={{ color: '#3B82F6' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)' }}>Real-time Update</div>
                                        <div style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)' }}>New activity detected on the platform.</div>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-)', fontSize: 'var(--fs-body)', padding: '20px 0' }}>
                                    No new notifications
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Main Content */}
            <div className="dashboard-content">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {activeTab === 'overview' && (
                        <div className="admin-overview-v2">
                            <section className="admin-hero card-hero">
                                <div>
                                    <h1>Admin Command Center</h1>
                                    <p>Track platform health, student engagement, and batch growth from one enterprise dashboard.</p>
                                </div>
                                <span className="badge badge-primary">Live Monitoring</span>
                            </section>

                            <section className="admin-kpi-grid">
                                <article className="admin-kpi-card">
                                    <span className="admin-kpi-icon"><FiUsers /></span>
                                    <strong>{stats.totalStudents || 0}</strong>
                                    <small>Total Students</small>
                                </article>
                                <article className="admin-kpi-card">
                                    <span className="admin-kpi-icon"><FiBook /></span>
                                    <strong>{stats.totalMentors || 0}</strong>
                                    <small>Total Mentors</small>
                                </article>
                                <article className="admin-kpi-card">
                                    <span className="admin-kpi-icon"><FiCalendar /></span>
                                    <strong>{stats.totalSessions || 0}</strong>
                                    <small>Total Sessions</small>
                                </article>
                                <article className="admin-kpi-card">
                                    <span className="admin-kpi-icon"><FiBell /></span>
                                    <strong>{stats.totalResources || 0}</strong>
                                    <small>Learning Resources</small>
                                </article>
                            </section>

                            <section className="admin-analytics-grid">
                                <article className="admin-analytics-card">
                                    <header>
                                        <h3>Engagement Trend</h3>
                                        <span>Last 7 days</span>
                                    </header>

                                    <svg viewBox="0 0 320 130" role="img" aria-label="Engagement trend">
                                        <polyline className="admin-line-area" points={`0,120 ${engagementPath} 320,120`} />
                                        <polyline className="admin-line-path" points={engagementPath} />
                                        {engagementSeries.map((point, index) => {
                                            const x = (index / Math.max(1, engagementSeries.length - 1)) * 320;
                                            const y = 120 - (point.value / engagementMax) * 104;
                                            return <circle key={point.label} cx={x} cy={y} r="3" className="admin-line-point" />;
                                        })}
                                    </svg>

                                    <div className="admin-line-axis">
                                        {engagementSeries.map((point) => (
                                            <span key={point.label}>{point.label}</span>
                                        ))}
                                    </div>
                                </article>

                                <article className="admin-analytics-card">
                                    <header>
                                        <h3>Batch Comparison</h3>
                                        <span>Students per batch</span>
                                    </header>

                                    <div className="admin-batch-bars">
                                        {batchDistribution.map((batch) => (
                                            <div key={batch.label} className="admin-batch-bar">
                                                <div className="admin-batch-track">
                                                    <div className="admin-batch-fill" style={{ width: `${(batch.value / batchMax) * 100}%` }} />
                                                </div>
                                                <div className="admin-batch-meta">
                                                    <span>{batch.label}</span>
                                                    <strong>{batch.value}</strong>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </article>

                                <article className="admin-analytics-card">
                                    <header>
                                        <h3>System Health</h3>
                                        <span>Status panel</span>
                                    </header>

                                    <div className="admin-health-list">
                                        {systemHealth.map((metric) => (
                                            <div key={metric.label} className="admin-health-item">
                                                <div>
                                                    <strong>{metric.label}</strong>
                                                    <p>{metric.value}</p>
                                                </div>
                                                <span className={`admin-health-badge ${metric.status}`}>{metric.status === 'healthy' ? 'Healthy' : 'Watch'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            </section>

                            <section className="admin-announcement-grid">
                                <article className="admin-analytics-card">
                                    <header>
                                        <h3>Recent Trackings</h3>
                                        <span>{dashboardData?.recentTrackings?.length || 0}</span>
                                    </header>

                                    <div className="admin-feed-list">
                                        {dashboardData?.recentTrackings?.length ? (
                                            dashboardData.recentTrackings.slice(0, 5).map((tracking) => (
                                                <div key={tracking.id} className="admin-feed-item">
                                                    <div>
                                                        <strong>{tracking.user?.name}</strong>
                                                        <p>{tracking.resource?.title}</p>
                                                    </div>
                                                    <span className={`badge ${tracking.attendanceMarked ? 'badge-success' : 'badge-warning'}`}>
                                                        {tracking.attendanceMarked ? 'Completed' : 'In Progress'}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="admin-empty-inline">No recent tracking activity.</div>
                                        )}
                                    </div>
                                </article>

                                <article className="admin-analytics-card">
                                    <header>
                                        <h3>Latest Announcements</h3>
                                        <span>{announcements?.length || 0}</span>
                                    </header>

                                    <div className="admin-feed-list">
                                        {announcements && announcements.length > 0 ? (
                                            announcements.slice(0, 4).map((announcement) => (
                                                <div key={announcement.id} className="admin-feed-item">
                                                    <div>
                                                        <strong>{announcement.title}</strong>
                                                        <p>{announcement.content}</p>
                                                    </div>
                                                    <small>{new Date(announcement.createdAt).toLocaleDateString()}</small>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="admin-empty-inline">No announcements published yet.</div>
                                        )}
                                    </div>
                                </article>
                            </section>
                        </div>
                    )}

                    {/* Messages Tab */}
                    {activeTab === 'messages' && (
                        <div style={{
                            position: 'fixed',
                            top: '80px',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 100,
                            background: '#fff'
                        }}>
                            <MessagingPage />
                        </div>
                    )}

                    {activeTab === 'batches' && (
                        <BatchManagement onRefresh={fetchData} />
                    )}

                    {activeTab === 'users' && (
                        <motion.div
                            className="glass-card"
                            style={{ padding: 'var(--spacing-xl)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                <h3 style={{ marginBottom: 0 }}>
                                    <FiUsers style={{ marginRight: 'var(--spacing-sm)' }} /> User Management
                                </h3>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button
                                        className="btn-glass-secondary"
                                        onClick={() => setShowBulkUserModal(true)}
                                    >
                                        <FiPlus /> Create Bulk Users
                                    </button>
                                    <button
                                        className="btn-glass-primary"
                                        onClick={() => setShowCreateUserModal(true)}
                                    >
                                        <FiPlus /> New User
                                    </button>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <th style={{ textAlign: 'left', padding: 'var(--spacing-md)', fontSize: 'var(--text-sm)' }}>User</th>
                                            <th style={{ textAlign: 'left', padding: 'var(--spacing-md)', fontSize: 'var(--text-sm)' }}>Email</th>
                                            <th style={{ textAlign: 'left', padding: 'var(--spacing-md)', fontSize: 'var(--text-sm)' }}>Role</th>
                                            <th style={{ textAlign: 'left', padding: 'var(--spacing-md)', fontSize: 'var(--text-sm)' }}>Joined</th>
                                            <th style={{ textAlign: 'left', padding: 'var(--spacing-md)', fontSize: 'var(--text-sm)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u) => (
                                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                <td style={{ padding: 'var(--spacing-md)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                        <img src={u.avatar} alt={u.name} className="avatar avatar-sm" />
                                                        <span style={{ fontWeight: 'var(--fw-medium)' }}>{u.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                                    {u.email}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)' }}>
                                                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' :
                                                        u.role === 'MENTOR' ? 'badge-warning' : 'badge-primary'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', display: 'flex', gap: '8px' }}>
                                                    <select
                                                        className="select"
                                                        style={{ minWidth: '120px', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                                                        value={u.role}
                                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    >
                                                        <option value="STUDENT">Student</option>
                                                        <option value="MENTOR">Mentor</option>
                                                        <option value="ADMIN">Admin</option>
                                                    </select>
                                                    <button
                                                        className="btn-icon-sm"
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        title="Delete User"
                                                        style={{ color: '#ef4444', background: '#fee2e2' }}
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'announcements' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* New Announcement Section - Always Open */}
                            <motion.div
                                className="glass-card"
                                style={{ padding: 'var(--spacing-xl)' }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                    <h3 style={{ margin: 0 }}>
                                        <FiPlus style={{ marginRight: 'var(--spacing-sm)' }} /> Create New Announcement
                                    </h3>
                                </div>

                                <motion.form
                                    onSubmit={handleAddAnnouncement}
                                >
                                    <div className="input-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <label>Title</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={newAnnouncement.title}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                            required
                                            placeholder="Enter announcement title..."
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <label>Content</label>
                                        <textarea
                                            className="input"
                                            rows={4}
                                            value={newAnnouncement.content}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                            required
                                            placeholder="Enter announcement details..."
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <label>Priority</label>
                                        <select
                                            className="select"
                                            value={newAnnouncement.priority}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                                        >
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                        <label>Target Batches (optional - leave empty for all students)</label>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                            gap: '12px',
                                            padding: 'var(--space-20)',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            {batches.length > 0 ? batches.map(batch => (
                                                <label key={batch.id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer',
                                                    padding: '8px',
                                                    background: (newAnnouncement.batchIds || []).includes(batch.id) ? '#dbeafe' : 'white',
                                                    borderRadius: '6px',
                                                    border: '1px solid',
                                                    borderColor: (newAnnouncement.batchIds || []).includes(batch.id) ? '#3b82f6' : '#e2e8f0',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={(newAnnouncement.batchIds || []).includes(batch.id)}
                                                        onChange={() => handleBatchSelection(batch.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <span style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)' }}>{batch.name}</span>
                                                </label>
                                            )) : (
                                                <p style={{ color: 'var(--color-text-)', gridColumn: '1 / -1' }}>No batches available</p>
                                            )}
                                        </div>
                                        <small style={{ color: 'var(--color-text-)', marginTop: '4px', display: 'block' }}>
                                            Select specific batches or leave empty to send to all students
                                        </small>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button type="submit" className="btn btn-primary">
                                            Publish Announcement
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            onClick={() => setNewAnnouncement({ title: '', content: '', priority: 'normal', batchIds: [] })}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </motion.form>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Modals */}
            {
                showCreateUserModal && (
                    <CreateUserModal
                        onClose={() => setShowCreateUserModal(false)}
                        onSuccess={fetchData}
                    />
                )
            }
            {
                showBulkUserModal && (
                    <BulkUserModal
                        onClose={() => setShowBulkUserModal(false)}
                        onSuccess={fetchData}
                    />
                )
            }
        </div >
    );
};

export default AdminDashboard;
