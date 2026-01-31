import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FiHome, FiUpload, FiCalendar, FiCheckSquare, FiLogOut, FiUser
} from 'react-icons/fi';
import '../student/Sidebar.css';

const MentorLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/mentor', icon: FiHome, label: 'Dashboard', end: true },
        { path: '/mentor/upload', icon: FiUpload, label: 'Upload Resource' },
        { path: '/mentor/meetings', icon: FiCalendar, label: 'Meetings' },
        { path: '/mentor/attendance', icon: FiCheckSquare, label: 'Attendance' },
    ];

    return (
        <div className="student-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-container">
                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="40" height="40" rx="10" fill="url(#gradient)" />
                            <path d="M10 28V12L20 8L30 12V28L20 32L10 28Z" fill="white" opacity="0.9" />
                            <path d="M15 18L20 16L25 18V24L20 26L15 24V18Z" fill="#4A90E2" />
                            <defs>
                                <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#10B981" />
                                    <stop offset="1" stopColor="#059669" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="logo-text">Mentor</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon className="nav-icon" />
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <img
                            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=mentor'}
                            alt={user?.name}
                            className="user-avatar"
                        />
                        <div className="user-details">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">Mentor</span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <FiLogOut />
                    </button>
                </div>
            </aside>
            <main className="student-main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default MentorLayout;
