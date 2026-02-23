import { useState, useEffect } from 'react';
import { batchAPI } from '../../api';
import { FiPlus, FiTrash2, FiUsers, FiAward, FiEye, FiMoreVertical, FiEdit2, FiX, FiMail, FiUser } from 'react-icons/fi';
import CreateBatchModal from './CreateBatchModal';
import EditBatchModal from './EditBatchModal';
import { motion, AnimatePresence } from 'framer-motion';

// ── View Batch Modal ─────────────────────────────────────────────────────────
const ViewBatchModal = ({ batch, onClose }) => {
    if (!batch) return null;
    const students = batch.students?.map(bs => bs.student) || [];
    const mentors = batch.mentors?.map(bm => bm.mentor || bm.user) || [];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="view-batch-modal"
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                {/* Header */}
                <div className="vbm-header">
                    <div>
                        <h2 className="vbm-title">{batch.name}</h2>
                        <span className={`batch-status-badge ${batch.status?.toLowerCase()}`}>{batch.status}</span>
                    </div>
                    <button className="vbm-close-btn" onClick={onClose}><FiX size={20} /></button>
                </div>

                {/* Description */}
                {batch.description && (
                    <p className="vbm-description">{batch.description}</p>
                )}

                {/* Stats row */}
                <div className="vbm-stats-row">
                    <div className="vbm-stat">
                        <FiUsers className="vbm-stat-icon" />
                        <div>
                            <span className="vbm-stat-val">{students.length}</span>
                            <span className="vbm-stat-lbl">Students</span>
                        </div>
                    </div>
                    <div className="vbm-stat">
                        <FiAward className="vbm-stat-icon" />
                        <div>
                            <span className="vbm-stat-val">{mentors.length}</span>
                            <span className="vbm-stat-lbl">Mentors</span>
                        </div>
                    </div>
                </div>

                {/* Mentors */}
                {mentors.length > 0 && (
                    <div className="vbm-section">
                        <h4 className="vbm-section-title">Mentors</h4>
                        <div className="vbm-people-list">
                            {mentors.map((m, i) => m && (
                                <div key={m.id || i} className="vbm-person-row">
                                    <img
                                        src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || 'M')}&background=6366f1&color=fff`}
                                        alt={m.name}
                                        className="vbm-avatar"
                                    />
                                    <div className="vbm-person-info">
                                        <span className="vbm-person-name">{m.name || '—'}</span>
                                        <span className="vbm-person-email">{m.email || ''}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Students */}
                <div className="vbm-section">
                    <h4 className="vbm-section-title">Students ({students.length})</h4>
                    {students.length === 0 ? (
                        <p className="vbm-empty">No students in this batch yet.</p>
                    ) : (
                        <div className="vbm-people-list">
                            {students.map((s, i) => s && (
                                <div key={s.id || i} className="vbm-person-row">
                                    <img
                                        src={s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'S')}&background=8b5cf6&color=fff`}
                                        alt={s.name}
                                        className="vbm-avatar"
                                    />
                                    <div className="vbm-person-info">
                                        <span className="vbm-person-name">{s.name || '—'}</span>
                                        <span className="vbm-person-email">{s.email || ''}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ── BatchManagement ──────────────────────────────────────────────────────────
const BatchManagement = ({ onRefresh }) => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const [viewingBatch, setViewingBatch] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const fetchBatches = async () => {
        try {
            const response = await batchAPI.getAll();
            setBatches(response.data);
        } catch (error) {
            console.error("Failed to fetch batches:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this batch?")) {
            try {
                await batchAPI.delete(id);
                fetchBatches();
                if (onRefresh) onRefresh();
            } catch (error) {
                console.error("Failed to delete batch:", error);
            }
        }
    };

    return (
        <div className="batch-management-container">
            <div className="section-header">
                <h3>Batches</h3>
                <button className="btn-glass-primary" onClick={() => setShowCreateModal(true)}>
                    <FiPlus /> Create Batch
                </button>
            </div>

            {loading ? (
                <div className="loading-spinner-container">
                    <div className="loading-spinner"></div>
                </div>
            ) : batches.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><FiUsers /></div>
                    <h4>No batches created yet</h4>
                    <p>Create a batch to group students and assign mentors.</p>
                </div>
            ) : (
                <div className="batches-container">
                    {batches.map((batch) => (
                        <motion.div
                            key={batch.id}
                            className="enterprise-batch-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Top — Name + Status */}
                            <div className="batch-info-section">
                                <div className="batch-header-row">
                                    <h4 className="batch-title">{batch.name}</h4>
                                    <span className={`batch-status-badge ${batch.status?.toLowerCase()}`}>
                                        {batch.status}
                                    </span>
                                </div>
                                <p className="batch-description-text">
                                    {batch.description || "No description provided."}
                                </p>

                                {/* Student avatars */}
                                <div className="batch-avatars-row">
                                    {batch.students?.slice(0, 5).map(bs => (
                                        <div className="batch-avatar-wrapper" key={bs.student?.id || bs.id}>
                                            <img
                                                src={bs.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(bs.student?.name || 'S')}`}
                                                alt={bs.student?.name}
                                                title={bs.student?.name}
                                                className="batch-avatar-img"
                                            />
                                        </div>
                                    ))}
                                    {(batch.students?.length || 0) > 5 && (
                                        <div className="batch-avatar-more">
                                            +{batch.students.length - 5}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="batch-stats-section">
                                <div className="batch-stat-block">
                                    <div className="stat-icon-bg"><FiUsers className="stat-icon" /></div>
                                    <div className="stat-text-group">
                                        <span className="stat-count">{batch.students?.length || 0}</span>
                                        <span className="stat-label">Students</span>
                                    </div>
                                </div>
                                <div className="batch-stat-block">
                                    <div className="stat-icon-bg"><FiAward className="stat-icon" /></div>
                                    <div className="stat-text-group">
                                        <span className="stat-count">{batch.mentors?.length || 0}</span>
                                        <span className="stat-label">Mentors</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="batch-actions-section">
                                <button
                                    className="btn-batch-primary"
                                    style={{ flex: 1 }}
                                    onClick={(e) => { e.stopPropagation(); setViewingBatch(batch); }}
                                >
                                    <FiEye size={15} /> View
                                </button>
                                <button
                                    className="btn-batch-secondary"
                                    style={{ flex: 1 }}
                                    onClick={(e) => { e.stopPropagation(); setEditingBatch(batch.id); }}
                                >
                                    <FiEdit2 size={15} /> Edit
                                </button>

                                <div className="batch-dropdown-container">
                                    <button
                                        className="btn-batch-context"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveDropdown(activeDropdown === batch.id ? null : batch.id);
                                        }}
                                    >
                                        <FiMoreVertical size={18} />
                                    </button>

                                    <AnimatePresence>
                                        {activeDropdown === batch.id && (
                                            <motion.div
                                                className="batch-context-menu"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <button
                                                    className="dropdown-item delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(batch.id);
                                                        setActiveDropdown(null);
                                                    }}
                                                >
                                                    <FiTrash2 className="dropdown-icon" /> Delete Batch
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <CreateBatchModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { fetchBatches(); if (onRefresh) onRefresh(); }}
                />
            )}

            {editingBatch && (
                <EditBatchModal
                    batchId={editingBatch}
                    onClose={() => setEditingBatch(null)}
                    onSuccess={() => { fetchBatches(); if (onRefresh) onRefresh(); }}
                />
            )}

            <AnimatePresence>
                {viewingBatch && (
                    <ViewBatchModal batch={viewingBatch} onClose={() => setViewingBatch(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default BatchManagement;
