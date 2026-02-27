import React from 'react';
import { createPortal } from 'react-dom';
import { useMentorBatches, useMentorStudents } from '../../../hooks/mentor/useMentorQueries';
import { Users, BookOpen, ClipboardList, Mail, Phone, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../../components/admin/Modal.css';

const BatchDetailsModal = ({ batch, onClose }) => {
    const { data: studentsData, isLoading } = useMentorStudents({ batchId: batch.id });
    const students = studentsData?.data || [];

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
                    className="glass-modal large"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: '900px', width: '95%' }}
                >
                    <div className="modal-header" style={{ padding: '24px 32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <h2 style={{ fontSize: 'var(--fs-h3)', margin: 0 }}>{batch.name}</h2>
                            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: 0 }}>
                                Batch Overview & Mentees
                            </p>
                        </div>
                        <button onClick={onClose} className="modal-close-btn">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="modal-body" style={{ padding: '0' }}>
                        {/* Batch Stats Row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '12px',
                            padding: '20px 32px',
                            background: 'var(--color-surface-muted)',
                            borderBottom: '1px solid var(--color-border)'
                        }}>
                            <div className="batch-stat" style={{ flex: 1, background: 'var(--color-surface)', padding: '12px' }}>
                                <Users size={18} color="var(--color-primary)" />
                                <span className="batch-stat__val" style={{ fontSize: 'var(--fs-h4)' }}>{batch.studentsCount}</span>
                                <span className="batch-stat__label" style={{ fontSize: '10px' }}>Total Mentees</span>
                            </div>
                            <div className="batch-stat" style={{ flex: 1, background: 'var(--color-surface)', padding: '12px' }}>
                                <BookOpen size={18} color="var(--color-info)" />
                                <span className="batch-stat__val" style={{ fontSize: 'var(--fs-h4)' }}>{batch.resourcesCount}</span>
                                <span className="batch-stat__label" style={{ fontSize: '10px' }}>Resources</span>
                            </div>
                            <div className="batch-stat" style={{ flex: 1, background: 'var(--color-surface)', padding: '12px' }}>
                                <ClipboardList size={18} color="var(--color-warning)" />
                                <span className="batch-stat__val" style={{ fontSize: 'var(--fs-h4)' }}>{batch.assignmentsCount}</span>
                                <span className="batch-stat__label" style={{ fontSize: '10px' }}>Assignments</span>
                            </div>
                            <div className="batch-stat" style={{ flex: 1, background: 'var(--color-surface)', padding: '12px' }}>
                                <Calendar size={18} color="var(--color-success)" />
                                <span className="batch-stat__val" style={{ fontSize: 'var(--fs-h4)' }}>
                                    {new Date(batch.assignedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="batch-stat__label" style={{ fontSize: '10px' }}>Assigned Date</span>
                            </div>
                        </div>

                        {/* Students Section */}
                        <div style={{ padding: '24px 32px' }}>
                            <h3 className="m-section-title" style={{ marginBottom: '16px', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)' }}>
                                <Users size={18} /> Mentees in this Batch
                            </h3>

                            {isLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[1, 2, 3].map(i => <div key={i} className="m-skeleton m-skeleton--h60" style={{ borderRadius: '12px' }} />)}
                                </div>
                            ) : students.length > 0 ? (
                                <div className="m-table-wrap" style={{ borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                                    <table className="m-table">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Contact</th>
                                                <th className="text-right">Attendance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map(student => (
                                                <tr key={student.id}>
                                                    <td>
                                                        <div className="m-user-row">
                                                            <img
                                                                src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}
                                                                className="m-user-avatar"
                                                                alt={student.name}
                                                            />
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span className="m-user-name" style={{ fontSize: 'var(--fs-body)' }}>{student.name}</span>
                                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.educationLevel || 'Student'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                                                <Mail size={12} color="var(--text-muted)" />
                                                                <span style={{ color: 'var(--text-secondary)' }}>{student.email}</span>
                                                            </div>
                                                            {student.phone && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                                                                    <Phone size={11} color="var(--text-muted)" />
                                                                    <span style={{ color: 'var(--text-muted)' }}>{student.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-right">
                                                        <div className="m-progress-wrap" style={{ justifyContent: 'flex-end' }}>
                                                            <div className="m-progress-bar" style={{ width: '60px' }}>
                                                                <div className="m-progress-fill" style={{ width: `${student.attendanceAvg || 0}%` }} />
                                                            </div>
                                                            <span className="m-progress-text" style={{ fontSize: '11px' }}>{student.attendanceAvg || 0}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '32px', background: 'var(--color-surface-muted)', borderRadius: '16px' }}>
                                    <Users size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 'var(--fs-body)' }}>No students found in this batch.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-actions" style={{ padding: '16px 32px' }}>
                        <button onClick={onClose} className="m-btn m-btn--secondary" style={{ width: '100px' }}>
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

const BatchesList = () => {
    const { data: batchesData, isLoading, isError } = useMentorBatches();
    const [selectedBatch, setSelectedBatch] = React.useState(null);

    const handleBatchClick = (batch) => {
        setSelectedBatch(batch);
    };

    if (isError) {
        return (
            <div className="m-section">
                <div className="m-empty-state">
                    <h3 className="m-empty-state__title">Failed to load batches</h3>
                    <p className="m-empty-state__desc">Please refresh the page or try again later.</p>
                </div>
            </div>
        );
    }

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
                    <div
                        key={batch.id}
                        className="m-card m-card--interactive batch-card"
                        onClick={() => handleBatchClick(batch)}
                    >
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

            {selectedBatch && (
                <BatchDetailsModal
                    batch={selectedBatch}
                    onClose={() => setSelectedBatch(null)}
                />
            )}
        </div>
    );
};

export default BatchesList;
