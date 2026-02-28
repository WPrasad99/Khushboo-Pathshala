import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useUploadSession, useUploadResource, useMentorUploads, useDeleteUpload, useMentorBatches } from '../../../hooks/mentor/useMentorQueries';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { getApiErrorMessage } from '../../../api';
import { FileUp, File, Video, Trash2 } from 'lucide-react';

const UploadModal = ({ isSession, batches, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [batchId, setBatchId] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const uploadSession = useUploadSession();
    const uploadResource = useUploadResource();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSession) {
                if (!videoUrl) {
                    setError('Please provide a valid YouTube URL');
                    setLoading(false);
                    return;
                }
                await uploadSession.mutateAsync({ title, description, batchId, videoUrl });
            } else {
                if (!file) {
                    setError('Please select a file to upload');
                    setLoading(false);
                    return;
                }
                const formData = new FormData();
                formData.append('title', title);
                formData.append('description', description);
                formData.append('batchId', batchId);
                formData.append('category', 'GENERAL');
                formData.append('file', file);
                await uploadResource.mutateAsync(formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to upload. Please try again.'));
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
                        <h2>{isSession ? 'Upload Video Session' : 'Upload Resource'}</h2>
                        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
                            <FiX size={20} />
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
                                        value={batchId}
                                        onChange={(e) => setBatchId(e.target.value)}
                                        required
                                        style={{ paddingRight: '16px' }}
                                    >
                                        <option value="">Select batch...</option>
                                        {(batches || []).map((b) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {batches?.length === 0 && (
                                    <small style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4, display: 'block' }}>
                                        You have no batches assigned. Contact admin to get assigned to a batch.
                                    </small>
                                )}
                            </div>

                            <div className="glass-form-group">
                                <label className="glass-label">Title *</label>
                                <div className="glass-input-group">
                                    <input
                                        type="text"
                                        className="glass-input"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={isSession ? 'e.g. Introduction to React' : 'e.g. Course Notes'}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="glass-form-group">
                                <label className="glass-label">Description</label>
                                <div className="glass-input-group">
                                    <textarea
                                        className="glass-input"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Brief description..."
                                        rows={3}
                                        style={{ resize: 'vertical', paddingLeft: '16px' }}
                                    />
                                </div>
                            </div>

                            {isSession ? (
                                <div className="glass-form-group">
                                    <label className="glass-label">YouTube URL *</label>
                                    <div className="glass-input-group">
                                        <input
                                            type="url"
                                            className="glass-input"
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            required
                                        />
                                    </div>
                                    <small style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, display: 'block' }}>
                                        Paste a valid YouTube video URL format
                                    </small>
                                </div>
                            ) : (
                                <div className="glass-form-group">
                                    <label className="glass-label">File (PDF, DOC, DOCX, etc.) *</label>
                                    <div className="glass-input-group">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png,.gif"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', outline: 'none' }}
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="m-btn m-btn--secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="m-btn m-btn--primary" disabled={loading}>
                                {loading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

const SessionsList = () => {
    const [uploadType, setUploadType] = useState('SESSION');
    const [showUploadModal, setShowUploadModal] = useState(false);

    const { data: uploadsData, isLoading, isError } = useMentorUploads(uploadType);
    const { data: batchesData } = useMentorBatches();
    const deleteUpload = useDeleteUpload();

    const uploads = Array.isArray(uploadsData) ? uploadsData : [];
    const batches = Array.isArray(batchesData) ? batchesData : [];

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Delete this resource?')) return;
        try {
            await deleteUpload.mutateAsync(id);
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    if (isError) {
        return (
            <div className="m-section">
                <div className="m-empty-state">
                    <h3 className="m-empty-state__title">Failed to load resources</h3>
                    <p className="m-empty-state__desc">Please refresh the page or try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="m-section">
            <div className="mentor-page-header">
                <h2 className="mentor-page-title">Learning Resources</h2>
                <div className="mentor-header-actions">
                    <select
                        className="m-select"
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value)}
                    >
                        <option value="SESSION">Video Sessions</option>
                        <option value="RESOURCE">Documents / PDFs</option>
                    </select>

                    <button className="m-btn m-btn--primary" onClick={() => setShowUploadModal(true)}>
                        <FileUp size={18} /> Upload New
                    </button>
                </div>
            </div>

            <div className="m-grid-3">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="m-skeleton m-skeleton--h200" />
                    ))
                ) : uploads.length > 0 ? (
                    uploads.map((resource) => (
                        <div key={resource.id} className="m-card m-card--interactive">
                            <div className="resource-card__head">
                                <div className={`resource-card__icon-wrap ${resource.type !== 'SESSION' ? 'resource-card__icon-wrap--doc' : ''}`}>
                                    {resource.type === 'SESSION' ? <Video size={20} /> : <File size={20} />}
                                </div>
                                <span className="resource-card__title">{resource.title}</span>
                            </div>
                            <p className="resource-card__desc">{resource.description}</p>
                            <div className="resource-card__footer">
                                <span className="resource-card__date">{new Date(resource.createdAt).toLocaleDateString()}</span>
                                <button className="resource-card__delete" title="Delete" onClick={(e) => handleDelete(e, resource.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="m-empty-state" style={{ gridColumn: '1 / -1' }}>
                        <FileUp size={48} />
                        <h3 className="m-empty-state__title">No Resources Uploaded</h3>
                        <p className="m-empty-state__desc">
                            You have not uploaded any {uploadType === 'SESSION' ? 'video sessions' : 'documents'} yet.
                        </p>
                        <button className="m-btn m-btn--primary" onClick={() => setShowUploadModal(true)}>Upload First Resource</button>
                    </div>
                )}
            </div>

            {showUploadModal && (
                <UploadModal
                    isSession={uploadType === 'SESSION'}
                    batches={batches}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => { }}
                />
            )}
        </div>
    );
};

export default SessionsList;
