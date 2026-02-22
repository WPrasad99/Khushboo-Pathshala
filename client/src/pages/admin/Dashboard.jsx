import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, announcementAPI, batchAPI } from '../../api';
import {
    FiSearch, FiBell, FiLogOut, FiUsers, FiBook,
    FiCalendar, FiMessageSquare, FiMessageCircle, FiPlus, FiEdit2, FiBarChart2, FiLayers, FiSettings, FiMoreVertical, FiTrash2, FiMenu, FiX,
    FiSun, FiMoon
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingAnimation from '../../components/LoadingAnimation';
import MessagingPage from '../MessagingPage';
import BatchManagement from '../../components/admin/BatchManagement';
import CreateUserModal from '../../components/admin/CreateUserModal';
import BulkUserModal from '../../components/admin/BulkUserModal';
import '../student/Dashboard.css';
import './AdminDashboard.css';

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

    // Theme Architecture State
    const [theme, setTheme] = useState(localStorage.getItem('admin-theme') || 'light');

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

    // Theme Application Effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('admin-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

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

    const handleRoleChange = async (userId, newRole) => {
        try {
            await adminAPI.updateUserRole(userId, { role: newRole });
            // Show subtle success indication if possible, for now fetchData is okay
            fetchData();
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('Failed to update user role. Please try again.');
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
            return [];
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
            <nav className="admin-navbar">
                <div className="navbar-brand-mentor" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
                    <img src="/logo.png" alt="Logo" className="navbar-logo" style={{ height: '36px', width: 'auto' }} />
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
                        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'light' ? <FiMoon /> : <FiSun />}
                        </button>
                        <button className="icon-btn" style={{ position: 'relative' }} onClick={() => setShowNotifications(!showNotifications)}>
                            <FiBell />
                            {unreadNotifications > 0 && <span className="notification-dot"></span>}
                        </button>
                        <div className="user-info-pill" onClick={() => navigate('/settings')}>
                            <img src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky'} alt={user?.name} className="avatar-sm" />
                            <span className="user-name-text">{user?.name?.split(' ')[0]} (Admin)</span>
                        </div>
                        <button className="icon-btn" onClick={handleLogout} title="Logout">
                            <FiLogOut />
                        </button>
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
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <h1 className="page-title-enterprise">Academy Overview</h1>
                                    <p className="page-subtitle-enterprise">Real-time metrics and operational status.</p>
                                </div>
                                <span className="badge badge-primary">Live Monitoring</span>
                            </div>

                            <div className="stats-grid">
                                <div className="stat-card-enterprise">
                                    <div className="stat-header">
                                        <div className="stat-icon-wrapper">
                                            <FiUsers />
                                        </div>
                                        <span className="stat-label-enterprise">Total Students</span>
                                    </div>
                                    <span className="stat-val-enterprise"><CountUp value={stats.totalStudents || 0} /></span>
                                </div>
                                <div className="stat-card-enterprise">
                                    <div className="stat-header">
                                        <div className="stat-icon-wrapper">
                                            <FiLayers />
                                        </div>
                                        <span className="stat-label-enterprise">Total Mentors</span>
                                    </div>
                                    <span className="stat-val-enterprise"><CountUp value={stats.totalMentors || 0} /></span>
                                </div>
                                <div className="stat-card-enterprise">
                                    <div className="stat-header">
                                        <div className="stat-icon-wrapper">
                                            <FiBook />
                                        </div>
                                        <span className="stat-label-enterprise">Total Resources</span>
                                    </div>
                                    <span className="stat-val-enterprise"><CountUp value={stats.totalResources || 0} /></span>
                                </div>
                                <div className="stat-card-enterprise">
                                    <div className="stat-header">
                                        <div className="stat-icon-wrapper">
                                            <FiCalendar />
                                        </div>
                                        <span className="stat-label-enterprise">Total Sessions</span>
                                    </div>
                                    <span className="stat-val-enterprise"><CountUp value={stats.totalSessions || 0} /></span>
                                </div>
                            </div>

                            {/* Main Grid: Recent Activity & Active Batches */}
                            <div className="admin-main-grid">
                                {/* Recent Activity */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="section-header">
                                        <h3 className="section-title">
                                            <FiCalendar style={{ color: 'var(--admin-text-muted)' }} /> Recent Session Trackings
                                        </h3>
                                        <span className="view-all-link">View All</span>
                                    </div>
                                    <div className="tracking-list-container">
                                        {dashboardData?.recentTrackings?.slice(0, 5).map((tracking, index) => (
                                            <div key={index} className={`tracking-row ${tracking.attendanceMarked ? 'is-completed' : 'is-progress'}`}>
                                                <div style={{ flex: 1 }}>
                                                    <div className="tracking-user-name">
                                                        {tracking.user?.name}
                                                    </div>
                                                    <div className="tracking-resource-title">
                                                        {tracking.resource?.title}
                                                    </div>
                                                </div>
                                                <span className={`status-badge-enterprise ${tracking.attendanceMarked ? 'completed' : 'progress'}`}>
                                                    {tracking.attendanceMarked ? 'Completed' : 'In Progress'}
                                                </span>
                                            </div>
                                        )) || <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No recent activity.</div>}
                                    </div>
                                </motion.div>

                                {/* Active Batches */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div className="section-header">
                                        <h3 className="section-title">
                                            <FiBook style={{ color: 'var(--admin-text-muted)' }} /> Active Batches
                                        </h3>
                                        {/* Optional View All if list goes beyond 5 */}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {dashboardData?.recentBatches && dashboardData.recentBatches.length > 0 ? (
                                            dashboardData.recentBatches.slice(0, 6).map((batch) => (
                                                <div key={batch.id} className="admin-card" style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '500', fontSize: '0.95rem', color: 'var(--admin-text-primary)' }}>{batch.name}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                                                                {(batch._count?.students ?? batch.students?.length ?? 0)} Enrolled Students
                                                            </div>
                                                        </div>
                                                        <span className="status-badge-enterprise completed">Active</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state-container">
                                                <FiLayers className="empty-state-icon" />
                                                <h4 className="empty-state-title">No Active Batches</h4>
                                                <p className="empty-state-desc">You haven't assigned any active cohort batches yet.</p>
                                                <button className="btn-enterprise-secondary" onClick={() => setActiveTab('batches')}>Manage Batches</button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Full Width Section: Latest Announcements */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="section-header">
                                    <h3 className="section-title">
                                        <FiBell style={{ color: 'var(--admin-text-muted)' }} /> Latest Announcements
                                    </h3>
                                    <span className="view-all-link" onClick={() => setActiveTab('announcements')}>Manage Announcements</span>
                                </div>

                                <div className="announcements-grid">
                                    {announcements && announcements.length > 0 ? (
                                        announcements.slice(0, 3).map((ann) => (
                                            <div key={ann.id} className="announcement-card">
                                                <span className="announcement-category">Academy Notice</span>
                                                <h4 className="announcement-title" title={ann.title}>{ann.title}</h4>
                                                <p className="announcement-desc">{ann.content}</p>
                                                <p className="announcement-meta">Published on {new Date(ann.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', border: '1px dashed var(--admin-border-color)', borderRadius: 'var(--admin-radius-lg)' }}>
                                            <p style={{ color: 'var(--admin-text-secondary)', margin: 0 }}>No announcements broadcasted yet.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
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
                            background: 'var(--bg-secondary)'
                        }}>
                            <MessagingPage />
                        </div>
                    )}

                    {activeTab === 'batches' && (
                        <BatchManagement onRefresh={fetchData} />
                    )}

                    {activeTab === 'users' && (
                        <div className="admin-page-container">
                            <header className="admin-section-header">
                                <div className="title-stack">
                                    <h1><FiUsers /> User Management</h1>
                                    <p>Manage access, assign roles, and track academy membership.</p>
                                </div>
                                <div className="header-actions">
                                    <button
                                        className="btn-admin-outline"
                                        onClick={() => setShowBulkUserModal(true)}
                                    >
                                        <FiPlus /> Bulk Create
                                    </button>
                                    <button
                                        className="btn-admin-primary"
                                        onClick={() => setShowCreateUserModal(true)}
                                    >
                                        <FiPlus /> New User
                                    </button>
                                </div>
                            </header>

                            <div className="admin-table-card">
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>User Profile</th>
                                                <th>Email Address</th>
                                                <th className="text-center">Role</th>
                                                <th className="text-center">Joined Date</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                                                <tr key={u.id} className="admin-table-row">
                                                    <td>
                                                        <div className="user-stack">
                                                            <div className="avatar-wrapper">
                                                                <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt={u.name} />
                                                                <div className="status-ring" />
                                                            </div>
                                                            <span className="user-name">{u.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="user-email">{u.email}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`role-badge ${u.role.toLowerCase()}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="date-text">{new Date(u.createdAt).toLocaleDateString()}</span>
                                                    </td>
                                                    <td>
                                                        <div className="table-actions">
                                                            <select
                                                                className="role-selector"
                                                                value={u.role}
                                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                            >
                                                                <option value="STUDENT">Student</option>
                                                                <option value="MENTOR">Mentor</option>
                                                                <option value="ADMIN">Admin</option>
                                                            </select>
                                                            <button
                                                                className="btn-delete-ghost"
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                title="Delete User"
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="5" className="empty-table-state">
                                                        No users found matching your search.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'announcements' && (
                        <div className="admin-page-container">
                            <header className="admin-section-header">
                                <div className="title-stack">
                                    <h1><FiBell /> Announcements</h1>
                                    <p>Broadcast notices and updates to specific batches or the entire academy.</p>
                                </div>
                            </header>

                            <div className="admin-card-container">
                                <header className="card-inner-header">
                                    <h2><FiPlus /> Create New Announcement</h2>
                                    <div className="divider" />
                                </header>

                                <form onSubmit={handleAddAnnouncement} className="announcement-form">
                                    <div className="form-row">
                                        <div className="input-group full">
                                            <label>Announcement Title</label>
                                            <input
                                                type="text"
                                                className="admin-input"
                                                value={newAnnouncement.title}
                                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                                required
                                                placeholder="e.g., Upcoming Holiday Notice"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group full">
                                            <label>Message Content</label>
                                            <textarea
                                                className="admin-textarea"
                                                value={newAnnouncement.content}
                                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                                required
                                                placeholder="Write your announcement details here..."
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row split">
                                        <div className="input-group">
                                            <label>Priority Level</label>
                                            <div className="select-wrapper">
                                                <select
                                                    className="admin-select"
                                                    value={newAnnouncement.priority}
                                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                                                >
                                                    <option value="low">Low Priority</option>
                                                    <option value="normal">Normal</option>
                                                    <option value="high">High Priority</option>
                                                </select>
                                                <div className={`priority-indicator ${newAnnouncement.priority}`} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="input-group full">
                                        <label>Target Batches <span className="helper-text">(Optional — leave empty for all students)</span></label>
                                        <div className="batch-chips-grid">
                                            {batches.length > 0 ? batches.map(batch => {
                                                const isSelected = (newAnnouncement.batchIds || []).includes(batch.id);
                                                return (
                                                    <div
                                                        key={batch.id}
                                                        className={`batch-chip-card ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => handleBatchSelection(batch.id)}
                                                    >
                                                        <div className="chip-checkbox">
                                                            {isSelected && <FiCheckCircle />}
                                                        </div>
                                                        <div className="chip-info">
                                                            <span className="batch-name">{batch.name}</span>
                                                            <span className="batch-meta">{(batch._count?.students ?? batch.students?.length ?? 0)} Students</span>
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <div className="empty-selection-state">No batches created yet.</div>
                                            )}
                                        </div>
                                    </div>

                                    <footer className="form-actions">
                                        <button
                                            type="button"
                                            className="btn-admin-secondary"
                                            onClick={() => setNewAnnouncement({ title: '', content: '', priority: 'normal', batchIds: [] })}
                                        >
                                            Clear Form
                                        </button>
                                        <button type="submit" className="btn-admin-primary">
                                            Publish Announcement
                                        </button>
                                    </footer>
                                </form>
                            </div>
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
