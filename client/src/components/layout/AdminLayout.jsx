import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FiHome, FiUsers, FiBell, FiBarChart2, FiLogOut, FiSettings,
    FiPackage, FiUserPlus
} from 'react-icons/fi';
import '../student/Sidebar.css';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/admin', icon: FiHome, label: 'Dashboard', end: true },
        { path: '/admin/batches', icon: FiPackage, label: 'Batches' },
        { path: '/admin/students', icon: FiUserPlus, label: 'Students' },
        { path: '/admin/users', icon: FiUsers, label: 'All Users' },
        { path: '/admin/announcements', icon: FiBell, label: 'Announcements' },
        { path: '/admin/reports', icon: FiBarChart2, label: 'Reports' },
    ];

    return (
        <div className="student-layout">
            <aside className="sidebar admin-sidebar">
                <div className="sidebar-header">
                    <div className="logo-container">
                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="40" height="40" rx="10" fill="url(#gradient-admin)" />
                            <path d="M10 28V12L20 8L30 12V28L20 32L10 28Z" fill="white" opacity="0.9" />
                            <path d="M15 18L20 16L25 18V24L20 26L15 24V18Z" fill="#8B5CF6" />
                            <defs>
                                <linearGradient id="gradient-admin" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#8B5CF6" />
                                    <stop offset="1" stopColor="#6D28D9" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="logo-text">Admin</span>
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
                            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'}
                            alt={user?.name}
                            className="user-avatar"
                        />
                        <div className="user-details">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">Admin</span>
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

export default AdminLayout;
