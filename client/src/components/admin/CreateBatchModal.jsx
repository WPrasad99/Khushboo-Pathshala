import { useState, useEffect } from 'react';
import { batchAPI, adminAPI } from '../../api';
import { FiX, FiLayers, FiUsers, FiAward, FiCheck, FiSearch, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './Modal.css';

const CreateBatchModal = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        studentIds: [],
        mentorIds: []
    });

    const [availableStudents, setAvailableStudents] = useState([]);
    const [availableMentors, setAvailableMentors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsRes, mentorsRes] = await Promise.all([
                    adminAPI.getStudents(),
                    adminAPI.getMentors()
                ]);
                setAvailableStudents(studentsRes.data);
                setAvailableMentors(mentorsRes.data);
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await batchAPI.create(formData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create batch');
            setLoading(false);
        }
    };

    const toggleSelection = (id, type) => {
        const field = type === 'student' ? 'studentIds' : 'mentorIds';
        const current = formData[field];
        const updated = current.includes(id)
            ? current.filter(item => item !== id)
            : [...current, id];
        setFormData({ ...formData, [field]: updated });
    };

    const filterUsers = (users) => {
        return users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="step-content"
                    >
                        <div className="form-section">
                            <label className="form-label">Batch Name</label>
                            <div className="glass-input-group">
                                <input
                                    type="text"
                                    className="glass-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Full Stack 2024"
                                    autoFocus
                                />
                                <FiLayers className="glass-input-icon" />
                            </div>
                        </div>
                        <div className="form-section">
                            <label className="form-label">Description</label>
                            <div className="glass-input-group">
                                <textarea
                                    className="glass-input"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Batch description..."
                                    rows={4}
                                    style={{ paddingLeft: '16px' }}
                                />
                            </div>
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="step-content"
                    >
                        <div className="glass-input-group" style={{ marginBottom: '20px' }}>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <FiSearch className="glass-input-icon" />
                        </div>
                        <div className="selection-grid">
                            {filterUsers(availableStudents).map(student => (
                                <div
                                    key={student.id}
                                    className={`user-card-select ${formData.studentIds.includes(student.id) ? 'selected' : ''}`}
                                    onClick={() => toggleSelection(student.id, 'student')}
                                >
                                    <img
                                        src={student.avatar || `https://ui-avatars.com/api/?name=${student.name}`}
                                        alt=""
                                        style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                                    />
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{student.email}</div>
                                    </div>
                                    <div className="selection-check">
                                        {formData.studentIds.includes(student.id) && <FiCheck />}
                                    </div>
                                </div>
                            ))}
                            {filterUsers(availableStudents).length === 0 && (
                                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No students found.</p>
                            )}
                        </div>
                        <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.9rem', textAlign: 'right' }}>
                            {formData.studentIds.length} students selected
                        </p>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="step-content"
                    >
                        <div className="glass-input-group" style={{ marginBottom: '20px' }}>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="Search mentors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <FiSearch className="glass-input-icon" />
                        </div>
                        <div className="selection-grid">
                            {filterUsers(availableMentors).map(mentor => (
                                <div
                                    key={mentor.id}
                                    className={`user-card-select ${formData.mentorIds.includes(mentor.id) ? 'selected' : ''}`}
                                    onClick={() => toggleSelection(mentor.id, 'mentor')}
                                >
                                    <img
                                        src={mentor.avatar || `https://ui-avatars.com/api/?name=${mentor.name}`}
                                        alt=""
                                        style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                                    />
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mentor.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{mentor.email}</div>
                                    </div>
                                    <div className="selection-check">
                                        {formData.mentorIds.includes(mentor.id) && <FiCheck />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.9rem', textAlign: 'right' }}>
                            {formData.mentorIds.length} mentors selected
                        </p>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                    className="glass-modal large"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                >
                    <div className="modal-header">
                        <h2>Create New Batch</h2>
                        <button onClick={onClose} className="modal-close-btn"><FiX size={20} /></button>
                    </div>

                    <div className="wizard-progress">
                        <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            <div className="step-circle">{step > 1 ? <FiCheck /> : '1'}</div>
                            <span>Details</span>
                        </div>
                        <div className="steps-connector" style={{ flex: 1, height: '2px', background: '#e2e8f0', margin: '0 16px', alignSelf: 'center' }} />
                        <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                            <div className="step-circle">{step > 2 ? <FiCheck /> : '2'}</div>
                            <span>Students</span>
                        </div>
                        <div className="steps-connector" style={{ flex: 1, height: '2px', background: '#e2e8f0', margin: '0 16px', alignSelf: 'center' }} />
                        <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                            <div className="step-circle">{step > 3 ? <FiCheck /> : '3'}</div>
                            <span>Mentors</span>
                        </div>
                    </div>

                    <div className="modal-body" style={{ flex: 1 }}>
                        {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                        {fetching ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                <div className="loading-spinner"></div>
                            </div>
                        ) : renderStepContent()}
                    </div>

                    <div className="modal-actions" style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)} className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', items: 'center', gap: '8px' }}>
                                <FiChevronLeft /> Back
                            </button>
                        ) : (
                            <button onClick={onClose} className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '12px' }}>
                                Cancel
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={() => { setSearchQuery(''); setStep(step + 1); }}
                                className="btn-primary"
                                disabled={!formData.name}
                                style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', items: 'center', gap: '8px', background: '#4f46e5' }}
                            >
                                Next <FiChevronRight />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="btn-primary"
                                disabled={loading}
                                style={{ padding: '12px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
                            >
                                {loading ? 'Creating...' : 'Create Batch'}
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CreateBatchModal;
