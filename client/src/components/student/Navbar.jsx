import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FiBell, FiLogOut, FiHome, FiBook,
    FiCalendar, FiMessageSquare, FiMessageCircle, FiUsers, FiFileText, FiMoreVertical, FiFolder
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

const StudentNavbar = () => {
    const { user, logout, socket } = useAuth();
    const navigate = useNavigate();
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.on('notification', () => {
                setUnreadNotifications(prev => prev + 1);
            });
            return () => socket.off('notification');
        }
    }, [socket]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { path: '/student', icon: <FiHome />, label: 'Dashboard' },
        { path: '/student/courses', icon: <FiBook />, label: 'Learning' },


        { path: '/student/assignments', icon: <FiFileText />, label: 'Assignments' },
        { path: '/student/forum', icon: <FiMessageSquare />, label: 'Forum' },
        { path: '/student/messages', icon: <FiMessageCircle />, label: 'Messages' },
        { path: '/student/mentor', icon: <FiUsers />, label: 'Mentorship' },
    ];

    return (
        <nav className="navbar student-navbar">
            <div className="navbar-brand-mentor">
                <img src="/logo.png" alt="Logo" className="navbar-logo" style={{ height: '40px', width: 'auto' }} />
                <span className="mentor-logo-text">Khushboo Pathshala</span>
            </div>

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

                <div className="navbar-right-actions">
                    <button className="icon-btn" style={{ position: 'relative' }}>
                        <FiBell />
                        {unreadNotifications > 0 && <span className="notification-dot"></span>}
                    </button>
                    <div className="user-info-pill" onClick={() => navigate('/settings')}>
                        <img src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky'} alt={user?.name} className="avatar-sm" />
                        <span>{user?.name?.split(' ')[0]}</span>
                    </div>
                    <button className="icon-btn" onClick={handleLogout} title="Logout">
                        <FiLogOut />
                    </button>
                </div>
            </div>

            {/* Mobile Menu - Triggered by branding or persistent tabs if needed, but removing 3 dots icon */}
        </nav>
    );
};

export default StudentNavbar;
