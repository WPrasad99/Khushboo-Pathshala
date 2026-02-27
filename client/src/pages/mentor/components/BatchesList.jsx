import React from 'react';
import { useMentorBatches } from '../../../hooks/mentor/useMentorQueries';
import { Users, BookOpen, ClipboardList } from 'lucide-react';

const BatchesList = () => {
    const { data: batchesData, isLoading } = useMentorBatches();

    if (isLoading) {
        return (
            <div className="m-grid-2">
                {[1, 2, 3, 4].map(key => (
                    <div key={key} className="m-skeleton m-skeleton--h200" />
                ))}
            </div>
        );
    }

    const batches = batchesData?.data || [];

    if (batches.length === 0) {
        return (
            <div className="m-empty-state">
                <Users size={48} />
                <h3 className="m-empty-state__title">No Batches Assigned</h3>
                <p className="m-empty-state__desc">You haven't been assigned to any learning batches yet. Please contact your administrator.</p>
                <button className="m-btn m-btn--primary">Contact Admin</button>
            </div>
        );
    }

    return (
        <div className="m-section">
            <div className="mentor-page-header">
                <h2 className="mentor-page-title">Assigned Batches</h2>
            </div>

            <div className="m-grid-3">
                {batches.map((batch) => (
                    <div key={batch.id} className="m-card m-card--interactive batch-card">
                        <div>
                            <div className="batch-card__head">
                                <h3 className="batch-card__name">{batch.name}</h3>
                                <span className={`m-badge ${batch.status === 'ACTIVE' ? 'm-badge--success' : 'm-badge--muted'}`}>
                                    {batch.status}
                                </span>
                            </div>
                            <p className="batch-card__desc">{batch.description || 'No description provided'}</p>
                        </div>

                        <div className="batch-card__stats">
                            <div className="batch-stat">
                                <Users size={16} />
                                <span className="batch-stat__val">{batch.studentsCount}</span>
                                <span className="batch-stat__label">Mentees</span>
                            </div>
                            <div className="batch-stat">
                                <BookOpen size={16} />
                                <span className="batch-stat__val">{batch.resourcesCount}</span>
                                <span className="batch-stat__label">Resources</span>
                            </div>
                            <div className="batch-stat">
                                <ClipboardList size={16} />
                                <span className="batch-stat__val">{batch.assignmentsCount}</span>
                                <span className="batch-stat__label">Tasks</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BatchesList;
