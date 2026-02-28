import React from 'react';
import { Users, Video, FileText, Calendar, ChevronRight } from 'lucide-react';
import { useMentorBatches, useMentorMeetings } from '../../../hooks/mentor/useMentorQueries';

const StatCard = ({ icon: Icon, title, value, subtitle, isLoading }) => {
    if (isLoading) return <div className="m-skeleton m-skeleton--h120" />;

    return (
        <div className="stat-card">
            <div className="stat-card__icon">
                <Icon />
            </div>
            <div>
                <div className="stat-card__value">{value}</div>
                <div className="stat-card__label">{title}</div>
                {subtitle && <div className="stat-card__sub">{subtitle}</div>}
            </div>
        </div>
    );
};

const Overview = () => {
    const { data: batchesData, isLoading: isLoadingBatches, isError: isBatchesError } = useMentorBatches();
    const { data: meetingsData, isLoading: isLoadingMeetings, isError: isMeetingsError } = useMentorMeetings({ limit: 5, filter: 'upcoming' });

    const batches = Array.isArray(batchesData) ? batchesData : [];
    const totalStudents = batches.reduce((acc, b) => acc + (b.studentsCount ?? 0), 0);
    const totalBatches = batches.length;
    const totalResources = batches.reduce((acc, b) => acc + (b.resourcesCount ?? 0), 0);
    const upcomingMeetings = meetingsData?.items ?? [];

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
        <div className="m-section">
            <div className="stat-grid">
                <StatCard
                    icon={Users}
                    title="Total Mentees"
                    value={totalStudents}
                    subtitle="Across all assigned batches"
                    isLoading={isLoadingBatches}
                />
                <StatCard
                    icon={Video}
                    title="Active Batches"
                    value={totalBatches}
                    isLoading={isLoadingBatches}
                />
                <StatCard
                    icon={FileText}
                    title="Resources Uploaded"
                    value={totalResources}
                    isLoading={isLoadingBatches}
                />
                <StatCard
                    icon={Calendar}
                    title="Upcoming Meetings"
                    value={upcomingMeetings.length}
                    isLoading={isLoadingMeetings}
                />
            </div>

            <div className="m-card">
                <h3 className="m-section-title">
                    <Calendar />
                    Upcoming Meetings
                </h3>
                {isLoadingMeetings ? (
                    <div className="m-section">
                        {[1, 2, 3].map(i => <div key={i} className="m-skeleton m-skeleton--h40" />)}
                    </div>
                ) : upcomingMeetings.length > 0 ? (
                    <div className="m-section">
                        {upcomingMeetings.map((mtg) => (
                            <div key={mtg.id} className="meeting-row">
                                <div className="meeting-row__info">
                                    <span className="meeting-row__title">{mtg.title}</span>
                                    <span className="meeting-row__meta">{new Date(mtg.meetingDate).toLocaleString()}</span>
                                </div>
                                <ChevronRight className="meeting-row__arrow" size={20} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="m-empty-state">
                        <Calendar size={40} />
                        <p className="m-empty-state__desc">No upcoming meetings</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Overview;
