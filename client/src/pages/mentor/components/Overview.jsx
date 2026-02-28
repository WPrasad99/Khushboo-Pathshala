import React from 'react';
import {
    Users, Video, FileText, Calendar, ChevronRight,
    ArrowUpRight, Clock, Plus, MessageSquare,
    TrendingUp, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useMentorBatches, useMentorMeetings } from '../../../hooks/mentor/useMentorQueries';
import { useAuth } from '../../../context/AuthContext';

const StatCardV2 = ({ icon: Icon, title, value, trend, progress, color, isLoading }) => {
    if (isLoading) return <div className="m-skeleton m-skeleton--h120" />;

    return (
        <div className="stat-card-v2">
            <div className="stat-card-v2__head">
                <div className="stat-card-v2__icon" style={{ backgroundColor: `${color}15`, color: color }}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className="stat-trend stat-trend--up">
                        <ArrowUpRight size={12} />
                        {trend}
                    </div>
                )}
            </div>
            <div className="stat-card-v2__body">
                <div className="stat-card-v2__value">{value}</div>
                <div className="stat-card-v2__label">{title}</div>
                {progress !== undefined && (
                    <div className="stat-card-v2__progress">
                        <div className="stat-progress-fill" style={{ width: `${progress}%`, backgroundColor: color }} />
                    </div>
                )}
            </div>
        </div>
    );
};

