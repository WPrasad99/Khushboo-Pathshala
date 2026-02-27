import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    FiBook,
    FiChevronLeft,
    FiFileText,
    FiHome,
    FiMessageSquare,
    FiSettings,
    FiUsers,
    FiMessageCircle
} from 'react-icons/fi';
import Navbar from '../student/Navbar';
import ChatBot from '../ChatBot';

const navigationGroups = [
    {
        label: 'Core',
        items: [
            { to: '/student', icon: FiHome, label: 'Overview', end: true },
            { to: '/student/courses', icon: FiBook, label: 'Learning' },
            { to: '/student/assignments', icon: FiFileText, label: 'Assignments' }
        ]
    },
    {
        label: 'Community',
        items: [
            { to: '/student/mentor', icon: FiUsers, label: 'Mentorship' },
            { to: '/student/forum', icon: FiMessageSquare, label: 'Forum' },
            { to: '/student/messages', icon: FiMessageCircle, label: 'Messages' }
        ]
    },
    {
        label: 'Account',
        items: [
            { to: '/student/settings', icon: FiSettings, label: 'Profile' }
        ]
    }
];

const StudentLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isMessagesPage = location.pathname.includes('/messages') || location.pathname.includes('/chat/');

    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('kp-sidebar-collapsed') === 'true');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('kp-sidebar-collapsed', String(isCollapsed));
    }, [isCollapsed]);

    useEffect(() => {
        setIsMobileNavOpen(false);
    }, [location.pathname]);

    const sidebarFooterText = useMemo(() => {
        if (location.pathname.includes('/assignments')) {
            return 'Submit pending work before the deadline to protect your streak.';
        }

        if (location.pathname.includes('/courses')) {
            return 'Consistency beats intensity. Complete one lesson today.';
        }

        return 'Your dashboard is optimized for focused daily progress.';
    }, [location.pathname]);

    return (
        <div className={`kp-shell ${isCollapsed ? 'is-collapsed' : ''}`}>
            <aside className={`kp-sidebar ${isMobileNavOpen ? 'is-open' : ''}`}>
                <div className="kp-sidebar-header">
                    <button className="kp-sidebar-brand" onClick={() => navigate('/student')}>
                        <img src="/logo.png" alt="Khushboo Pathshala" />
                        <span>Khushboo Pathshala</span>
                    </button>
                </div>

                <div className="kp-sidebar-nav">
                    {navigationGroups.map((group) => (
                        <section key={group.label} className="kp-nav-group">
                            <h5>{group.label}</h5>
                            <div className="kp-nav-list">
                                {group.items.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            end={item.end}
                                            className={({ isActive }) => `kp-nav-link ${isActive ? 'is-active' : ''}`}
                                            data-tooltip={item.label}
                                        >
                                            <Icon className="kp-nav-icon" />
                                            <span className="kp-nav-label">{item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="kp-sidebar-footer">
                    <p>{sidebarFooterText}</p>
                </div>
            </aside>

            <div className="kp-shell-column">
                <Navbar
                    onOpenMobileNav={() => setIsMobileNavOpen(true)}
                    onToggleSidebar={() => setIsCollapsed((state) => !state)}
                />

                <main className={`kp-shell-content ${isMessagesPage ? 'is-messaging' : ''}`}>
                    <Outlet />
                </main>
            </div>

            <button
                type="button"
                className={`kp-mobile-backdrop ${isMobileNavOpen ? 'is-visible' : ''}`}
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close mobile sidebar"
            />

            {!isMessagesPage && <ChatBot />}
        </div>
    );
};

export default StudentLayout;
