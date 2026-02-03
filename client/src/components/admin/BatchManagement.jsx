import { useState, useEffect } from 'react';
import { batchAPI } from '../../api';
import { FiPlus, FiTrash2, FiUsers, FiAward, FiMoreVertical } from 'react-icons/fi';
import CreateBatchModal from './CreateBatchModal';
import EditBatchModal from './EditBatchModal';
import { motion } from 'framer-motion';

const BatchManagement = ({ onRefresh }) => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);

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
                <div className="batches-grid">
                    {batches.map((batch) => (
                        <motion.div
                            key={batch.id}
                            className="batch-card glass-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setEditingBatch(batch.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="batch-header">
                                <div>
                                    <h4 className="batch-name">{batch.name}</h4>
                                    <span className={`batch-status ${batch.status.toLowerCase()}`}>{batch.status}</span>
                                </div>
                                <div className="batch-actions" onClick={(e) => e.stopPropagation()}>
                                    <button className="btn-icon-sm" onClick={() => handleDelete(batch.id)}>
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>

                            <p className="batch-description">{batch.description || "No description provided."}</p>

                            <div className="batch-stats">
                                <div className="batch-stat">
                                    <FiUsers />
                                    <span>{batch.students?.length || 0} Students</span>
                                </div>
                                <div className="batch-stat">
                                    <FiAward />
                                    <span>{batch.mentors?.length || 0} Mentors</span>
                                </div>
                            </div>

                            <div className="batch-avatars">
                                {batch.students?.slice(0, 5).map(bs => (
                                    <img
                                        key={bs.student.id}
                                        src={bs.student.avatar || `https://ui-avatars.com/api/?name=${bs.student.name}`}
                                        alt={bs.student.name}
                                        title={bs.student.name}
                                    />
                                ))}
                                {(batch.students?.length || 0) > 5 && (
                                    <div className="more-avatars">+{batch.students.length - 5}</div>
                                )}
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
