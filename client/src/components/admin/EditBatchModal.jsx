import { useState, useEffect } from 'react';
import { batchAPI, adminAPI } from '../../api';
import { FiX, FiCheck, FiSearch, FiTrash2, FiPlus, FiUser, FiZap } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './Modal.css';

const EditBatchModal = ({ batchId, onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('details'); // details, students, mentors
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'ACTIVE'
    });

    const [currentMembers, setCurrentMembers] = useState({ students: [], mentors: [] });
    const [availableStudents, setAvailableStudents] = useState([]);
    const [availableMentors, setAvailableMentors] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [batchRes, studentsRes, mentorsRes] = await Promise.all([
                    batchAPI.getById(batchId),
                    adminAPI.getStudents(),
                    adminAPI.getMentors()
                ]);

                const batch = batchRes.data;
                setFormData({
                    name: batch.name,
                    description: batch.description || '',
                    status: batch.status
                });

                // Map the nested join objects to flat user objects
                setCurrentMembers({
                    students: batch.students.map(bs => bs.student),
                    mentors: batch.mentors.map(bm => bm.mentor)
                });

                setAvailableStudents(studentsRes.data);
                setAvailableMentors(mentorsRes.data);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load batch data");
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, [batchId]);

    const handleUpdateDetails = async () => {
        setLoading(true);
        try {
            await batchAPI.update(batchId, formData);
            onSuccess(); // Refresh parent but keep modal open? Or close? Let's refresh parent.
            alert("Batch details updated successfully!"); // Subtle toast would be better but keeping simple
            setLoading(false);
        } catch (err) {
            setError("Failed to update details");
            setLoading(false);
        }
    };

    const handleAddMember = async (userId, type) => {
        try {
            if (type === 'student') {
                await batchAPI.addStudents(batchId, [userId]);
                // Optimistic update
                const student = availableStudents.find(s => s.id === userId);
                setCurrentMembers(prev => ({ ...prev, students: [...prev.students, student] }));
            } else {
                await batchAPI.addMentors(batchId, [userId]);
                const mentor = availableMentors.find(m => m.id === userId);
                setCurrentMembers(prev => ({ ...prev, mentors: [...prev.mentors, mentor] }));
            }
            onSuccess(); // silent refresh
        } catch (err) {
            console.error("Add failed", err);
            alert("Failed to add member");
        }
    };

    const handleRemoveMember = async (userId, type) => {
        if (!window.confirm("Remove this user from the batch?")) return;
        try {
            if (type === 'student') {
                await batchAPI.removeStudent(batchId, userId);
                setCurrentMembers(prev => ({ ...prev, students: prev.students.filter(s => s.id !== userId) }));
            } else {
                await batchAPI.removeMentor(batchId, userId);
                setCurrentMembers(prev => ({ ...prev, mentors: prev.mentors.filter(m => m.id !== userId) }));
            }
            onSuccess();
        } catch (err) {
            console.error("Remove failed", err);
            alert("Failed to remove member");
        }
    };

    const filterUsers = (users, existingIds) => {
        return users.filter(u =>
            !existingIds.includes(u.id) &&
            (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    };

    return (
        <AnimatePresence>
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="glass-modal large" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
                    <div className="modal-header">
                        <h2>Batch Details</h2>
                        <button onClick={onClose} className="modal-close-btn"><FiX size={20} /></button>
                    </div>

                    <div className="tabs-header" style={{ display: 'flex', gap: '2px', padding: '0 24px', borderBottom: '1px solid #e2e8f0' }}>
                        {['details', 'students', 'mentors'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '16px 20px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                                    color: activeTab === tab ? '#6366f1' : '#64748b',
                                    fontWeight: activeTab === tab ? '600' : '500',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="modal-body">
                        {fetching ? <div className="loading-spinner"></div> : (
                            <div className="tab-content">
                                {activeTab === 'details' && (
                                    <div className="details-form">
                                        <div className="glass-form-group">
                                            <label className="glass-label">Batch Name</label>
                                            <input
                                                className="glass-input"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="glass-form-group">
                                            <label className="glass-label">Status</label>
                                            <div className="role-select-container">
                                                {['ACTIVE', 'INACTIVE', 'COMPLETED'].map(status => (
                                                    <button
                                                        key={status}
                                                        type="button"
                                                        className={`role-option ${formData.status === status ? 'active' : ''}`}
                                                        onClick={() => setFormData({ ...formData, status })}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="glass-form-group">
                                            <label className="glass-label">Description</label>
                                            <textarea
                                                className="glass-input"
                                                rows={4}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                            <button className="btn-glass-primary" onClick={handleUpdateDetails} disabled={loading}>
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {(activeTab === 'students' || activeTab === 'mentors') && (
                                    <div className="members-manager">
                                        <div className="search-bar" style={{ marginBottom: '20px' }}>
                                            <div className="glass-input-group">
                                                <input
                                                    className="glass-input"
                                                    placeholder={`Search to add ${activeTab}...`}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                                <FiSearch className="glass-input-icon" />
                                            </div>
                                        </div>

                                        <div className="split-view" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '300px' }}>
                                            {/* Current Members */}
                                            <div className="current-list" style={{ overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: 'var(--space-20)' }}>
                                                <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text-)', fontSize: 'var(--fs-body)', textTransform: 'uppercase' }}>
                                                    Current {activeTab} ({currentMembers[activeTab].length})
                                                </h4>
                                                {currentMembers[activeTab].map(user => (
                                                    <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <img src={user.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                                            <div>
                                                                <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)' }}>{user.name}</div>
                                                                <div style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)' }}>{user.email}</div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleRemoveMember(user.id, activeTab === 'students' ? 'student' : 'mentor')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                ))}
                                                {currentMembers[activeTab].length === 0 && <p style={{ textAlign: 'center', color: '#cbd5e1', marginTop: '20px' }}>No members yet.</p>}
                                            </div>

                                            {/* Available to Add */}
                                            <div className="add-list" style={{ overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: 'var(--space-20)', background: '#f8fafc' }}>
                                                <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text-)', fontSize: 'var(--fs-body)', textTransform: 'uppercase' }}>
                                                    Available to Add
                                                </h4>
                                                {filterUsers(
                                                    activeTab === 'students' ? availableStudents : availableMentors,
                                                    currentMembers[activeTab].map(u => u.id)
                                                ).map(user => (
                                                    <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'white', borderRadius: '8px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                                            <img src={user.avatar} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                                                                <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)' }}>{user.name}</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleAddMember(user.id, activeTab === 'students' ? 'student' : 'mentor')}
                                                            style={{ border: 'none', background: '#eff6ff', color: '#3b82f6', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' }}
                                                        >
                                                            Add +
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditBatchModal;
