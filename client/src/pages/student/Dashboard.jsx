import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiActivity,
    FiArrowRight,
    FiAward,
    FiBookOpen,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiBell,
    FiFileText,
    FiTrendingUp
} from 'react-icons/fi';
import { userAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

import ActivityHeatmap from './ActivityHeatmap';
import StudentAssignmentSection from '../../components/StudentAssignmentSection';
import StudentResourcesSection from '../../components/StudentResourcesSection';
import './Dashboard.css';

const CARD_VARIANTS = {
    initial: { opacity: 0, y: 16 },
    animate: (index) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, delay: index * 0.06 }
    })
};

const DashboardSkeleton = () => (
    <div className="student-dashboard-shell">
        <div className="student-dashboard-header skeleton" style={{ height: 110 }} />

        <div className="student-stats-grid">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="student-stat-card skeleton" style={{ height: 156 }} />
            ))}
        </div>

        <div className="student-overview-grid">
            <div className="student-panel skeleton" style={{ minHeight: 280 }} />
            <div className="student-panel skeleton" style={{ minHeight: 280 }} />
        </div>

        <div className="student-panel skeleton" style={{ minHeight: 230 }} />
    </div>
);

// Simple CountUp Component for Animated Metrics
const CountUp = ({ value, duration = 1500 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeProgress * value));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setCount(value);
            }
        };
        window.requestAnimationFrame(step);
    }, [value, duration]);

    return <span>{count}</span>;
};

const StudentDashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginDates, setLoginDates] = useState([]);

    // Safely destructure dashboardData with defaults
    const {
        stats = {},
        upcomingSessions = [],
        announcements = []
    } = dashboardData || {};

    const isAssignmentsView = location.pathname.includes('/assignments') || location.pathname.includes('/quizzes');
    const isResourcesView = location.pathname.includes('/resources');
    const isOverview = !isAssignmentsView && !isResourcesView;

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const response = await userAPI.getStudentDashboard();
                setDashboardData(response.data);
                setLoginDates(response.data.loginDates || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const activeDaysIn30 = useMemo(() => {
        const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return loginDates.filter((day) => new Date(day).getTime() >= threshold).length;
    }, [loginDates]);

    const badgesEarned = useMemo(() => {
        if (typeof stats?.badgesCount === 'number') return stats.badgesCount;
        return Math.max(0, Math.floor((stats?.completedCourses || 0) * 1.5));
    }, [stats?.badgesCount, stats?.completedCourses]);

    const metricCards = useMemo(
        () => [
            {
                key: 'attendance',
                label: 'Attendance %',
                value: `${stats?.attendancePercentage || 0}%`,
                trend: `${(stats?.attendancePercentage || 0) >= 80 ? '+' : ''}${Math.max(1, Math.round((stats?.attendancePercentage || 0) / 20))}% this week`,
                icon: FiCheckCircle,
                tone: 'success'
            },
            {
                key: 'courses',
                label: 'Completed Courses',
                value: stats?.completedCourses || 0,
                trend: `+${Math.max(1, Math.min(9, stats?.completedCourses || 1))}% this month`,
                icon: FiBookOpen,
                tone: 'primary'
            },
            {
                key: 'active-days',
                label: 'Active Days (30d)',
                value: activeDaysIn30,
                trend: `${activeDaysIn30 >= 12 ? '+5 day consistency' : 'Build your streak'}`,
                icon: FiActivity,
                tone: 'accent'
            },
            {
                key: 'badges',
                label: 'Badges Earned',
                value: badgesEarned,
                trend: badgesEarned > 0 ? `+${Math.min(3, badgesEarned)} this month` : 'Unlock your first badge',
                icon: FiAward,
                tone: 'warning'
            }
        ],
        [activeDaysIn30, badgesEarned, stats?.attendancePercentage, stats?.completedCourses]
    );

    if (loading && isOverview) {
        return <DashboardSkeleton />;
    }

    if (isAssignmentsView) {
        return (
            <div className="student-dashboard-shell">
                <div className="student-subpage-content">
                    <StudentAssignmentSection />
                </div>
            </div>
        );
    }

    if (isResourcesView) {
        return (
            <div className="student-dashboard-shell">
                <section className="student-subpage-header card-hero">
                    <div>
                        <h1>Learning Resources</h1>
                        <p>Curated notes, materials, and downloadable assets for your batch.</p>
                    </div>
                </section>
                <div className="student-subpage-content">
                    <StudentResourcesSection />
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-content">
            {isOverview && (
                <section className="student-hero-section">
                    <div className="hero-text">
                        <h1>Hello, {user?.name?.split(' ')[0]} 👋</h1>
                        <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="hero-actions">
                        <button type="button" className="btn-student-outline" onClick={() => navigate('/student/courses')}>
                            <FiBookOpen /> Explore Courses
                        </button>
                        <button type="button" className="btn-student-primary" onClick={() => navigate('/student/assignments')}>
                            <FiFileText /> My Assignments
                        </button>
                    </div>
                </section>
            )}

            {/* Quick Metrics Grid */}
            <section className="stats-grid">
                {metricCards.map((card, index) => {
                    const Icon = card.icon;
                    const toneMap = { success: 'teal', primary: 'blue', accent: 'purple', warning: 'orange' };
                    const themeTone = toneMap[card.tone] || 'blue';
                    return (
                        <motion.article
                            key={card.key}
                            className={`stat-card stat-${themeTone}`}
                            custom={index}
                            variants={CARD_VARIANTS}
                            initial="initial"
                            animate="animate"
                        >
                            <div className="stat-header">
                                <span className="stat-label">{card.label}</span>
                                <div className="icon-circle">
                                    <Icon />
                                </div>
                            </div>
                            <div className="stat-value">
                                {typeof card.value === 'number' ? <CountUp value={card.value} /> : card.value}
                            </div>
                        </motion.article>
                    );
                })}
            </section>

            {/* Main Content Grid: Sessions & Announcements */}
            <div className="dashboard-sections">
                {/* Left: Upcoming Sessions (70%) */}
                <section className="dashboard-panel">
                    <header className="panel-header">
                        <h2><FiCalendar /> Upcoming Sessions</h2>
                        <span className="count-badge">{upcomingSessions.length}</span>
                    </header>

                    <div className="sessions-list">
                        {upcomingSessions.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <FiCalendar className="empty-icon" />
                                <span className="empty-text">No sessions scheduled this week.</span>
                            </div>
                        ) : (
                            upcomingSessions.map((session, i) => (
                                <motion.div
                                    key={session.id || i}
                                    className="session-card"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="session-date-box">
                                        <span className="date-day">{new Date(session.scheduledAt).getDate()}</span>
                                        <span className="date-month">{new Date(session.scheduledAt).toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                    <div className="session-info">
                                        <div className="session-title">{session.title}</div>
                                        <div className="session-meta">
                                            <span><FiClock /> {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="status-badge upcoming">{session.type === 'MEETING' ? 'Mentorship' : 'Batch Session'}</span>
                                        </div>
                                    </div>
                                    <button className="btn-student-outline">Join</button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </section>

                {/* Right: Announcements (30%) */}
                <section className="dashboard-panel">
                    <header className="panel-header">
                        <div>
                            <h2><FiBell /> Announcements</h2>
                            <p>Latest from your mentors.</p>
                        </div>
                        <span className="count-badge">{announcements.length}</span>
                    </header>

                    <div className="announcements-list">
                        {announcements.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <FiBell className="empty-icon" />
                                <span className="empty-text">No announcements yet.</span>
                            </div>
                        ) : (
                            announcements.slice(0, 4).map((announcement, i) => (
                                <motion.div
                                    key={announcement.id || i}
                                    className="session-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="icon-circle" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--student-primary)' }}>
                                        <FiBell />
                                    </div>
                                    <div className="session-info">
                                        <div className="session-title">{announcement.title}</div>
                                        <div className="session-meta">
                                            <span className="status-badge upcoming">New</span>
                                            <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Bottom: Activity Heatmap */}
            <motion.section
                className="dashboard-panel heatmap-panel"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <header className="panel-header">
                    <div>
                        <h2><FiTrendingUp /> Learning Consistency</h2>
                        <p>Your activity intensity over the past year.</p>
                    </div>
                    <button type="button" className="btn-student-outline" onClick={() => navigate('/student/courses')}>
                        View Learning History <FiArrowRight />
                    </button>
                </header>
                <div className="heatmap-container" style={{ marginTop: '20px' }}>
                    <ActivityHeatmap loginDates={loginDates} />
                </div>
            </motion.section>
        </div>
    );
};

export default StudentDashboard;
