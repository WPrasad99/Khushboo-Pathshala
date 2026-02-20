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

    const stats = dashboardData?.stats || {};
    const announcements = dashboardData?.announcements || [];
    const upcomingSessions = dashboardData?.upcomingSessions || [];

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
                <section className="student-dashboard-header card-hero">
                    <div>
                        <h1>Hello, {user?.name?.split(' ')[0] || 'Learner'}.</h1>
                        <p>Stay consistent, review upcoming sessions, and keep momentum high this week.</p>
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
                            <div>
                                <h3>{card.value}</h3>
                                <p>{card.label}</p>
                            </div>
                        </motion.article>
                    );
                })}
            </section>

            <section className="student-overview-grid">
                <motion.article className="student-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <header className="student-panel-header">
                        <div>
                            <h2>Upcoming Sessions</h2>
                            <p>Live classes, mentorship calls, and scheduled meetings.</p>
                        </div>
                        <span className="badge badge-primary">{upcomingSessions.length}</span>
                    </header>

                    <div className="student-session-list">
                        {upcomingSessions.length > 0 ? (
                            upcomingSessions.slice(0, 6).map((session) => {
                                const sessionDate = new Date(session.scheduledAt);
                                const status = getSessionStatus(sessionDate);
                                const countdown = formatCountdown(sessionDate.getTime() - now);

                                return (
                                    <article key={session.id} className="student-session-card">
                                        <div className="student-session-meta">
                                            <div className="student-session-date">
                                                <span>{sessionDate.getDate()}</span>
                                                <small>{sessionDate.toLocaleString('default', { month: 'short' })}</small>
                                            </div>
                                            <div>
                                                <h4>{session.title}</h4>
                                                <p>
                                                    <FiClock />
                                                    {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                </motion.article>

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
            </section>

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
        </div>
    );
};

export default StudentDashboard;