const PerformanceChart = () => {
    const data = [
        { label: 'Mon', value: 65 },
        { label: 'Tue', value: 45 },
        { label: 'Wed', value: 85 },
        { label: 'Thu', value: 35 },
        { label: 'Fri', value: 90 },
        { label: 'Sat', value: 55 },
        { label: 'Sun', value: 75 },
    ];

    return (
        <div className="chart-placeholder">
            {data.map((item, i) => (
                <div key={i} className="chart-bar-wrap">
                    <div
                        className="chart-bar"
                        style={{ height: `${item.value}%` }}
                        data-value={`${item.value}%`}
                    />
                    <span className="chart-label">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

const Overview = () => {
    const { user } = useAuth();
    const { data: batchesData, isLoading: isLoadingBatches, isError: isBatchesError } = useMentorBatches();
    const { data: meetingsData, isLoading: isLoadingMeetings, isError: isMeetingsError } = useMentorMeetings({ limit: 5, filter: 'upcoming' });

    const batches = Array.isArray(batchesData) ? batchesData : [];
    const totalStudents = batches.reduce((acc, b) => acc + (b.studentsCount ?? 0), 0);
    const totalBatches = batches.length;
    const totalResources = batches.reduce((acc, b) => acc + (b.resourcesCount ?? 0), 0);
    const upcomingMeetings = meetingsData?.items ?? [];

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

    if (isBatchesError || isMeetingsError) {
        return (
            <div className="m-section">
                <div className="m-empty-state">
                    <p className="m-empty-state__desc">Failed to load dashboard. Please refresh the page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-grid">
            <div className="dashboard-main">
                {/* 1. SMART SUMMARY HEADER */}
                <header className="summary-header">
                    <div className="summary-content">
                        <h1>Good Morning, {user?.name?.split(' ')[0] || 'Mentor'} 👋</h1>
                        <div className="summary-insight">
                            <Clock size={16} />
                            <span>It's {currentDate} | {currentTime}</span>
                            <span className="insight-badge">2 Pending Reviews</span>
                        </div>
                    </div>
                    <div className="summary-actions">
                        <button className="m-btn m-btn--secondary">
                            <MessageSquare size={18} />
                            Message
                        </button>
                        <button className="m-btn m-btn--primary">
                            <Plus size={18} />
                            Schedule
                        </button>
                    </div>
                </header>

                {/* 2. KPI METRIC CARDS */}
                <div className="stat-grid-v2">
                    <StatCardV2
                        icon={Users}
                        title="Total Mentees"
                        value={totalStudents}
                        trend="12%"
                        color="#4F46E5"
                        isLoading={isLoadingBatches}
                    />
                    <StatCardV2
                        icon={Video}
                        title="Active Batches"
                        value={totalBatches}
                        progress={75}
                        color="#10B981"
                        isLoading={isLoadingBatches}
                    />
                    <StatCardV2
                        icon={FileText}
                        title="Resources"
                        value={totalResources}
                        trend="8%"
                        color="#F59E0B"
                        isLoading={isLoadingBatches}
                    />
                    <StatCardV2
                        icon={Calendar}
                        title="Meetings"
                        value={upcomingMeetings.length}
                        color="#EF4444"
                        isLoading={isLoadingMeetings}
                    />
                </div>

                {/* 3. PERFORMANCE & ATTENTION */}
                <section className="performance-section">
                    <div className="m-card performance-card">
                        <div className="flex-between" style={{ marginBottom: 'var(--space-20)' }}>
                            <h3 className="m-section-title" style={{ margin: 0 }}>
                                <TrendingUp />
                                Engagement Overview
                            </h3>
                            <div className="m-badge m-badge--info">Last 7 Days</div>
                        </div>
                        <PerformanceChart />
                        <div className="stat-grid-v2" style={{ marginTop: 'var(--space-24)', gap: 'var(--space-12)' }}>
                            <div>
                                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>Completion Rate</div>
                                <div style={{ fontSize: 'var(--fs-h4)', fontWeight: 'var(--fw-bold)' }}>94%</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>Avg. Score</div>
                                <div style={{ fontSize: 'var(--fs-h4)', fontWeight: 'var(--fw-bold)' }}>8.4/10</div>
                            </div>
                        </div>
                    </div>

                    <div className="m-card">
                        <h3 className="m-section-title">
                            <AlertCircle />
                            Attention Needed
                        </h3>
                        <div className="risk-list">
                            {[
                                { name: 'Aman Kumar', risk: 'High', color: 'danger' },
                                { name: 'Priya Singh', risk: 'Medium', color: 'warning' },
                                { name: 'Rahul Verma', risk: 'Low', color: 'info' },
                            ].map((student, i) => (
                                <div key={i} className="risk-item">
                                    <div className="m-user-row">
                                        <div className="m-user-avatar" style={{ width: 32, height: 32 }}>
                                            {student.name[0]}
                                        </div>
                                        <div>
                                            <div className="m-user-name" style={{ fontSize: 'var(--fs-small)' }}>{student.name}</div>
                                            <div className="m-badge m-badge--muted" style={{ fontSize: '10px' }}>7d Inactive</div>
                                        </div>
                                    </div>
                                    <div className={`m-badge m-badge--${student.color}`}>{student.risk}</div>
                                </div>
                            ))}
                        </div>
                        <button className="m-btn m-btn--ghost" style={{ width: '100%', marginTop: 'var(--space-16)' }}>
                            View All Students
                        </button>
                    </div>
                </section>

                {/* 4. UPCOMING MEETINGS */}
                <section className="m-card">
                    <div className="flex-between" style={{ marginBottom: 'var(--space-20)' }}>
                        <h3 className="m-section-title" style={{ margin: 0 }}>
                            <Calendar />
                            Upcoming Meetings
                        </h3>
                        <button className="m-btn m-btn--ghost">View Calendar</button>
                    </div>

                    {isLoadingMeetings ? (
                        <div className="meetings-grid-v2">
                            {[1, 2].map(i => <div key={i} className="m-skeleton m-skeleton--h80" />)}
                        </div>
                    ) : upcomingMeetings.length > 0 ? (
                        <div className="meetings-grid-v2">
                            {upcomingMeetings.map((mtg) => (
                                <div key={mtg.id} className="meeting-card-v2">
                                    <div className="meeting-user">
                                        <div className="m-user-avatar meeting-avatar">
                                            {mtg.title[0]}
                                        </div>
                                        <div className="meeting-info">
                                            <h4>{mtg.title}</h4>
                                            <div className="meeting-time-wrap">
                                                <Clock size={14} />
                                                <span>{new Date(mtg.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="countdown-badge">In 2 hours</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="meeting-actions">
                                        <button className="m-btn m-btn--secondary">Join</button>
                                        <button className="m-btn m-btn--ghost">
                                            <ChevronRight />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="m-empty-state">
                            <Calendar size={40} />
                            <p className="m-empty-state__desc">No meetings scheduled for today.</p>
                        </div>
                    )}
                </section>
            </div>

            {/* 5. ACTIVITY FEED (RIGHT SIDEBAR) */}
            <aside className="m-card dashboard-sidebar">
                <h3 className="m-section-title">
                    <TrendingUp />
                    Recent Activity
                </h3>
                <div className="timeline">
                    {[
                        { title: 'Assignment Submitted', desc: 'Aman Kumar submitted Math Homework', time: '10m ago', icon: CheckCircle2 },
                        { title: 'New Message', desc: 'Priya Singh sent a question', time: '1h ago', icon: MessageSquare },
                        { title: 'Session Completed', desc: 'Algebra Batch - Week 3', time: '3h ago', icon: Video },
                        { title: 'Resource Uploaded', desc: 'New PDF: Physics Notes', time: 'Yesterday', icon: FileText },
                    ].map((item, i) => (
                        <div key={i} className="timeline-item">
                            <div className="timeline-dot" />
                            <div className="timeline-content">
                                <div className="timeline-title">{item.title}</div>
                                <div className="timeline-time">{item.time}</div>
                                <div className="timeline-desc">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="m-btn m-btn--ghost" style={{ width: '100%', marginTop: 'var(--space-12)' }}>
                    View All Activity
                </button>
            </aside>
        </div>
    );
};

export default Overview;
