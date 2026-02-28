import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMentorAssignments, useMentorBatches, useCreateAssignment } from '../../../hooks/mentor/useMentorQueries';
import { ClipboardList, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiErrorMessage } from '../../../api';
import '../../../components/admin/Modal.css';

const CreateAssignmentModal = ({ batchId, batches, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [maxMarks, setMaxMarks] = useState(100);
    const [selectedBatchId, setSelectedBatchId] = useState(batchId || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const createAssignment = useCreateAssignment();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!selectedBatchId) {
                setError('Please select a batch.');
                setLoading(false);
                return;
            }

            const parsedDate = new Date(dueDate);
            if (isNaN(parsedDate.getTime())) {
                setError('Please provide a valid due date.');
                setLoading(false);
                return;
            }

            if (parsedDate < new Date()) {
                setError('Due date cannot be in the past.');
                setLoading(false);
                return;
            }

            await createAssignment.mutateAsync({
                title,
                description,
                batchId: selectedBatchId,
                dueDate: parsedDate.toISOString(),
                maxMarks: Number(maxMarks)
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to create assignment. Please try again.'));
            setLoading(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="glass-modal"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h2>Create New Assignment</h2>
                        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                        <div className="modal-body" style={{ flex: 1 }}>
                            {error && (
                                <div className="error-message" style={{ color: 'var(--color-error)', marginBottom: 16, fontSize: 14 }}>
                                    {error}
                                </div>
                            )}

                            <div className="glass-form-group">
                                <label className="glass-label">Batch *</label>
                                <div className="glass-input-group">
                                    <select
                                        className="glass-input"
                                        value={selectedBatchId}
                                        onChange={(e) => setSelectedBatchId(e.target.value)}
                                        required
                                        style={{ paddingRight: '16px' }}
                                    >
                                        <option value="">Select batch...</option>
                                        {(batches || []).map((b) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="glass-form-group">
                                <label className="glass-label">Title *</label>
                                <div className="glass-input-group">
                                    <input
                                        type="text"
                                        className="glass-input"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. React Final Project"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="glass-form-group">
                                <label className="glass-label">Description *</label>
                                <div className="glass-input-group">
                                    <textarea
                                        className="glass-input"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Detailed instructions for the assignment..."
                                        rows={4}
                                        style={{ resize: 'vertical', paddingLeft: '16px' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="glass-form-group" style={{ marginBottom: 0 }}>
                                    <label className="glass-label">Due Date *</label>
                                    <div className="glass-input-group">
                                        <input
                                            type="date"
                                            className="glass-input"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="glass-form-group" style={{ marginBottom: 0 }}>
                                    <label className="glass-label">Max Marks</label>
                                    <div className="glass-input-group">
                                        <input
                                            type="number"
                                            className="glass-input"
                                            value={maxMarks}
                                            onChange={(e) => setMaxMarks(e.target.value)}
                                            min={1}
                                            max={100}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="m-btn m-btn--secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="m-btn m-btn--primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Assignment'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

const AssignmentsList = () => {
    const { data: batches } = useMentorBatches();
    const [selectedBatch, setSelectedBatch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const initialSetDone = useRef(false);

    // Set selectedBatch to first batch when batches load (only once)
    useEffect(() => {
        if (initialSetDone.current || !batches || batches.length === 0) return;
        initialSetDone.current = true;
        setSelectedBatch(batches[0].id);
    }, [batches]);

    const { data: assignmentsData, isLoading, isError } = useMentorAssignments(selectedBatch);
    const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];

    if (isError) {
        return (
            <div className="m-section">
                <div className="m-empty-state">
                    <h3 className="m-empty-state__title">Failed to load assignments</h3>
                    <p className="m-empty-state__desc">Please refresh the page or try again later.</p>
                </div>
            </div>
        );
    }

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
                        {Array.isArray(batches) && batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <button
                        className="m-btn m-btn--primary"
                        disabled={!selectedBatch}
                        onClick={() => setShowCreateModal(true)}
                    >
                        <PlusSquare size={18} /> New Task
                    </button>
                </div>
            </div>

            <div className="m-grid-3">
                {!selectedBatch ? (
                    <div className="m-empty-state" style={{ gridColumn: '1 / -1' }}>
                        <ClipboardList size={48} />
                        <h3 className="m-empty-state__title">Select a Batch</h3>
                        <p className="m-empty-state__desc">You need to select a batch from the dropdown to manage its assignments.</p>
                    </div>
                ) : isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="m-skeleton m-skeleton--h200" />
                    ))
                ) : assignments.length > 0 ? (
                    assignments.map((assign) => (
                        <div key={assign.id} className="m-card m-card--interactive">
                            <div className="assignment-card__head">
                                <h3 className="assignment-card__title">{assign.title}</h3>
                            </div>
                            <p className="assignment-card__desc">{assign.description}</p>
                            <div className="assignment-card__footer">
                                <div className="assignment-card__row">
                                    <span className="assignment-card__marks" style={{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)' }}>Max Marks: {assign.maxMarks}</span>
                                    <span className="assignment-card__due" style={{ color: 'var(--color-warning)' }}>Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
                                </div>
                                <button className="m-btn m-btn--ghost" style={{ width: '100%', marginTop: 'var(--space-12)' }}>
                                    Review Submissions
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="m-empty-state" style={{ gridColumn: '1 / -1' }}>
                        <ClipboardList size={48} />
                        <h3 className="m-empty-state__title">No Assignments</h3>
                        <p className="m-empty-state__desc">You haven't posted any assignments for this batch yet.</p>
                        <button className="m-btn m-btn--secondary" onClick={() => setShowCreateModal(true)}>Create Assignment</button>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateAssignmentModal
                    batchId={selectedBatch}
                    batches={Array.isArray(batches) ? batches : []}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { }}
                />
            )}
        </div>
    );
};

export default AssignmentsList;
