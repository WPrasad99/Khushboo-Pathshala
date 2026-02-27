import React, { useState } from 'react';
import { useMentorMeetings } from '../../../hooks/mentor/useMentorQueries';
import { Calendar, Clock, Users, Plus } from 'lucide-react';

const MeetingsList = () => {
    const [filter, setFilter] = useState('upcoming');
    const { data: meetingsData, isLoading } = useMentorMeetings({ limit: 50, filter });

    return (
        <div className="m-section">
            <div className="mentor-page-header">
                <h2 className="mentor-page-title">Mentorship Meetings</h2>
                <div className="mentor-header-actions">
                    <select
                        className="m-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Meetings</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                    </select>

                    <button className="m-btn m-btn--primary">
                        <Plus size={18} /> Schedule
                    </button>
                </div>
            </div>

            <div className="m-grid-3">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="m-skeleton m-skeleton--h160" />
                    ))
                ) : meetingsData?.data?.items?.length > 0 ? (
                    meetingsData.data.items.map((mtg) => (
                        <div key={mtg.id} className="m-card m-card--interactive">
                            <div>
                                <div className="batch-card__head">
                                    <h3 className="batch-card__name" style={{ fontSize: 'var(--fs-body)' }}>{mtg.title}</h3>
                                    <span className={`m-badge ${new Date(mtg.meetingDate) > new Date() ? 'm-badge--info' : 'm-badge--muted'}`}>
                                        {mtg.status || (new Date(mtg.meetingDate) > new Date() ? 'Upcoming' : 'Past')}
                                    </span>
                                </div>

                                <div className="meeting-card__meta">
                                    <div className="meeting-card__meta-item">
                                        <Calendar size={16} />
                                        <span>{new Date(mtg.meetingDate).toLocaleString()}</span>
                                    </div>
                                    <div className="meeting-card__meta-item">
                                        <Clock size={16} />
                                        <span>{mtg.duration} mins</span>
                                    </div>
                                    <div className="meeting-card__meta-item">
                                        <Users size={16} />
                                        <span>{mtg.mentee?.name || 'Multiple Students'}</span>
                                    </div>
                                </div>
                            </div>

                            {mtg.remarks && (
                                <div className="meeting-card__link">
                                    <a
                                        href={mtg.remarks}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="m-btn m-btn--secondary"
                                        style={{ width: '100%', textAlign: 'center' }}
                                    >
                                        Join Link
                                    </a>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="m-empty-state">
                        <Calendar size={48} />
                        <h3 className="m-empty-state__title">No Meetings Found</h3>
                        <p className="m-empty-state__desc">You have no {filter === 'all' ? '' : filter} meetings scheduled.</p>
                        <button className="m-btn m-btn--primary">Schedule New Meeting</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingsList;
