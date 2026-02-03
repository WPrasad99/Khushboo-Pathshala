import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, announcementAPI } from '../../api';
import {
    FiSearch, FiBell, FiLogOut, FiUsers, FiBook,
    FiCalendar, FiMessageSquare, FiPlus, FiEdit2, FiBarChart2, FiLayers, FiSettings
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import LoadingAnimation from '../../components/LoadingAnimation';
import BatchManagement from '../../components/admin/BatchManagement';
import CreateUserModal from '../../components/admin/CreateUserModal';
import '../student/Dashboard.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: '',
        priority: 'normal'
    });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dashboardRes, usersRes] = await Promise.all([
                adminAPI.getReports(),
                adminAPI.getUsers()
            ]);
            setDashboardData(dashboardRes.data);
            setUsers(usersRes.data);
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
            setShowAddAnnouncement(false);
            setNewAnnouncement({ title: '', content: '', priority: 'normal' });
            // Optionally refresh dashboard data if announcements are tracked there
        } catch (error) {
            console.error('Failed to create announcement:', error);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await adminAPI.updateUserRole(userId, newRole);
            fetchData();
        } catch (error) {
            console.error('Failed to update role:', error);
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
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontWeight: '600' }}>Admin Dashboard</span>
                </div>

                <div className="navbar-actions">
                    <div className="search-box">
                        <FiSearch />
                        <input type="text" placeholder="Search..." />
                    </div>
                    <button className="icon-btn">
                        <FiBell />
                    </button>
                    <div className="user-menu">
                        <img src={user?.avatar} alt={user?.name} className="avatar" />
                        <span style={{ fontWeight: '500' }}>{user?.name}</span>
                        <button className="icon-btn" onClick={() => navigate('/settings')} title="Settings">
                            <FiSettings />
                        </button>
                        <button className="icon-btn" onClick={handleLogout}>
                            <FiLogOut />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="dashboard-content">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h1 style={{ marginBottom: '4px' }}>Welcome Back, {user?.name?.split(' ')[0]} 👋</h1>
                            <p style={{ color: '#64748b', margin: 0 }}>Here's what's happening in your academy today.</p>
                        </div>
                        <div className="tabs">
                            <button
                                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <FiBarChart2 /> Overview
                            </button>
                            <button
                                className={`tab ${activeTab === 'batches' ? 'active' : ''}`}
                                onClick={() => setActiveTab('batches')}
                            >
                                <FiLayers /> Batches
                            </button>
                            <button
                                className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                <FiUsers /> Users
                            </button>
                            <button
                                className={`tab ${activeTab === 'announcements' ? 'active' : ''}`}
                                onClick={() => setActiveTab('announcements')}
                            >
                                <FiBell /> Announcements
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    {activeTab === 'overview' && (
                        <div className="stats-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
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
                    )}

                    {activeTab === 'overview' && (
                        <div className="mentor-grid">
                            {/* Recent Activity */}
                            <motion.div
                                className="glass-card"
                                style={{ padding: 'var(--spacing-xl)' }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <FiCalendar style={{ marginRight: 'var(--spacing-sm)' }} /> Recent Session Trackings
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                    {dashboardData?.recentTrackings?.slice(0, 5).map((tracking, index) => (
                                        <div key={index} className="mentee-card">
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '500', fontSize: 'var(--text-sm)' }}>
                                                    {tracking.user?.name}
                                                </div>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                    Watched: {tracking.resource?.title}
                                                </div>
                                            </div>
                                            <span className={`badge ${tracking.attendanceMarked ? 'badge-success' : 'badge-warning'}`}>
                                                {tracking.attendanceMarked ? 'Completed' : 'In Progress'}
                                            </span>
                                        </div>
                                    )) || <p style={{ color: 'var(--text-muted)' }}>No recent activity.</p>}
                                </div>
                            </motion.div>

                            {/* Quick Stats */}
                            <motion.div
                                className="glass-card"
                                style={{ padding: 'var(--spacing-xl)' }}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <FiBarChart2 style={{ marginRight: 'var(--spacing-sm)' }} /> Platform Overview
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '24px'
                                }}>
                                    <div style={{
                                        padding: '24px',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)', // White to Blush
                                        borderRadius: '16px',
                                        textAlign: 'center',
                                        border: '1px solid rgba(254, 226, 226, 0.6)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                    }}>
                                        <FiUsers style={{ fontSize: '2.5rem', color: '#4f46e5', marginBottom: '12px', display: 'block', margin: '0 auto 12px auto' }} />
                                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>{users.length}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>Total Users</div>
                                    </div>
                                    <div style={{
                                        padding: '24px',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)', // White to Mint-ish (Light)
                                        borderRadius: '16px',
                                        textAlign: 'center',
                                        border: '1px solid rgba(209, 250, 229, 0.6)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                    }}>
                                        <FiBook style={{ fontSize: '2.5rem', color: '#059669', marginBottom: '12px', display: 'block', margin: '0 auto 12px auto' }} />
                                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>{stats.totalResources || 0}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>Resources</div>
                                    </div>
                                    <div style={{
                                        padding: '24px',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)', // White to Orange-ish
                                        borderRadius: '16px',
                                        textAlign: 'center',
                                        border: '1px solid rgba(255, 237, 213, 0.6)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                    }}>
                                        <FiCalendar style={{ fontSize: '2.5rem', color: '#ea580c', marginBottom: '12px', display: 'block', margin: '0 auto 12px auto' }} />
                                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>{stats.totalSessions || 0}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>Sessions</div>
                                    </div>
                                    <div style={{
                                        padding: '24px',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)', // White to Violet tint
                                        borderRadius: '16px',
                                        textAlign: 'center',
                                        border: '1px solid rgba(221, 214, 254, 0.6)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                    }}>
                                        <FiMessageSquare style={{ fontSize: '2.5rem', color: '#7c3aed', marginBottom: '12px', display: 'block', margin: '0 auto 12px auto' }} />
                                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>{dashboardData?.stats?.totalForumPosts || 0}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>Forum Posts</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {activeTab === 'batches' && (
                        <BatchManagement />
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
                                <button
                                    className="btn-glass-primary"
                                    onClick={() => setShowCreateUserModal(true)}
                                >
                                    <FiPlus /> New User
                                </button>
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
                                        {users.map((u) => (
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
                                                <td style={{ padding: 'var(--spacing-md)' }}>
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
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'announcements' && (
                        <motion.div
                            className="glass-card"
                            style={{ padding: 'var(--spacing-xl)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                <h3>
                                    <FiBell style={{ marginRight: 'var(--spacing-sm)' }} /> Announcements
                                </h3>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowAddAnnouncement(!showAddAnnouncement)}
                                >
                                    <FiPlus /> New Announcement
                                </button>
                            </div>

                            {showAddAnnouncement && (
                                <motion.form
                                    onSubmit={handleAddAnnouncement}
                                    style={{
                                        padding: 'var(--spacing-lg)',
                                        background: 'rgba(74, 144, 226, 0.05)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--spacing-lg)'
                                    }}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                >
                                    <div className="input-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <label>Title</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={newAnnouncement.title}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                            required
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
                                    <button type="submit" className="btn btn-primary">
                                        Publish Announcement
                                    </button>
                                </motion.form>
                            )}

                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                                Announcements will be displayed to all users on their dashboards.
                            </p>
                        </motion.div>
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
        </div>
    );
};

export default AdminDashboard;
