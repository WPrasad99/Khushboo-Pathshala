import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import {
    FiBell,
    FiChevronDown,
    FiLogOut,
    FiMessageCircle,
    FiMoon,
    FiSearch,
    FiSettings,
    FiSun,
    FiTrash2,
    FiUser,
    FiX
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import './Navbar.css';

const routeTitleMap = {
    '/mentor': 'Overview',
    '/mentor/batches': 'Batches',
    '/mentor/sessions': 'Sessions',
    '/mentor/mentorship': 'Mentorship',
    '/mentor/forum': 'Forum',
    '/mentor/messages': 'Messages',
    '/mentor/assignments': 'Assignments',
    '/mentor/settings': 'Profile',
    '/settings': 'Profile'
};

const MentorNavbar = ({ onOpenMobileNav, onToggleSidebar }) => {
    const { user, logout, socket } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = useState('');
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [theme, setTheme] = useState('light');
    const [liveNotification, setLiveNotification] = useState(null);

    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        setTheme('light');
        document.documentElement.setAttribute('data-theme', 'light');
    }, []);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await api.get('/notifications/unread-count');
                setUnreadNotifications(res.data.count || 0);
            } catch (error) {
                console.error('Failed to fetch unread count', error);
            }
        };

        fetchUnread();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (data) => {
            setUnreadNotifications((value) => value + 1);
            if (data) {
                const title = data.title || data.name || 'New Notification';
                const message = data.message || data.content || data.description || 'You have a new update in your dashboard.';
                setLiveNotification({
                    id: Date.now(),
                    title,
                    message,
                    createdAt: new Date()
                });
                setTimeout(() => setLiveNotification(null), 5000);
            }
        };

        const handleMessage = (data) => {
            setUnreadMessages((value) => value + 1);
            if (data && data.sender) {
                setLiveNotification({
                    id: Date.now(),
                    title: `New message from ${data.sender?.name || 'User'}`,
                    message: data.content || 'You received a new message.',
                    createdAt: new Date()
                });
                setTimeout(() => setLiveNotification(null), 5000);
            }
        };

        socket.on('notification', handleNotification);
        socket.on('new_announcement', handleNotification);
        socket.on('new_message_notification', handleMessage);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('new_announcement', handleNotification);
            socket.off('new_message_notification', handleMessage);
        };
    }, [socket]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }

            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const pageTitle = routeTitleMap[location.pathname] || 'Overview';

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const loadNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data || []);
            await api.put('/notifications/read');
            setUnreadNotifications(0);
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    };

    const handleToggleNotifications = async () => {
        if (!showNotifications) {
            await loadNotifications();
        }

        setShowNotifications((state) => !state);
    };

    const handleDeleteNotification = async (event, id) => {
        event.stopPropagation();

        try {
            await api.delete(`/notifications/${id}`);
            setNotifications((current) => current.filter((item) => item.id !== id));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = Date.now();
        const minutesDiff = Math.floor((now - date.getTime()) / (1000 * 60));

        if (minutesDiff < 1) return 'Just now';
        if (minutesDiff < 60) return `${minutesDiff}m ago`;

        const hoursDiff = Math.floor(minutesDiff / 60);
        if (hoursDiff < 24) return `${hoursDiff}h ago`;

        return `${Math.floor(hoursDiff / 24)}d ago`;
    };

    return (
        <header className="kp-topbar">
            <div className="kp-topbar-left">
                <div className="kp-global-search-wrapper">
                    <div className="kp-global-search">
                        <FiSearch className="kp-search-icon" />
                        <input
                            type="text"
                            placeholder="Search students, batches, sessions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {liveNotification && (
                    <motion.div
                        className="kp-notification-live-popup"
                        style={{ position: 'fixed', top: '70px', right: '20px', zIndex: 9999, width: '320px', background: 'var(--color-surface)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-lg)' }}>
                            <div style={{ flex: 1 }}>
                                <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>{liveNotification.title}</h5>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{liveNotification.message}</p>
                                <span style={{ display: 'block', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Just now</span>
                            </div>
                            <button type="button" onClick={() => setLiveNotification(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                                <FiX size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="kp-topbar-actions">
                <button
                    type="button"
                    className="icon-btn theme-toggle"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <FiMoon /> : <FiSun />}
                </button>

                <button
                    type="button"
                    className="icon-btn"
                    onClick={() => navigate('/mentor/messages')}
                    aria-label="Messages"
                    title="Messages"
                >
                    <FiMessageCircle />
                    {unreadMessages > 0 && <span className="kp-dot">{unreadMessages > 9 ? '9+' : unreadMessages}</span>}
                </button>

                <div className="kp-notification-wrap" ref={notifRef}>
                    <button
                        type="button"
                        className="icon-btn"
                        onClick={handleToggleNotifications}
                        aria-label="Notifications"
                        title="Notifications"
                        aria-expanded={showNotifications}
                    >
                        <FiBell />
                        {unreadNotifications > 0 && <span className="kp-dot">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                className="kp-dropdown-menu kp-notification-menu"
                                style={{ position: 'absolute', top: '70px', right: '0', zIndex: 9999, width: '320px', background: 'var(--color-surface)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                            >
                                <div className="kp-dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                                    <h4 style={{ margin: 0 }}>Notifications</h4>
                                    <button className="btn-ghost btn-sm" onClick={loadNotifications} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}>Refresh</button>
                                </div>
                                <div className="kp-notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {notifications.length > 0 ? (
                                        notifications.map((note) => (
                                            <div key={note.id} className={`kp-notification-item ${!note.read ? 'is-unread' : ''}`} style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '12px' }}>
                                                <div className="kp-notification-body" style={{ flex: 1 }}>
                                                    <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{note.title}</h5>
                                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{note.message}</p>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(note.createdAt)}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(event) => handleDeleteNotification(event, note.id)}
                                                    className="kp-notification-delete"
                                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                                                    aria-label="Delete notification"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <p>All caught up. No notifications right now.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="kp-dropdown-anchor" ref={profileRef}>
                    <button
                        type="button"
                        className="kp-profile-chip"
                        onClick={() => setShowProfileMenu((state) => !state)}
                        aria-label="Open profile menu"
                    >
                        <img
                            src={user?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=mentor'}
                            alt={user?.name || 'User'}
                        />
                        <span>{user?.name?.split(' ')[0] || 'Mentor'}</span>
                        <FiChevronDown />
                    </button>

                    <AnimatePresence>
                        {showProfileMenu && (
                            <motion.div
                                className="kp-dropdown-menu kp-profile-menu"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                            >
                                <button type="button" onClick={() => navigate('/mentor/settings')}>
                                    <FiUser />
                                    Profile
                                </button>
                                <button type="button" onClick={handleLogout} className="is-danger">
                                    <FiLogOut />
                                    Logout
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default MentorNavbar;
