import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import {
    FiBell,
    FiBookOpen,
    FiCheckCircle,
    FiChevronDown,
    FiFileText,
    FiLogOut,
    FiMessageCircle,
    FiMoon,
    FiSearch,
    FiSettings,
    FiSun,
    FiTrash2,
    FiUser,
    FiVideo,
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

    const getNotificationIcon = (title = '', type = '') => {
        const t = title.toLowerCase();
        if (t.includes('resource') || type === 'RESOURCE') return <FiBookOpen style={{ color: '#3b82f6' }} />;
        if (t.includes('session') || t.includes('video') || type === 'SESSION') return <FiVideo style={{ color: '#10b981' }} />;
        if (t.includes('assignment') || type === 'ASSIGNMENT') return <FiFileText style={{ color: '#f59e0b' }} />;
        if (t.includes('meeting') || t.includes('schedule') || type === 'MEETING') return <FiCalendar style={{ color: '#8b5cf6' }} />;
        if (t.includes('quiz') || type === 'QUIZ') return <FiCheckCircle style={{ color: '#ec4899' }} />;
        return <FiBell style={{ color: 'var(--text-muted)' }} />;
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
                                style={{
                                    position: 'absolute',
                                    top: '70px',
                                    right: '0',
                                    zIndex: 9999,
                                    width: '360px',
                                    background: 'var(--color-surface)',
                                    boxShadow: 'var(--shadow-xl)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-lg)',
                                    overflow: 'hidden'
                                }}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                            >
                                <div className="kp-dropdown-header" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--color-border)',
                                    background: 'var(--color-surface-soft)'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Notifications</h4>
                                    <button
                                        className="btn-ghost"
                                        onClick={loadNotifications}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--color-primary)',
                                            fontSize: '0.85rem',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Refresh
                                    </button>
                                </div>
                                <div className="kp-notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {notifications.length > 0 ? (
                                        notifications.map((note) => (
                                            <div
                                                key={note.id}
                                                className={`kp-notification-item ${!note.read ? 'is-unread' : ''}`}
                                                style={{
                                                    padding: '16px 20px',
                                                    borderBottom: '1px solid var(--color-border)',
                                                    display: 'flex',
                                                    gap: '16px',
                                                    transition: 'all 0.2s',
                                                    background: !note.read ? 'var(--color-primary-soft)' : 'transparent',
                                                    cursor: 'pointer',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div className="kp-notification-icon-wrapper" style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: 'var(--color-surface)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.2rem',
                                                    flexShrink: 0,
                                                    boxShadow: 'var(--shadow-sm)',
                                                    border: '1px solid var(--color-border)'
                                                }}>
                                                    {getNotificationIcon(note.title, note.type)}
                                                </div>
                                                <div className="kp-notification-body" style={{ flex: 1, minWidth: 0, paddingRight: '24px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                        <h5 style={{
                                                            margin: 0,
                                                            fontSize: '0.9rem',
                                                            color: 'var(--text-primary)',
                                                            fontWeight: !note.read ? '700' : '600',
                                                            lineHeight: '1.3',
                                                            wordBreak: 'break-word'
                                                        }}>
                                                            {note.title}
                                                        </h5>
                                                        {!note.read && (
                                                            <span style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                background: 'var(--color-primary)',
                                                                flexShrink: 0,
                                                                marginTop: '4px'
                                                            }} />
                                                        )}
                                                    </div>
                                                    <p style={{
                                                        margin: '4px 0 8px',
                                                        fontSize: '0.825rem',
                                                        color: 'var(--text-secondary)',
                                                        lineHeight: '1.5',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: '2',
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {note.message}
                                                    </p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                                            {formatTime(note.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(event) => handleDeleteNotification(event, note.id)}
                                                    className="kp-notification-delete-btn"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '12px',
                                                        right: '12px',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-muted)',
                                                        padding: '6px',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s',
                                                        opacity: 0,
                                                        zIndex: 2
                                                    }}
                                                    aria-label="Delete notification"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <FiBell size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                            <p style={{ fontSize: '0.9rem' }}>All caught up. No notifications right now.</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-soft)' }}>
                                    <button
                                        className="btn-mark-all"
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            background: 'transparent',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={async () => {
                                            try {
                                                await api.put('/notifications/read');
                                                setUnreadNotifications(0);
                                                loadNotifications();
                                            } catch (err) { }
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.borderColor = 'var(--color-primary-soft)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                                    >
                                        Mark all as read
                                    </button>
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
