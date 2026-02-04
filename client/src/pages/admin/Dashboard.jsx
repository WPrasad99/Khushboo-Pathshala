import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, announcementAPI, batchAPI } from '../../api';
import {
    FiSearch, FiBell, FiLogOut, FiUsers, FiBook,
    FiCalendar, FiMessageSquare, FiPlus, FiEdit2, FiBarChart2, FiLayers, FiSettings, FiMoreVertical, FiTrash2
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingAnimation from '../../components/LoadingAnimation';
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

    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: '',
        priority: 'normal'
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
            setNewAnnouncement({ title: '', content: '', priority: 'normal' });
            fetchData();
        } catch (error) {
            console.error('Failed to create announcement:', error);
        }
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

    const stats = dashboardData?.stats || {};

    return (
        <div className="dashboard-page">
            {/* Navbar Refined to match Mentor/Student */}
            <nav className="navbar admin-navbar">
                <div className="navbar-brand-mentor" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
                    <img src="/logo.png" alt="Logo" className="navbar-logo" style={{ height: '40px', width: 'auto' }} />
                    <span className="mentor-logo-text">Khushboo Pathshala</span>
                </div>

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
                        <button className="icon-btn menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <FiMoreVertical />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            className="mobile-nav-menu"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <button
                                className={`mobile-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('overview'); setIsMenuOpen(false); }}
                            >
                                <FiBarChart2 /> Overview
                            </button>
                            <button
                                className={`mobile-nav-item ${activeTab === 'batches' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('batches'); setIsMenuOpen(false); }}
                            >
                                <FiLayers /> Batches
                            </button>
                            <button
                                className={`mobile-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('users'); setIsMenuOpen(false); }}
                            >
                                <FiUsers /> Users
                            </button>
                            <button
                                className={`mobile-nav-item ${activeTab === 'announcements' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('announcements'); setIsMenuOpen(false); }}
                            >
                                <FiBell /> Announcements
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                            <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>Real-time Update</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>New activity detected on the platform.</div>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', padding: '20px 0' }}>
                                        No new notifications
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Main Content */}
            <div className="dashboard-content">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Stats & Welcome moved inside Overview */}
                    {activeTab === 'overview' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h1 style={{ marginBottom: '4px', fontSize: '2rem', fontWeight: 800 }}>Welcome Back, {user?.name?.split(' ')[0]} 👋</h1>
                                    <p style={{ color: '#64748b', margin: 0 }}>Here's what's happening in your academy today.</p>
                                </div>
                            </div>

                            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                                <div className="stat-card stat-card-teal">
                                    <div className="stat-icon">
                                        <FiUsers />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-label">Total Students</span>
                                        <span className="stat-value">{stats.totalStudents || 0}</span>
                                    </div>
                                </div>
                                <div className="stat-card stat-card-blue">
                                    <div className="stat-icon">
                                        <FiBook />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-label">Total Mentors</span>
                                        <span className="stat-value">{stats.totalMentors || 0}</span>
                                    </div>
                                </div>
                                <div className="stat-card stat-card-orange">
                                    <div className="stat-icon">
                                        <FiBook />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-label">Total Resources</span>
                                        <span className="stat-value">{stats.totalResources || 0}</span>
                                    </div>
                                </div>
                                <div className="stat-card stat-card-purple">
                                    <div className="stat-icon">
                                        <FiCalendar />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-label">Total Sessions</span>
                                        <span className="stat-value">{stats.totalSessions || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Grid: Recent Activity & Active Batches */}
                            <div className="mentor-grid">
                                {/* Recent Activity */}
                                <motion.div
                                    className="glass-card"
                                    style={{ padding: '16px 20px' }}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <h3 style={{ marginBottom: '16px' }}>
                                        <FiCalendar style={{ marginRight: '8px' }} /> Recent Session Trackings
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {dashboardData?.recentTrackings?.slice(0, 5).map((tracking, index) => (
                                            <div key={index} className="mentee-card" style={{ padding: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>
                                                        {tracking.user?.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                                                        Watched: {tracking.resource?.title}
                                                    </div>
                                                </div>
                                                <span className={`badge ${tracking.attendanceMarked ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                                                    {tracking.attendanceMarked ? 'Completed' : 'In Progress'}
                                                </span>
                                            </div>
                                        )) || <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No recent activity.</p>}
                                    </div>
                                </motion.div>

                                {/* Active Batches (No Card Wrapper) */}
                                <motion.div
                                    style={{ padding: '0px 4px' }}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                                        <FiBook style={{ marginRight: '8px' }} /> Active Batches
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {dashboardData?.recentBatches && dashboardData.recentBatches.length > 0 ? (
                                            dashboardData.recentBatches.slice(0, 6).map((batch) => (
                                                <div key={batch.id} className="mentee-card" style={{ padding: '14px 16px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1e293b' }}>{batch.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                                                            {(batch._count?.students ?? batch.students?.length ?? 0)} Students
                                                        </div>
                                                    </div>
                                                    <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Active</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '40px 0', textAlign: 'center', background: 'rgba(255,255,255,0.3)', borderRadius: '16px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                                                <p style={{ color: '#64748b' }}>No active batches found.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Full Width Section: Latest Announcements */}
                            <motion.div
                                className="glass-card"
                                style={{
                                    padding: '16px 20px',
                                    marginTop: '24px',
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                                    <FiBell style={{ marginRight: '8px' }} /> Latest Announcements
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                    gap: '16px'
                                }}>
                                    {announcements && announcements.slice(0, 4).map((ann) => (
                                        <div key={ann.id} className="mentee-card" style={{
                                            padding: '16px',
                                            background: 'white',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontWeight: '600',
                                                    fontSize: '0.95rem',
                                                    color: '#1e293b',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }} title={ann.title}>
                                                    {ann.title}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.85rem',
                                                    color: '#64748b',
                                                    marginTop: '6px',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {ann.content}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '12px' }}>
                                                    {new Date(ann.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!announcements || announcements.length === 0) && (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0' }}>
                                            <p style={{ color: '#64748b' }}>No announcements yet.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
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
                                                        <span style={{ fontWeight: '500' }}>{u.name}</span>
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
                                    <div className="input-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
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
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button type="submit" className="btn btn-primary">
                                            Publish Announcement
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            onClick={() => setNewAnnouncement({ title: '', content: '', priority: 'normal' })}
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
            {showCreateUserModal && (
                <CreateUserModal
                    onClose={() => setShowCreateUserModal(false)}
                    onSuccess={fetchData}
                />
            )}
            {showBulkUserModal && (
                <BulkUserModal
                    onClose={() => setShowBulkUserModal(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
