import React, { useState } from 'react';
import { useMentorMeetings } from '../../../hooks/mentor/useMentorQueries';
import { Calendar, Clock, Users, Plus, Video, ExternalLink, CalendarClock } from 'lucide-react';
import { motion } from 'framer-motion';

const MeetingsList = () => {
    const [filter, setFilter] = useState('upcoming');
    const { data: meetingsData, isLoading, isError } = useMentorMeetings({ limit: 50, filter });

    const meetings = meetingsData?.items ?? [];

    if (isError) {
        return (
            <div className="m-section">
                <div className="m-empty-state">
                    <Calendar size={48} style={{ opacity: 0.2 }} />
                    <h3 className="m-empty-state__title">Calendar Sync Failed</h3>
                    <p className="m-empty-state__desc">We couldn't synchronize your mentorship meetings. Please try again.</p>
                    <button className="m-btn m-btn--secondary" onClick={() => window.location.reload()}>Retry Sync</button>
                </div>
            </div>
        );
    }

    return (
        <div className="m-section">
            <header className="mentor-page-header">
                <div>
                    <h2 className="mentor-page-title">Mentorship Meetings</h2>
                    <p className="mentor-page-subtitle">Coordinate 1-on-1 sessions and track your meeting history with students.</p>
                </div>
                <div className="mentor-header-actions">
                    <button className="m-btn m-btn--primary">
                        <Plus size={18} />
                        Schedule Session
                    </button>
                </div>
            </header>

            <div className="m-card" style={{ padding: 'var(--space-16)', marginBottom: 'var(--space-8)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
                    {['upcoming', 'past', 'all'].map((f) => (
                        <button
                            key={f}
                            className={`m-btn ${filter === f ? 'm-btn--primary' : 'm-btn--ghost'}`}
                            onClick={() => setFilter(f)}
                            style={{
                                textTransform: 'capitalize',
                                minHeight: '34px',
                                background: filter === f ? 'var(--color-primary)' : 'transparent'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="m-grid-3">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="m-skeleton m-skeleton--h160" />
                    ))
                ) : meetings.length > 0 ? (
                    meetings.map((mtg, idx) => (
                        <motion.div
                            key={mtg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="m-card m-card--interactive"
                            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}
                        >
                            <div>
                                <div className="batch-card__head">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                                        <div style={{ background: 'var(--color-primary-soft)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                                            <Video size={18} color="var(--color-primary)" />
                                        </div>
                                        <h3 className="batch-card__name" style={{ fontSize: 'var(--fs-body-lg)' }}>{mtg.title}</h3>
                                    </div>
                                    <span className={`m-badge ${new Date(mtg.meetingDate) > new Date() ? 'm-badge--info' : 'm-badge--muted'}`}>
                                        {mtg.status || (new Date(mtg.meetingDate) > new Date() ? 'Upcoming' : 'Completed')}
                                    </span>
                                </div>

                                <div className="meeting-card__meta" style={{ marginTop: 'var(--space-16)', background: 'var(--color-surface-muted)', padding: 'var(--space-12)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="meeting-card__meta-item" style={{ fontSize: 'var(--fs-small)' }}>
                                        <Calendar size={14} />
                                        <span>{new Date(mtg.meetingDate).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                    </div>
                                    <div className="meeting-card__meta-item" style={{ fontSize: 'var(--fs-small)' }}>
                                        <Clock size={14} />
                                        <span>{new Date(mtg.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({mtg.duration}m)</span>
                                    </div>
                                    <div className="meeting-card__meta-item" style={{ fontSize: 'var(--fs-small)' }}>
                                        <Users size={14} />
                                        <span>{mtg.mentee?.name || 'Multiple Mentees'}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', gap: 'var(--space-8)' }}>
                                {mtg.remarks && (
                                    <a
                                        href={mtg.remarks}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="m-btn m-btn--primary"
                                        style={{ flex: 1, fontSize: 'var(--fs-small)' }}
                                    >
                                        <ExternalLink size={14} />
                                        Join Meeting
                                    </a>
                                )}
                                <button className="m-btn m-btn--secondary" style={{ padding: '0 12px' }}>
                                    Details
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="m-empty-state">
                        <div style={{ background: 'var(--color-primary-soft)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-16)' }}>
                            <CalendarClock size={32} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <h3 className="m-empty-state__title">No Scheduled Meetings</h3>
                        <p className="m-empty-state__desc">You have no {filter === 'all' ? '' : filter} mentorship sessions found.</p>
                        <button className="m-btn m-btn--primary">Schedule First Session</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingsList;
