import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import {
    FiBell,
    FiChevronDown,
    FiLogOut,
    FiMenu,
    FiMessageCircle,
    FiMoon,
    FiSearch,
    FiSettings,
    FiSun,
    FiTrash2,
    FiUser
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

        const handleNotification = () => setUnreadNotifications((value) => value + 1);
        const handleMessage = () => setUnreadMessages((value) => value + 1);

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
                <button
                    className="mobile-toggle icon-btn"
                    onClick={onOpenMobileNav}
                    aria-label="Toggle navigation"
                >
                    <FiMenu />
                </button>
                <div className="kp-page-title">
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--admin-text-primary)' }}>
                        {pageTitle}
                    </h1>
                </div>
            </div>

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
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                            >
                                <div className="kp-dropdown-header">
                                    <h4>Notifications</h4>
                                    <button type="button" onClick={loadNotifications}>Refresh</button>
                                </div>

                                <div className="kp-notification-list">
                                    {notifications.length > 0 ? (
                                        notifications.map((note) => (
                                            <div key={note.id} className={`kp-notification-item ${!note.read ? 'is-unread' : ''}`}>
                                                <div className="kp-notification-body">
                                                    <h5>{note.title}</h5>
                                                    <p>{note.message}</p>
                                                    <span>{formatTime(note.createdAt)}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(event) => handleDeleteNotification(event, note.id)}
                                                    className="kp-notification-delete"
                                                    aria-label="Delete notification"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="kp-empty-dropdown">
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
