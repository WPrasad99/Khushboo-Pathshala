import React from 'react';
import { createPortal } from 'react-dom';
import { useMentorBatches, useMentorStudents } from '../../../hooks/mentor/useMentorQueries';
import { Users, BookOpen, ClipboardList, Mail, Phone, Calendar, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../../components/admin/Modal.css';

const BatchDetailsModal = ({ batch, onClose }) => {
    const { data: studentsData, isLoading } = useMentorStudents({ batchId: batch.id });
    const students = Array.isArray(studentsData) ? studentsData : [];

    return createPortal(
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ zIndex: 1000 }}
            >
                <motion.div
                    className="glass-modal large"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: '1000px', width: '95%', borderRadius: 'var(--radius-2xl)' }}
                >
                    <div className="modal-header" style={{ padding: 'var(--space-24) var(--space-32)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <h2 style={{ fontSize: 'var(--fs-h2)', margin: 0, color: 'var(--color-primary)' }}>{batch.name}</h2>
                            <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: 0 }}>
                                Batch Management & Student Performance
                            </p>
                        </div>
                        <button onClick={onClose} className="m-btn m-btn--ghost" style={{ padding: '8px', minHeight: 'unset' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="modal-body" style={{ padding: '0' }}>
                        {/* Batch Stats Row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 'var(--space-16)',
                            padding: 'var(--space-24) var(--space-32)',
                            background: 'var(--color-surface-muted)',
                            borderBottom: '1px solid var(--color-border)'
                        }}>
                            <div className="batch-stat" style={{ background: 'var(--color-surface)', padding: 'var(--space-16)', borderRadius: 'var(--radius-lg)' }}>
                                <Users size={20} color="var(--color-primary)" />
                                <span className="batch-stat__val" style={{ fontSize: 'var(--fs-h3)' }}>{batch.studentsCount}</span>
                                <span className="batch-stat__label">Total Mentees</span>
                            </div>
                            <div className="batch-stat" style={{ background: 'var(--color-surface)', padding: 'var(--space-16)', borderRadius: 'var(--radius-lg)' }}>
                                <BookOpen size={20} color="var(--color-info)" />
                                <span className="batch-stat__val" style={{ fontSize: 'var(--fs-h3)' }}>{batch.resourcesCount}</span>
                                <span className="batch-stat__label">Resources</span>
                            </div>
                            <div className="batch-stat" style={{ background: 'var(--color-surface)', padding: 'var(--space-16)', borderRadius: 'var(--radius-lg)' }}>
                                <ClipboardList size={20} color="var(--color-warning)" />
                                <span className="batch-stat__val" style={{ fontSize: 'var(--fs-h3)' }}>{batch.assignmentsCount}</span>
                                <span className="batch-stat__label">Assignments</span>
                            </div>
                            <div className="batch-stat" style={{ background: 'var(--color-surface)', padding: 'var(--space-16)', borderRadius: 'var(--radius-lg)' }}>
                                <Calendar size={20} color="var(--color-success)" />
                                <span className="batch-stat__val" style={{ fontSize: 'var(--fs-h3)' }}>
                                    {new Date(batch.assignedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className="batch-stat__label">Date Assigned</span>
                            </div>
                        </div>

                        {/* Students Section */}
                        <div style={{ padding: 'var(--space-32)' }}>
                            <div className="flex-between" style={{ marginBottom: 'var(--space-20)' }}>
                                <h3 className="m-section-title" style={{ margin: 0, fontSize: 'var(--fs-h3)' }}>
                                    <Users size={20} /> Mentees Directory
                                </h3>
                                <div className="m-badge m-badge--info">{students.length} Total</div>
                            </div>

                            {isLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                                    {[1, 2, 3].map(i => <div key={i} className="m-skeleton m-skeleton--h40" />)}
                                </div>
                            ) : students.length > 0 ? (
                                <div className="m-table-wrap" style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                                    <table className="m-table">
                                        <thead>
                                            <tr>
                                                <th>Student Name</th>
                                                <th>Contact Info</th>
                                                <th className="text-right">Progess</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map(student => (
                                                <tr key={student.id}>
                                                    <td>
                                                        <div className="m-user-row">
                                                            <div className="m-user-avatar" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                                {student.name[0]}
                                                            </div>
                                                            <div>
                                                                <span className="m-user-name">{student.name}</span>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.educationLevel || 'Undergraduate'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-small)' }}>
                                                                <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                                                                <span>{student.email}</span>
                                                            </div>
                                                            {student.phone && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                                    <Phone size={11} />
                                                                    <span>{student.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-right">
                                                        <div className="m-progress-wrap" style={{ justifyContent: 'flex-end', gap: '12px' }}>
                                                            <div className="m-progress-bar" style={{ width: '80px' }}>
                                                                <div className="m-progress-fill" style={{ width: `${student.attendanceAvg || 0}%` }} />
                                                            </div>
                                                            <span className="m-progress-text">{student.attendanceAvg || 0}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="m-empty-state" style={{ background: 'transparent' }}>
                                    <Users size={40} />
                                    <p className="m-empty-state__desc">No students enrolled in this batch yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-actions" style={{ padding: 'var(--space-20) var(--space-32)', borderTop: '1px solid var(--color-border)', justifyContent: 'flex-end' }}>
                        <button onClick={onClose} className="m-btn m-btn--primary">
                            Done
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
                    <h3 className="m-empty-state__title">Data Sync Error</h3>
                    <p className="m-empty-state__desc">We encountered an issue while fetching your batch data. Please try again.</p>
                    <button className="m-btn m-btn--secondary" onClick={() => window.location.reload()}>Retry Sync</button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="m-section">
                <div className="mentor-page-header">
                    <div className="m-skeleton m-skeleton--h40" style={{ width: '200px' }} />
                </div>
                <div className="m-grid-3">
                    {[1, 2, 3].map(key => (
                        <div key={key} className="m-skeleton m-skeleton--h200" />
                    ))}
                </div>
            </div>
        );
    }

    const batches = Array.isArray(batchesData) ? batchesData : [];

    if (batches.length === 0) {
        return (
            <div className="m-empty-state">
                <Users size={64} style={{ color: 'var(--color-primary)', opacity: 0.2 }} />
                <h3 className="m-empty-state__title">No Active Batches</h3>
                <p className="m-empty-state__desc">You haven't been assigned to any learning groups. Check back soon or contact support.</p>
                <button className="m-btn m-btn--primary">Request Access</button>
            </div>
        );
    }

    return (
        <div className="m-section">
            <header className="mentor-page-header">
                <div>
                    <h2 className="mentor-page-title">Active Batches</h2>
                    <p className="mentor-page-subtitle">Oversee your assigned student groups and track their collective progress.</p>
                </div>
                <div className="mentor-header-actions">
                    <button className="m-btn m-btn--secondary">
                        <Filter size={18} />
                        Filter
                    </button>
                </div>
            </header>

            <div className="m-grid-3">
                {batches.map((batch) => (
                    <motion.div
                        key={batch.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
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
                            <p className="batch-card__desc">{batch.description || 'No specific course description provided for this batch.'}</p>
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
                    </motion.div>
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
