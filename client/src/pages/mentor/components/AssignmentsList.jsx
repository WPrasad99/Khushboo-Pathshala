import React, { useState } from 'react';
import { useMentorAssignments, useMentorBatches } from '../../../hooks/mentor/useMentorQueries';
import { ClipboardList, PlusSquare } from 'lucide-react';

const AssignmentsList = () => {
    const { data: batches } = useMentorBatches();
    const defaultBatchId = batches?.data?.[0]?.id || '';
    const [selectedBatch, setSelectedBatch] = useState(defaultBatchId);

    const { data: assignmentsData, isLoading } = useMentorAssignments(selectedBatch);

    return (
        <div className="m-section">
            <div className="mentor-page-header">
                <h2 className="mentor-page-title">Tasks & Assignments</h2>
                <div className="mentor-header-actions">
                    <select
                        className="m-select"
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                        <option value="">Select Batch...</option>
                        {batches?.data?.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <button className="m-btn m-btn--primary" disabled={!selectedBatch}>
                        <PlusSquare size={18} /> New Task
                    </button>
                </div>
            </div>

            <div className="m-grid-3">
                {!selectedBatch ? (
                    <div className="m-empty-state">
                        <ClipboardList size={48} />
                        <h3 className="m-empty-state__title">Select a Batch</h3>
                        <p className="m-empty-state__desc">You need to select a batch from the dropdown to manage its assignments.</p>
                    </div>
                ) : isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="m-skeleton m-skeleton--h200" />
                    ))
                ) : assignmentsData?.length > 0 ? (
                    assignmentsData.map((assign) => (
                        <div key={assign.id} className="m-card m-card--interactive">
                            <div className="assignment-card__head">
                                <h3 className="assignment-card__title">{assign.title}</h3>
                            </div>
                            <p className="assignment-card__desc">{assign.description}</p>
                            <div className="assignment-card__footer">
                                <div className="assignment-card__row">
                                    <span className="assignment-card__marks">Max Marks: {assign.maxMarks}</span>
                                    <span className="assignment-card__due">Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
                                </div>
                                <button className="m-btn m-btn--ghost" style={{ width: '100%', marginTop: 'var(--space-12)' }}>
                                    Review Submissions
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="m-empty-state">
                        <ClipboardList size={48} />
                        <h3 className="m-empty-state__title">No Assignments</h3>
                        <p className="m-empty-state__desc">You haven't posted any assignments for this batch yet.</p>
                        <button className="m-btn m-btn--secondary">Create Assignment</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentsList;
