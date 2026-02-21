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
    FiTrendingUp,
    FiPlayCircle,
    FiBriefcase,
    FiBell,
    FiSun,
    FiMoon
} from 'react-icons/fi';
import { userAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
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

const formatCountdown = (ms) => {
    if (ms <= 0) return 'In progress';

    const minutes = Math.floor(ms / (1000 * 60));
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const mins = minutes % 60;

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
};

const getSessionStatus = (sessionDate) => {
    const now = new Date();
    const date = new Date(sessionDate);

    if (date < now) return 'completed';

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) return 'today';
    return 'upcoming';
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
            // easeOutQuart
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
    const [now, setNow] = useState(Date.now());

    const isAssignmentsView = location.pathname.includes('/assignments') || location.pathname.includes('/quizzes');
    const isResourcesView = location.pathname.includes('/resources');
    const isOverview = !isAssignmentsView && !isResourcesView;

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(timer);
    }, []);

    // Theme Architecture State
    const [theme, setTheme] = useState(localStorage.getItem('admin-theme') || 'light');

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

    // Theme Application Effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('admin-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getStudentDashboard();
            console.log('Dashboard API Response:', response.data);
            console.log('Announcements:', response.data.announcements);
            console.log('Upcoming Sessions:', response.data.upcomingSessions);
            setDashboardData(response.data);
            setFilteredData({
                recentActivities: response.data.recentActivities || [],
                upcomingSessions: response.data.upcomingSessions || [],
                announcements: response.data.announcements || []
            });
            setLoginDates(response.data.loginDates || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const activeDaysIn30 = useMemo(() => {
        const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return loginDates.filter((day) => new Date(day).getTime() >= threshold).length;
    }, [loginDates]);

    const badgesEarned = useMemo(() => {
        if (typeof stats.badgesCount === 'number') return stats.badgesCount;
        return Math.max(0, Math.floor((stats.completedCourses || 0) * 1.5));
    }, [stats.badgesCount, stats.completedCourses]);

    const metricCards = useMemo(
        () => [
            {
                key: 'attendance',
                label: 'Attendance %',
                value: `${stats.attendancePercentage || 0}%`,
                trend: `${stats.attendancePercentage >= 80 ? '+' : ''}${Math.max(1, Math.round((stats.attendancePercentage || 0) / 20))}% this week`,
                icon: FiCheckCircle,
                tone: 'success'
            },
            {
                key: 'courses',
                label: 'Completed Courses',
                value: stats.completedCourses || 0,
                trend: `+${Math.max(1, Math.min(9, stats.completedCourses || 1))}% this month`,
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
        [activeDaysIn30, badgesEarned, stats.attendancePercentage, stats.completedCourses]
    );

    if (loading && isOverview) {
        return <DashboardSkeleton />;
    }

    if (isAssignmentsView) {
        return (
            <div className="student-dashboard-shell">
                <section className="student-subpage-header card-hero">
                    <div>
                        <h1>Assignments</h1>
                        <p>Track deadlines, submit confidently, and monitor grading progress.</p>
                    </div>
                </section>
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
        <div className="student-dashboard-shell">
            {isOverview && (
                <header className="dashboard-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="welcome-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Hello, {user?.name?.split(' ')[0]} 👋</h1>
                        <p className="welcome-subtitle" style={{ color: 'var(--admin-text-muted)', marginTop: '4px' }}>Here's what's happening with your learning today.</p>
                    </div>
                    <div className="header-actions">
                        <button className="header-icon-btn" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'light' ? <FiMoon /> : <FiSun />}
                        </button>
                    </div>
                    <div className="student-header-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/student/courses')}>
                            Continue Learning
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => navigate('/student/assignments')}>
                            View Assignments
                        </button>
                    </div>
                </section>
            )}

            <section className="student-stats-grid">
                {metricCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <motion.article
                            key={card.key}
                            className={`student-stat-card tone-${card.tone}`}
                            custom={index}
                            variants={CARD_VARIANTS}
                            initial="initial"
                            animate="animate"
                        >
                            <div className="student-stat-card-top">
                                <span className="student-stat-icon">
                                    <Icon />
                                </span>
                                <span className="student-stat-trend">
                                    <FiTrendingUp />
                                    {card.trend}
                                </span>
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Attendance</span>
                                <span className="stat-value"><CountUp value={stats?.attendancePercentage || 0} />%</span>
                            </div>
                        </motion.article>
                    );
                })}
            </section>

            <motion.div
                className="stat-card stat-blue"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                </div>
                <div className="stat-info">
                    <span className="stat-label">Courses Completed</span>
                    <span className="stat-value"><CountUp value={stats?.completedCourses || 0} /></span>
                </div>
            </motion.div>

            <motion.div
                className="stat-card stat-orange"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                </div>
                <div className="stat-info">
                    <span className="stat-label">Learning Resources</span>
                    <span className="stat-value"><CountUp value={stats?.learningResources || 0} /></span>
                </div>
            </motion.div>

            <motion.div
                className="stat-card stat-purple"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="stat-icon">
                    <FiActivity size={24} />
                </div>
                <div className="stat-info">
                    <span className="stat-label">Login Streak</span>
                    <div className="stat-value-row">
                        {stats?.streakStatus === 'paused' ? (
                            <>
                                <span className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--admin-status-danger)' }}>Paused</span>
                            </>
                        ) : (
                            <>
                                <span className="stat-value"><CountUp value={stats?.loginStreak || 0} /></span>
                                <span className="stat-of">days</span>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>

                    {/* Dashboard Sections - 70/30 Grid */ }
    <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '24px' }}>

        {/* Left: Upcoming Sessions (70%) */}
        <section>
            <div className="dashboard-section-header">
                <h2 className="student-section-title"><FiCalendar /> Upcoming Sessions & Meetings</h2>
                <span className="count">{upcomingSessions.length}</span>
            </div>
            <div className="list-container">
                {upcomingSessions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon"><FiCalendar /></div>
                        <p>No upcoming sessions scheduled</p>
                    </div>
                ) : (
                    upcomingSessions.map((session, i) => (
                        <div key={i} className="list-item">
                            <div className="date-badge">
                                <span className="day">{new Date(session.scheduledAt).getDate()}</span>
                                <span className="month">{new Date(session.scheduledAt).toLocaleString('default', { month: 'short' })}</span>
                            </div>
                            <div className="list-item-content">
                                <span className="list-item-title">{session.title}</span>
                                <span className="list-item-subtitle">
                                    {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.type === 'meeting' ? 'Mentorship' : 'Class'}
                                </span>
                            </div>
                            <div className="list-item-action">
                                <a href={session.link} target="_blank" rel="noopener noreferrer" className="btn-primary-sm" style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '6px 12px', background: '#4f46e5', color: 'white', borderRadius: '8px' }}>
                                    Join
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>

        {/* Right: Announcements (30%) - Meeting Card Style */}
        <section>
            <div className="dashboard-section-header">
                <h2><FiBell /> Announcements</h2>
                <span className="count">{announcements.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {announcements.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                        <FiBell style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.3 }} />
                        <p>No announcements</p>
                    </div>
                ) : (
                    announcements.slice(0, 3).map((announcement, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '12px',
                                                borderRadius: '16px',
                                                background: 'var(--admin-surface)',
                                                border: '1px solid var(--admin-border-color)',
                                                boxShadow: 'var(--admin-shadow-sm)',
                                                cursor: 'pointer',
                                                transition: 'var(--admin-transition)'
                                            }}
                                            whileHover={{
                                                transform: 'translateY(-2px)',
                                                boxShadow: 'var(--admin-shadow-md)',
                                                borderColor: 'var(--admin-accent-primary)'
                                            }}
                                        >
                                            <div style={{
                                                width: '44px',
                                                height: '54px',
                                                background: 'var(--admin-bg-color)',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                border: '1px solid var(--admin-border-color)'
                                            }}>
                                                <FiBell style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--admin-status-danger)' }} />
                                                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--admin-status-danger)', marginTop: '2px' }}>
                                                    New
                                                </span>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: '700',
                                                    color: 'var(--admin-text-primary)',
                                                    margin: '0 0 4px 0',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {announcement.title}
                                                </h4>
                                                <p style={{
                                                    fontSize: '0.7rem',
                                                    color: 'var(--admin-text-secondary)',
                                                    margin: 0,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {announcement.content}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="student-session-actions">
                                            <span className={`student-status-chip ${status}`}>{status === 'today' ? 'Today' : status === 'completed' ? 'Completed' : 'Upcoming'}</span>
                                            <span className="student-session-countdown">{countdown}</span>
                                            {session.link ? (
                                                <a
                                                    href={session.link}
                                                    className="btn btn-primary btn-sm"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Join Now
                                                </a>
                                            ) : (
                                                <button type="button" className="btn btn-secondary btn-sm" disabled>
                                                    Link Pending
                                                </button>
                                            )}
                                        </div>
                                    </article>
            );
                            })
            ) : (
            <div className="student-empty-state">
                <FiCalendar />
                <h4>No sessions lined up</h4>
                <p>Take a focused self-study slot today while your mentor schedules the next session.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/student/courses')}>
                    Browse Learning Content
                </button>
            </div>
                        )}
    </div>
                </motion.article >

    <motion.article className="student-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <header className="student-panel-header">
            <div>
                <h2>Announcements</h2>
                <p>Latest updates from mentors and admins.</p>
            </div>
            <span className="badge badge-warning">{announcements.length}</span>
        </header>

        <div className="student-announcement-list">
            {announcements.length > 0 ? (
                announcements.slice(0, 4).map((announcement) => (
                    <article key={announcement.id} className="student-announcement-card">
                        <h4>{announcement.title}</h4>
                        <p>{announcement.content}</p>
                        <small>{new Date(announcement.createdAt).toLocaleDateString()}</small>
                    </article>
                ))
            ) : (
                <div className="student-empty-state compact">
                    <FiCheckCircle />
                    <h4>No announcements yet</h4>
                    <p>You are up to date. Focus on learning today.</p>
                </div>
            )}
        </div>
    </motion.article>
            </section >

    <motion.section className="student-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <header className="student-panel-header with-link">
            <div>
                <h2>Learning Activity Heatmap</h2>
                <p>Visualize your consistency by week and month.</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/student/courses')}>
                Open Learning
                <FiArrowRight />
            </button>
        </header>
        <ActivityHeatmap loginDates={loginDates} />
    </motion.section>
        </div >
    );
};

export default StudentDashboard;
