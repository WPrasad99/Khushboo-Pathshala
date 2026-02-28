import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useUploadSession, useUploadResource, useMentorUploads, useDeleteUpload, useMentorBatches } from '../../../hooks/mentor/useMentorQueries';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { getApiErrorMessage } from '../../../api';
import { FileUp, File, Video, Trash2, Filter, Plus, Calendar, CloudUpload, MoreVertical } from 'lucide-react';

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
                style={{ zIndex: 1000 }}
            >
                <motion.div
                    className="glass-modal"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: '500px', width: '95%', borderRadius: 'var(--radius-2xl)' }}
                >
                    <div className="modal-header" style={{ padding: 'var(--space-20) var(--space-24)' }}>
                        <h2 style={{ fontSize: 'var(--fs-h3)', margin: 0 }}>{isSession ? 'Create Video Session' : 'Upload Resource'}</h2>
                        <button type="button" className="m-btn m-btn--ghost" onClick={onClose} aria-label="Close" style={{ padding: '8px', minHeight: 'unset' }}>
                            <FiX size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                        <div className="modal-body" style={{ padding: 'var(--space-24)' }}>
                            {error && (
                                <div className="m-badge m-badge--error" style={{ width: '100%', marginBottom: 'var(--space-16)', padding: 'var(--space-12)', borderRadius: 'var(--radius-md)', justifyContent: 'center' }}>
                                    {error}
                                </div>
                            )}

                            <div className="m-form-group" style={{ marginBottom: 'var(--space-16)' }}>
                                <label style={{ display: 'block', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-8)', color: 'var(--text-secondary)' }}>Assign to Batch *</label>
                                <select
                                    className="m-select"
                                    value={batchId}
                                    onChange={(e) => setBatchId(e.target.value)}
                                    required
                                    style={{ width: '100%' }}
                                >
                                    <option value="">Select a batch...</option>
                                    {(batches || []).map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="m-form-group" style={{ marginBottom: 'var(--space-16)' }}>
                                <label style={{ display: 'block', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-8)', color: 'var(--text-secondary)' }}>Resource Title *</label>
                                <input
                                    type="text"
                                    className="m-search-input"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={isSession ? 'e.g. React Fundamentals' : 'e.g. Weekly Homework'}
                                    required
                                    style={{ width: '100%', paddingLeft: 'var(--space-16)' }}
                                />
                            </div>

                            <div className="m-form-group" style={{ marginBottom: 'var(--space-16)' }}>
                                <label style={{ display: 'block', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-8)', color: 'var(--text-secondary)' }}>Detailed Description</label>
                                <textarea
                                    className="m-search-input"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Briefly explain what this resource covers..."
                                    rows={3}
                                    style={{ width: '100%', padding: 'var(--space-12) var(--space-16)', minHeight: '100px', resize: 'none' }}
                                />
                            </div>

                            {isSession ? (
                                <div className="m-form-group">
                                    <label style={{ display: 'block', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-8)', color: 'var(--text-secondary)' }}>YouTube Embed Link *</label>
                                    <input
                                        type="url"
                                        className="m-search-input"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        required
                                        style={{ width: '100%', paddingLeft: 'var(--space-16)' }}
                                    />
                                </div>
                            ) : (
                                <div className="m-form-group">
                                    <label style={{ display: 'block', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-8)', color: 'var(--text-secondary)' }}>Select Document *</label>
                                    <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-32)', textAlign: 'center', transition: 'all 0.2s' }} className="upload-dropzone">
                                        <CloudUpload size={32} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-12)' }} />
                                        <input
                                            type="file"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            id="file-upload"
                                            className="visually-hidden"
                                            required={!isSession}
                                        />
                                        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                                            <span style={{ color: 'var(--color-primary)', fontWeight: 'var(--fw-semibold)' }}>{file ? file.name : 'Click to upload'}</span>
                                            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-4)' }}>PDF, DOCX, ZIP up to 50MB</p>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions" style={{ padding: 'var(--space-20) var(--space-24)', borderTop: '1px solid var(--color-border)' }}>
                            <button type="button" className="m-btn m-btn--ghost" onClick={onClose}>
                                Save Draft
                            </button>
                            <button type="submit" className="m-btn m-btn--primary" disabled={loading} style={{ marginLeft: 'auto' }}>
                                {loading ? 'Uploading...' : 'Publish Resource'}
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
        if (!window.confirm('Are you sure you want to permanently delete this resource?')) return;
        try {
            await deleteUpload.mutateAsync(id);
        } catch (err) {
            console.error('Delete operation failed:', err);
        }
    };

    if (isError) {
        return (
            <div className="m-section">
                <div className="m-empty-state">
                    <CloudUpload size={48} style={{ opacity: 0.2 }} />
                    <h3 className="m-empty-state__title">Library Sync Error</h3>
                    <p className="m-empty-state__desc">We were unable to load your learning library. Please check your permissions.</p>
                    <button className="m-btn m-btn--primary" onClick={() => window.location.reload()}>Retry Library Sync</button>
                </div>
            </div>
        );
    }

    return (
        <div className="m-section">
            <header className="mentor-page-header">
                <div>
                    <h2 className="mentor-page-title">Learning Library</h2>
                    <p className="mentor-page-subtitle">Curate and share educational content, video recordings, and study materials.</p>
                </div>
                <div className="mentor-header-actions">
                    <button className="m-btn m-btn--primary" onClick={() => setShowUploadModal(true)}>
                        <Plus size={18} />
                        Create Content
                    </button>
                </div>
            </header>

            <div className="m-card" style={{ padding: 'var(--space-16)', marginBottom: 'var(--space-8)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
                    <button
                        className={`m-btn ${uploadType === 'SESSION' ? 'm-btn--primary' : 'm-btn--ghost'}`}
                        onClick={() => setUploadType('SESSION')}
                        style={{ minHeight: '34px', background: uploadType === 'SESSION' ? 'var(--color-primary)' : 'transparent' }}
                    >
                        <Video size={16} />
                        Video Sessions
                    </button>
                    <button
                        className={`m-btn ${uploadType === 'RESOURCE' ? 'm-btn--primary' : 'm-btn--ghost'}`}
                        onClick={() => setUploadType('RESOURCE')}
                        style={{ minHeight: '34px', background: uploadType === 'RESOURCE' ? 'var(--color-primary)' : 'transparent' }}
                    >
                        <File size={16} />
                        Study Materials
                    </button>
                </div>
            </div>

            <div className="m-grid-3">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="m-skeleton m-skeleton--h200" />
                    ))
                ) : uploads.length > 0 ? (
                    uploads.map((resource, idx) => (
                        <motion.div
                            key={resource.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.04 }}
                            className="m-card m-card--interactive"
                            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}
                        >
                            <div className="resource-card__head" style={{ marginBottom: 0 }}>
                                <div className={`resource-card__icon-wrap ${resource.type !== 'SESSION' ? 'resource-card__icon-wrap--doc' : ''}`} style={{ width: '40px', height: '40px' }}>
                                    {resource.type === 'SESSION' ? <Video size={18} /> : <File size={18} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span className="resource-card__title" style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 'var(--fw-semibold)' }}>{resource.title}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <div className="m-badge m-badge--info" style={{ fontSize: '10px', padding: '1px 6px' }}>{resource.batch?.name || 'Batch Default'}</div>
                                    </div>
                                </div>
                            </div>

                            <p className="resource-card__desc" style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-body)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {resource.description || 'No detailed description provided for this learning material.'}
                            </p>

                            <div className="resource-card__footer" style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-12)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px' }}>
                                    <Calendar size={12} />
                                    <span>Added {new Date(resource.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="m-btn m-btn--ghost"
                                        onClick={(e) => handleDelete(e, resource.id)}
                                        style={{ color: 'var(--color-error)', minHeight: 'unset', padding: '6px' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button className="m-btn m-btn--ghost" style={{ minHeight: 'unset', padding: '6px' }}>
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="m-empty-state">
                        <div style={{ background: 'var(--color-surface-muted)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-16)' }}>
                            <FileUp size={36} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <h3 className="m-empty-state__title">Empty Library</h3>
                        <p className="m-empty-state__desc">
                            You haven't uploaded any {uploadType === 'SESSION' ? 'video sessions' : 'study materials'} to the library yet.
                        </p>
                        <button className="m-btn m-btn--primary" onClick={() => setShowUploadModal(true)}>
                            Start Your First Upload
                        </button>
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
