import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, announcementAPI } from '../../api';
import {
    FiSearch, FiBell, FiLogOut, FiUsers, FiBook,
    FiCalendar, FiMessageSquare, FiPlus, FiEdit2, FiBarChart2
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import '../student/Dashboard.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
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
                    <div className="loading-spinner"></div>
                    <p>Loading dashboard...</p>
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
                        <h1>Admin Dashboard</h1>
                        <div className="tabs">
                            <button
                                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <FiBarChart2 /> Overview
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
                    <div className="stats-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <div className="stat-card stat-card-teal">
                            <span className="stat-label">Total Students</span>
                            <span className="stat-value">{stats.totalStudents || 0}</span>
                        </div>
                        <div className="stat-card stat-card-blue">
                            <span className="stat-label">Total Mentors</span>
                            <span className="stat-value">{stats.totalMentors || 0}</span>
                        </div>
                        <div className="stat-card stat-card-orange">
                            <span className="stat-label">Total Resources</span>
                            <span className="stat-value">{stats.totalResources || 0}</span>
                        </div>
                        <div className="stat-card stat-card-purple">
                            <span className="stat-label">Total Sessions</span>
                            <span className="stat-value">{stats.totalSessions || 0}</span>
                        </div>
                    </div>

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
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 'var(--spacing-md)'
                                }}>
                                    <div style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'rgba(74, 144, 226, 0.1)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <FiUsers style={{ fontSize: 'var(--text-2xl)', color: 'var(--primary-500)', marginBottom: 'var(--spacing-sm)' }} />
                                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>{users.length}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total Users</div>
                                    </div>
                                    <div style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'rgba(69, 196, 191, 0.1)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <FiBook style={{ fontSize: 'var(--text-2xl)', color: 'var(--teal)', marginBottom: 'var(--spacing-sm)' }} />
                                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>{stats.totalResources || 0}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Resources</div>
                                    </div>
                                    <div style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'rgba(255, 155, 80, 0.1)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <FiCalendar style={{ fontSize: 'var(--text-2xl)', color: 'var(--orange)', marginBottom: 'var(--spacing-sm)' }} />
                                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>{stats.totalSessions || 0}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Sessions</div>
                                    </div>
                                    <div style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'rgba(155, 89, 182, 0.1)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center'
                                    }}>
                                        <FiMessageSquare style={{ fontSize: 'var(--text-2xl)', color: 'var(--purple)', marginBottom: 'var(--spacing-sm)' }} />
                                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>{dashboardData?.stats?.totalForumPosts || 0}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Forum Posts</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div
                            className="glass-card"
                            style={{ padding: 'var(--spacing-xl)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <FiUsers style={{ marginRight: 'var(--spacing-sm)' }} /> User Management
                            </h3>
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
        </div>
    );
};

export default AdminDashboard;
