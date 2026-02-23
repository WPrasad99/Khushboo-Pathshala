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
    FiMessageCircle,
    FiLayers,
    FiPlus,
    FiBarChart2
} from 'react-icons/fi';
import Navbar from '../mentor/Navbar';
import ChatBot from '../ChatBot';

const navigationGroups = [
    {
        label: 'Core',
        items: [
            { to: '/mentor', icon: FiBarChart2, label: 'Overview', end: true },
            { to: '/mentor/batches', icon: FiLayers, label: 'My Batches' },
            { to: '/mentor/sessions', icon: FiPlus, label: 'Upload Session' }
        ]
    },
    {
        label: 'Academic',
        items: [
            { to: '/mentor/mentorship', icon: FiUsers, label: 'Mentorship' },
            { to: '/mentor/forum', icon: FiMessageSquare, label: 'Discussion Forum' },
            { to: '/mentor/assignments', icon: FiFileText, label: 'Assignments' }
        ]
    },
    {
        label: 'Communication',
        items: [
            { to: '/mentor/messages', icon: FiMessageCircle, label: 'Messages' }
        ]
    },
    {
        label: 'Account',
        items: [
            { to: '/mentor/settings', icon: FiSettings, label: 'Profile' }
        ]
    }
];

const MentorLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isMessagesPage = location.pathname.includes('/messages');

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
            return 'Review pending assignments to provide timely feedback.';
        }

        if (location.pathname.includes('/batches')) {
            return 'Track batch progress and student engagement.';
        }

        return 'Your mentor dashboard is ready for impact.';
    }, [location.pathname]);

    return (
        <div className={`kp-shell ${isCollapsed ? 'is-collapsed' : ''}`}>
            <aside className={`kp-sidebar ${isMobileNavOpen ? 'is-open' : ''}`}>
                <div className="kp-sidebar-header">
                    <button className="kp-sidebar-brand" onClick={() => navigate('/mentor')}>
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

export default MentorLayout;
