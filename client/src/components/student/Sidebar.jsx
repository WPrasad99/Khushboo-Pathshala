import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiBook, FiClock, FiUsers, FiMessageSquare, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { logout } = useAuth();

    return (
        <aside className="student-sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo">
                    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="8" fill="url(#grad_sidebar)" />
                        <path d="M10 28V12L20 8L30 12V28L20 32L10 28Z" fill="white" opacity="0.9" />
                        <defs>
                            <linearGradient id="grad_sidebar" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#4F46E5" />
                                <stop offset="1" stopColor="#3730A3" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span>Pathshala</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <span className="nav-label">Main</span>
                    <NavLink to="/student" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiHome />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/student/resources" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiBook />
                        <span>Learning Resources</span>
                    </NavLink>
                    <NavLink to="/student/sessions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiClock />
                        <span>Session Tracking</span>
                    </NavLink>
                </div>

                <div className="nav-section">
                    <span className="nav-label">Community</span>
                    <NavLink to="/student/mentor" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiUsers />
                        <span>Mentor Program</span>
                    </NavLink>
                    <NavLink to="/student/forum" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiMessageSquare />
                        <span>Q&A Forum</span>
                    </NavLink>
                </div>
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item logout-btn" onClick={logout}>
                    <FiLogOut />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
