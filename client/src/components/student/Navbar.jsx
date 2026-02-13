import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import {
    FiBell, FiLogOut, FiHome, FiBook,
    FiCalendar, FiMessageSquare, FiMessageCircle, FiUsers, FiFileText, FiMoreVertical, FiFolder, FiX, FiMenu
} from 'react-icons/fi';

import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

const StudentNavbar = () => {
    const { user, logout, socket } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = React.useRef(null); // Ref for click outside
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Fetch initial unread count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await api.get('/notifications/unread-count');
                setUnreadNotifications(res.data.count);
                // For messages, we might need an endpoint or just start at 0
            } catch (error) {
                console.error('Failed to fetch unread count', error);
            }
        };
        fetchUnreadCount();

        // Click outside handler
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (socket) {
            // Generic notification (e.g. from db creation)
            socket.on('notification', () => {
                setUnreadNotifications(prev => prev + 1);
            });

            // Specific events
            socket.on('new_announcement', () => setUnreadNotifications(prev => prev + 1));
            socket.on('new_assignment', () => setUnreadNotifications(prev => prev + 1));
            socket.on('new_quiz', () => setUnreadNotifications(prev => prev + 1));
            socket.on('new_resource', () => setUnreadNotifications(prev => prev + 1));
            socket.on('new_meeting', () => setUnreadNotifications(prev => prev + 1));

            // Chat messages
            socket.on('new_message_notification', () => {
                setUnreadMessages(prev => prev + 1);
            });

            return () => {
                socket.off('notification');
                socket.off('new_announcement');
                socket.off('new_assignment');
                socket.off('new_quiz');
                socket.off('new_resource');
                socket.off('new_meeting');
                socket.off('new_message_notification');
            };
        }
    }, [socket]);

    const handleToggleNotifications = async () => {
        if (!showNotifications) {
            // Opening: Fetch notifications and mark as read
            try {
                const res = await api.get('/notifications');
                setNotifications(res.data);

                // Mark as read in backend
                await api.put('/notifications/read');
                setUnreadNotifications(0);
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        }
        setShowNotifications(!showNotifications);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleDeleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { path: '/student', icon: <FiHome />, label: 'Dashboard' },
        { path: '/student/courses', icon: <FiBook />, label: 'Learning' },


        { path: '/student/assignments', icon: <FiFileText />, label: 'Assignments' },
        { path: '/student/forum', icon: <FiMessageSquare />, label: 'Forum' },
        {
            path: '/student/messages',
            icon: <div style={{ position: 'relative' }}>
                <FiMessageCircle />
                {unreadMessages > 0 && <span className="notification-dot" style={{ top: '-5px', right: '-5px' }}></span>}
            </div>,
            label: 'Messages'
        },
        { path: '/student/mentor', icon: <FiUsers />, label: 'Mentorship' },
    ];

    return (
        <>
            <nav className="navbar student-navbar">
                <div className="navbar-brand-mentor">
                    <img src="/logo.png" alt="Logo" className="navbar-logo" style={{ height: '40px', width: 'auto' }} />
                    <span className="mentor-logo-text">Khushboo Pathshala</span>
                </div>

                {/* Hamburger Menu for Mobile */}
                <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                <div className="navbar-actions-mentor">
                    <div className="mentor-tabs-container">
                        <div className="mentor-tabs nav-links-desktop">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    end={link.path === '/student'}
                                    className={({ isActive }) => `mentor-tab ${isActive ? 'active' : ''}`}
                                >
                                    {link.icon} {link.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    <div className="navbar-right-actions" ref={dropdownRef}>
                        <button
                            className="icon-btn"
                            style={{ position: 'relative' }}
                            onClick={handleToggleNotifications}
                        >
                            <FiBell />
                            {unreadNotifications > 0 && <span className="notification-dot"></span>}
                        </button>

                        {/* Notification Dropdown */}
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    className="notification-dropdown"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                >
                                    <div className="notification-header">
                                        <h3>Notifications</h3>
                                        <button className="mark-read-btn" onClick={() => setUnreadNotifications(0)}>
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="notification-list">
                                        {notifications.length > 0 ? (
                                            notifications.map((note) => (
                                                <div key={note.id} className={`notification-item ${!note.read ? 'unread' : ''}`}>
                                                    <div className="notification-icon">
                                                        <FiBell size={16} />
                                                    </div>
                                                    <div className="notification-content">
                                                        <div className="notification-title">{note.title}</div>
                                                        <div className="notification-message">{note.message}</div>
                                                        <div className="notification-time">{formatTime(note.createdAt)}</div>
                                                    </div>
                                                    <button
                                                        className="delete-notif-btn"
                                                        onClick={(e) => handleDeleteNotification(e, note.id)}
                                                        title="Delete"
                                                    >
                                                        <FiX size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-notifications">
                                                No notifications
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="user-info-pill" onClick={() => navigate('/settings')}>
                            <img src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky'} alt={user?.name} className="avatar-sm" />
                            <span>{user?.name?.split(' ')[0]}</span>
                        </div>
                        <button className="icon-btn" onClick={handleLogout} title="Logout">
                            <FiLogOut />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu - Rendered OUTSIDE nav using Portal so it's not clipped */}
            {ReactDOM.createPortal(
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className="mobile-menu-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
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
                                    <button onClick={() => setIsMobileMenuOpen(false)}>
                                        <FiX size={24} />
                                    </button>
                                </div>
                                <div className="mobile-menu-links">
                                    {navLinks.map((link) => (
                                        <NavLink
                                            key={link.path}
                                            to={link.path}
                                            end={link.path === '/student'}
                                            className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {link.icon}
                                            <span>{link.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                                <div className="mobile-menu-footer">
                                    <button className="mobile-settings-btn" onClick={() => { navigate('/settings'); setIsMobileMenuOpen(false); }}>
                                        <FiUsers />
                                        <span>Settings</span>
                                    </button>
                                    <button className="mobile-logout-btn" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
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
        </>
    );
};

export default StudentNavbar;
