import { useState, useEffect } from 'react';
import { batchAPI } from '../../api';
import { FiPlus, FiTrash2, FiUsers, FiAward, FiEye, FiMoreVertical, FiEdit2 } from 'react-icons/fi';
import CreateBatchModal from './CreateBatchModal';
import EditBatchModal from './EditBatchModal';
import { motion, AnimatePresence } from 'framer-motion';

const BatchManagement = ({ onRefresh }) => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
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
                fetchBatches(); // Refresh local list
                if (onRefresh) onRefresh(); // Refresh global dashboard data
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
                            transition={{ duration: 0.4 }}
                        >
                            {/* LEFT SECTION (Primary Info) */}
                            <div className="batch-info-section">
                                <div className="batch-header-row">
                                    <h4 className="batch-title">{batch.name}</h4>
                                    <span className={`batch-status-badge ${batch.status.toLowerCase()}`}>
                                        {batch.status}
                                    </span>
                                </div>
                                <p className="batch-description-text">
                                    {batch.description || "No description provided. This batch represents a cohort of students undergoing specific mentorship and training."}
                                </p>

                                <div className="batch-avatars-row">
                                    {batch.students?.slice(0, 5).map(bs => (
                                        <div className="batch-avatar-wrapper" key={bs.student.id}>
                                            <img
                                                src={bs.student.avatar || `https://ui-avatars.com/api/?name=${bs.student.name}`}
                                                alt={bs.student.name}
                                                title={bs.student.name}
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

                            {/* CENTER SECTION (Analytics Snapshot) */}
                            <div className="batch-stats-section">
                                <div className="batch-stat-block">
                                    <div className="stat-icon-bg">
                                        <FiUsers className="stat-icon" />
                                    </div>
                                    <div className="stat-text-group">
                                        <span className="stat-count">{batch.students?.length || 0}</span>
                                        <span className="stat-label">Total Students</span>
                                    </div>
                                </div>
                                <div className="batch-stat-block">
                                    <div className="stat-icon-bg">
                                        <FiAward className="stat-icon" />
                                    </div>
                                    <div className="stat-text-group">
                                        <span className="stat-count">{batch.mentors?.length || 0}</span>
                                        <span className="stat-label">Mentors Assigned</span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SECTION (Actions) */}
                            <div className="batch-actions-section">
                                <button className="btn-batch-primary" onClick={(e) => { e.stopPropagation(); /* Handle View */ }}>
                                    <FiEye size={16} /> View Batch
                                </button>
                                <button className="btn-batch-secondary" onClick={(e) => { e.stopPropagation(); setEditingBatch(batch.id); }}>
                                    <FiEdit2 size={16} /> Edit
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
                                                <button className="dropdown-item delete" onClick={(e) => { e.stopPropagation(); handleDelete(batch.id); setActiveDropdown(null); }}>
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

            {showCreateModal && (
                <CreateBatchModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        fetchBatches();
                        if (onRefresh) onRefresh();
                    }}
                />
            )}

            {editingBatch && (
                <EditBatchModal
                    batchId={editingBatch}
                    onClose={() => setEditingBatch(null)}
                    onSuccess={() => {
                        fetchBatches();
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </div>
    );
};

export default BatchManagement;
