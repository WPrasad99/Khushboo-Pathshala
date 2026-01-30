import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiBook, FiUsers, FiMessageSquare, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { logout } = useAuth();

    return (
        <aside className="student-sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="Cybage Khushboo" className="sidebar-logo-img" />
                    <div className="brand-text">
                        <span className="brand-name">Khushboo</span>
                        <span className="brand-tagline">Pathshala</span>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <span className="nav-label">Main</span>
                    <NavLink to="/student" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiHome />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/student/courses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiBook />
                        <span>Courses</span>
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
