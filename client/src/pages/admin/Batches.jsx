import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { FiTrash2, FiPlus, FiX, FiEdit2, FiUsers, FiUserPlus } from 'react-icons/fi';
import './AdminPages.css';

const Batches = () => {
    const [batches, setBatches] = useState([]);
    const [users, setUsers] = useState([]); // Needed for mentor/student selection
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [currentBatch, setCurrentBatch] = useState({
        name: '',
        mentorId: '',
        studentIds: []
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchBatchesAndUsers();
    }, []);

    const fetchBatchesAndUsers = async () => {
        try {
            const [batchesRes, usersRes] = await Promise.all([
                adminAPI.getBatches(),
                adminAPI.getUsers()
            ]);
            setBatches(batchesRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        try {
            const response = await adminAPI.createBatch(currentBatch);
            // If students were selected during create, we might need a separate update call 
            // OR update backend to handle students in CREATE. 
            // My backend implementation for CREATE only handled mentorId.
            // Let's stick to simple create first, then edit to add students.
            // Wait, I can update the backend logic or just do two calls. Ugh.
            // Let's assume CREATE handles basic info.

            // To be safe, if studentIds has length, I should call update immediately.
            if (currentBatch.studentIds.length > 0) {
                await adminAPI.updateBatch(response.data.id, { studentIds: currentBatch.studentIds });
                // Refetch to get full data
                const updated = await adminAPI.getBatches();
                setBatches(updated.data);
            } else {
                setBatches([response.data, ...batches]);
            }

            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Failed to create batch:', error);
            alert('Failed to create batch.');
        }
    };

    const handleUpdateBatch = async (e) => {
        e.preventDefault();
        try {
            const response = await adminAPI.updateBatch(editingId, currentBatch);
            setBatches(batches.map(b => b.id === editingId ? response.data : b));
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Failed to update batch:', error);
            alert('Failed to update batch.');
        }
    };

    const handleDeleteBatch = async (id) => {
        if (window.confirm('Are you sure you want to delete this batch?')) {
            try {
                await adminAPI.deleteBatch(id);
                setBatches(batches.filter(b => b.id !== id));
            } catch (error) {
                console.error('Failed to delete batch:', error);
                alert('Failed to delete batch.');
            }
        }
    };

    const openCreateModal = () => {
        resetForm();
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (batch) => {
        setCurrentBatch({
            name: batch.name,
            mentorId: batch.mentor?.id || '',
            studentIds: batch.students?.map(s => s.id) || []
        });
        setEditingId(batch.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setCurrentBatch({ name: '', mentorId: '', studentIds: [] });
        setEditingId(null);
    };

    const mentors = users.filter(u => u.role === 'MENTOR');
    const students = users.filter(u => u.role === 'STUDENT');

    // Helper to toggle student selection
    const toggleStudent = (studentId) => {
        const currentIds = currentBatch.studentIds;
        if (currentIds.includes(studentId)) {
            setCurrentBatch({ ...currentBatch, studentIds: currentIds.filter(id => id !== studentId) });
        } else {
            setCurrentBatch({ ...currentBatch, studentIds: [...currentIds, studentId] });
        }
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1>Batch Management</h1>
                    <div className="header-stats" style={{ marginTop: '0.5rem' }}>
                        <span className="stat">Total Batches: {batches.length}</span>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={openCreateModal}>
                        <FiPlus /> Create Batch
                    </button>
                </div>
            </div>

            <div className="batches-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {loading ? (
                    <div>Loading batches...</div>
                ) : batches.length === 0 ? (
                    <div>No batches found. Create one to get started.</div>
                ) : (
                    batches.map(batch => (
                        <div key={batch.id} className="batch-card" style={{
                            background: 'white',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: 0, fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)' }}>{batch.name}</h3>
                                <div className="action-buttons">
                                    <button className="btn-icon" onClick={() => openEditModal(batch)} title="Edit">
                                        <FiEdit2 />
                                    </button>
                                    <button className="btn-icon delete" onClick={() => handleDeleteBatch(batch.id)} title="Delete">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                    <FiUserPlus size={16} />
                                    <span style={{ fontSize: 'var(--fs-body)' }}>Mentor:</span>
                                    <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-primary)' }}>
                                        {batch.mentor ? batch.mentor.name : 'Unassigned'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                    <FiUsers size={16} />
                                    <span style={{ fontSize: 'var(--fs-body)' }}>Students:</span>
                                    <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-primary)' }}>
                                        {batch.students ? batch.students.length : 0}
                                    </span>
                                </div>
                            </div>

                            {batch.students && batch.students.length > 0 && (
                                <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
                                    {batch.students.slice(0, 5).map(s => (
                                        <img
                                            key={s.id}
                                            src={s.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + s.id}
                                            alt={s.name}
                                            style={{
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                border: '2px solid white', marginLeft: '-8px'
                                            }}
                                            title={s.name}
                                        />
                                    ))}
                                    {batch.students.length > 5 && (
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            border: '2px solid white', marginLeft: '-8px',
                                            background: '#f3f4f6', fontSize: 'var(--fs-small)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--fw-semibold)'
                                        }}>
                                            +{batch.students.length - 5}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{isEditing ? 'Edit Batch' : 'Create Batch'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={isEditing ? handleUpdateBatch : handleCreateBatch}>
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="form-group">
                                    <label>Batch Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentBatch.name}
                                        onChange={e => setCurrentBatch({ ...currentBatch, name: e.target.value })}
                                        placeholder="e.g. Batch A - 2024"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Assign Mentor</label>
                                    <select
                                        value={currentBatch.mentorId}
                                        onChange={e => setCurrentBatch({ ...currentBatch, mentorId: e.target.value })}
                                    >
                                        <option value="">-- Select Mentor --</option>
                                        {mentors.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Select Students ({currentBatch.studentIds.length} selected)</label>
                                    <div style={{
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        padding: '0.5rem'
                                    }}>
                                        {students.length === 0 ? (
                                            <div style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>No students available.</div>
                                        ) : (
                                            students.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => toggleStudent(s.id)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        borderBottom: '1px solid #f3f4f6',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        cursor: 'pointer',
                                                        background: currentBatch.studentIds.includes(s.id) ? 'var(--primary-light)' : 'transparent'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={currentBatch.studentIds.includes(s.id)}
                                                        onChange={() => { }} // handled by div click
                                                        style={{ width: 'auto' }}
                                                    />
                                                    <img src={s.avatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                                    <span style={{ fontSize: 'var(--fs-body)' }}>{s.name}</span>
                                                    <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{s.email}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">{isEditing ? 'Update Batch' : 'Create Batch'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Batches;
