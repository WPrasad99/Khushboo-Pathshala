import { useState, useEffect } from 'react';
import { batchAPI, adminAPI } from '../../api';
import './AdminPages.css';

export default function Batches() {
    const [batches, setBatches] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        mentorId: '',
        isActive: true
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [batchesRes, mentorsRes] = await Promise.all([
                batchAPI.getAllBatches(),
                adminAPI.getMentors()
            ]);
            setBatches(batchesRes.data);
            setMentors(mentorsRes.data);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.name || !formData.mentorId) {
            setError('Name and mentor are required');
            return;
        }

        try {
            if (editingBatch) {
                await batchAPI.updateBatch(editingBatch.id, formData);
                setSuccess('Batch updated successfully');
            } else {
                await batchAPI.createBatch(formData);
                setSuccess('Batch created successfully');
            }
            await fetchData();
            closeModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (batch) => {
        if (!window.confirm(`Are you sure you want to delete "${batch.name}"?`)) return;

        try {
            await batchAPI.deleteBatch(batch.id);
            setSuccess('Batch deleted successfully');
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete batch');
        }
    };

    const handleToggleActive = async (batch) => {
        try {
            await batchAPI.updateBatch(batch.id, { isActive: !batch.isActive });
            await fetchData();
            setSuccess(`Batch ${batch.isActive ? 'deactivated' : 'activated'} successfully`);
        } catch (err) {
            setError('Failed to update batch status');
        }
    };

    const openCreateModal = () => {
        setEditingBatch(null);
        setFormData({ name: '', description: '', mentorId: '', isActive: true });
        setShowModal(true);
    };

    const openEditModal = (batch) => {
        setEditingBatch(batch);
        setFormData({
            name: batch.name,
            description: batch.description || '',
            mentorId: batch.mentorId,
            isActive: batch.isActive
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingBatch(null);
        setFormData({ name: '', description: '', mentorId: '', isActive: true });
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="loading-spinner">Loading batches...</div>
            </div>
        );
    }

    return (
        <div className="admin-page batches-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">
                        <span className="title-icon">📦</span>
                        Batch Management
                    </h1>
                    <p className="page-subtitle">Create and manage student batches with mentor assignments</p>
                </div>
                <button className="btn-primary create-btn" onClick={openCreateModal}>
                    <span className="btn-icon">➕</span>
                    Create New Batch
                </button>
            </div>

            {/* Status Messages */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Stats Summary */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <div className="stat-value">{batches.length}</div>
                        <div className="stat-label">Total Batches</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{batches.filter(b => b.isActive).length}</div>
                        <div className="stat-label">Active Batches</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-value">{batches.reduce((sum, b) => sum + (b.studentCount || 0), 0)}</div>
                        <div className="stat-label">Total Students</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">👨‍🏫</div>
                    <div className="stat-content">
                        <div className="stat-value">{mentors.length}</div>
                        <div className="stat-label">Available Mentors</div>
                    </div>
                </div>
            </div>

            {/* Batches Grid */}
            <div className="batches-grid">
                {batches.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No Batches Yet</h3>
                        <p>Create your first batch to start organizing students</p>
                        <button className="btn-primary" onClick={openCreateModal}>
                            Create First Batch
                        </button>
                    </div>
                ) : (
                    batches.map(batch => (
                        <div key={batch.id} className={`batch-card ${!batch.isActive ? 'inactive' : ''}`}>
                            <div className="batch-header">
                                <div className="batch-status-badge">
                                    {batch.isActive ? (
                                        <span className="status-active">Active</span>
                                    ) : (
                                        <span className="status-inactive">Inactive</span>
                                    )}
                                </div>
                                <div className="batch-actions">
                                    <button
                                        className="btn-icon-small"
                                        onClick={() => openEditModal(batch)}
                                        title="Edit Batch"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className={`btn-icon-small ${batch.isActive ? 'btn-warning' : 'btn-success'}`}
                                        onClick={() => handleToggleActive(batch)}
                                        title={batch.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {batch.isActive ? '⏸️' : '▶️'}
                                    </button>
                                    <button
                                        className="btn-icon-small btn-danger"
                                        onClick={() => handleDelete(batch)}
                                        title="Delete Batch"
                                        disabled={batch.studentCount > 0}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <h3 className="batch-name">{batch.name}</h3>
                            {batch.description && (
                                <p className="batch-description">{batch.description}</p>
                            )}

                            <div className="batch-meta">
                                <div className="meta-item">
                                    <span className="meta-icon">👨‍🏫</span>
                                    <div className="meta-content">
                                        <span className="meta-label">Mentor</span>
                                        <span className="meta-value">{batch.mentor?.name || 'Not Assigned'}</span>
                                    </div>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-icon">👥</span>
                                    <div className="meta-content">
                                        <span className="meta-label">Students</span>
                                        <span className="meta-value">{batch.studentCount || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="batch-footer">
                                <span className="created-at">
                                    Created: {new Date(batch.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content batch-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingBatch ? 'Edit Batch' : 'Create New Batch'}</h2>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="batch-form">
                            <div className="form-group">
                                <label htmlFor="name">Batch Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Khushboo Batch 2024 – Phase 1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of this batch..."
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="mentorId">Assigned Mentor *</label>
                                <select
                                    id="mentorId"
                                    value={formData.mentorId}
                                    onChange={(e) => setFormData({ ...formData, mentorId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a mentor...</option>
                                    {mentors.map(mentor => (
                                        <option key={mentor.id} value={mentor.id}>
                                            {mentor.name} ({mentor.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span className="checkbox-text">
                                        Batch is Active
                                        <small>(Students can log in only when batch is active)</small>
                                    </span>
                                </label>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingBatch ? 'Update Batch' : 'Create Batch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
