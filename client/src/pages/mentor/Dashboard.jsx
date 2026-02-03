import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, mentorshipAPI, resourceAPI } from '../../api';
import {
    FiSearch, FiBell, FiUser, FiLogOut, FiUsers, FiBook,
    FiCalendar, FiPlus, FiUpload, FiSettings
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import '../student/Dashboard.css';

const MentorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [mentorships, setMentorships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddResource, setShowAddResource] = useState(false);
    const [newResource, setNewResource] = useState({
        title: '',
        description: '',
        category: 'TECHNICAL_SKILLS',
        videoUrl: '',
        duration: 30,
        lessonsCount: 1
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dashboardRes, mentorshipRes] = await Promise.all([
                userAPI.getDashboard(),
                mentorshipAPI.get()
            ]);
            setDashboardData(dashboardRes.data);
            setMentorships(Array.isArray(mentorshipRes.data) ? mentorshipRes.data : []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddResource = async (e) => {
        e.preventDefault();
        try {
            await resourceAPI.create({
                ...newResource,
                thumbnailUrl: `https://img.youtube.com/vi/${extractVideoId(newResource.videoUrl)}/maxresdefault.jpg`
            });
            setShowAddResource(false);
            setNewResource({
                title: '',
                description: '',
                category: 'TECHNICAL_SKILLS',
                videoUrl: '',
                duration: 30,
                lessonsCount: 1
            });
            fetchData();
        } catch (error) {
            console.error('Failed to add resource:', error);
        }
    };

    const extractVideoId = (url) => {
        const match = url.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        return match ? match[1] : 'dQw4w9WgXcQ';
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
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontWeight: '600' }}>Mentor Dashboard</span>
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
                    <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Welcome, {user?.name?.split(' ')[0]}!</h1>

                    {/* Stats */}
                    <div className="stats-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <div className="stat-card stat-card-teal">
                            <span className="stat-label">Your Mentees</span>
                            <span className="stat-value">{dashboardData?.totalMentees || mentorships.length}</span>
                        </div>
                        <div className="stat-card stat-card-blue">
                            <span className="stat-label">Resources Uploaded</span>
                            <span className="stat-value">{dashboardData?.uploadedResources || 0}</span>
                        </div>
                        <div className="stat-card stat-card-orange">
                            <span className="stat-label">Recent Meetings</span>
                            <span className="stat-value">{dashboardData?.recentMeetings?.length || 0}</span>
                        </div>
                    </div>

                    <div className="mentor-grid">
                        {/* Mentees */}
                        <motion.div
                            className="glass-card"
                            style={{ padding: 'var(--spacing-xl)' }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                <h3><FiUsers style={{ marginRight: 'var(--spacing-sm)' }} /> Your Mentees</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                {mentorships.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>No mentees assigned yet.</p>
                                ) : (
                                    mentorships.map((mentorship) => (
                                        <div key={mentorship.id} className="mentee-card">
                                            <img
                                                src={mentorship.mentee?.avatar}
                                                alt={mentorship.mentee?.name}
                                                className="avatar"
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '500' }}>{mentorship.mentee?.name}</div>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                    {mentorship.mentee?.email}
                                                </div>
                                            </div>
                                            <button className="btn btn-secondary btn-sm">View</button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
                                <FiCalendar style={{ marginRight: 'var(--spacing-sm)' }} /> Recent Meetings
                            </h3>

                            <div className="meetings-list">
                                {dashboardData?.recentMeetings?.slice(0, 3).map((meeting) => (
                                    <div key={meeting.id} className="meeting-item">
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '500', fontSize: 'var(--text-sm)' }}>
                                                {meeting.mentorship?.mentee?.name}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                {new Date(meeting.meetingDate).toLocaleDateString()} • {meeting.duration} min
                                            </div>
                                        </div>
                                        <button className="btn btn-ghost btn-sm">View</button>
                                    </div>
                                )) || <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No recent meetings.</p>}
                            </div>
                        </motion.div>

                        {/* Upload Resources */}
                        <motion.div
                            className="glass-card"
                            style={{ padding: 'var(--spacing-xl)' }}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                <h3><FiBook style={{ marginRight: 'var(--spacing-sm)' }} /> Learning Resources</h3>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowAddResource(!showAddResource)}
                                >
                                    <FiPlus /> Add Resource
                                </button>
                            </div>

                            {showAddResource && (
                                <motion.form
                                    onSubmit={handleAddResource}
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
                                            value={newResource.title}
                                            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <label>Description</label>
                                        <textarea
                                            className="input"
                                            rows={3}
                                            value={newResource.description}
                                            onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <label>Category</label>
                                        <select
                                            className="select"
                                            value={newResource.category}
                                            onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                                        >
                                            <option value="TECHNICAL_SKILLS">Technical Skills</option>
                                            <option value="SOFT_SKILLS">Soft Skills</option>
                                            <option value="CAREER_GUIDANCE">Career Guidance</option>
                                        </select>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <label>YouTube Embed URL</label>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://www.youtube.com/embed/..."
                                            value={newResource.videoUrl}
                                            onChange={(e) => setNewResource({ ...newResource, videoUrl: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-row" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <div className="input-group">
                                            <label>Duration (min)</label>
                                            <input
                                                type="number"
                                                className="input"
                                                value={newResource.duration}
                                                onChange={(e) => setNewResource({ ...newResource, duration: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Lessons Count</label>
                                            <input
                                                type="number"
                                                className="input"
                                                value={newResource.lessonsCount}
                                                onChange={(e) => setNewResource({ ...newResource, lessonsCount: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary w-full">
                                        <FiUpload /> Upload Resource
                                    </button>
                                </motion.form>
                            )}

                            <div style={{
                                padding: 'var(--spacing-lg)',
                                background: 'rgba(255, 155, 80, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                marginTop: 'var(--spacing-lg)'
                            }}>
                                <h4 style={{ marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <FiUpload /> CSV Attendance Upload
                                </h4>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                                    Upload offline session attendance via CSV file.
                                </p>
                                <button className="btn btn-secondary w-full" disabled>
                                    Upload CSV (Coming Soon)
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MentorDashboard;
