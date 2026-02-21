import { useState } from 'react';
import { adminAPI } from '../../api';
import { FiX, FiUser, FiMail, FiLock, FiPhone, FiCheck, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './Modal.css';

const CreateUserModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await adminAPI.createUser(formData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="glass-modal"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                >
                    <div className="modal-header">
                        <h2>Create New User</h2>
                        <button onClick={onClose} className="modal-close-btn">
                            <FiX size={20} />
                        </button>
                    </div>

                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <motion.div
                                    className="error-message"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        padding: 'var(--space-20)',
                                        borderRadius: '12px',
                                        marginBottom: '20px',
                                        fontSize: 'var(--fs-body)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <FiShield /> {error}
                                </motion.div>
                            )}

                            <div className="form-section">
                                <label className="glass-label">Account Role</label>
                                <div className="role-select-container">
                                    <button
                                        type="button"
                                        className={`role-option ${formData.role === 'STUDENT' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, role: 'STUDENT' })}
                                    >
                                        <FiUser /> Student
                                    </button>
                                    <button
                                        type="button"
                                        className={`role-option ${formData.role === 'MENTOR' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, role: 'MENTOR' })}
                                    >
                                        <FiCheck /> Mentor
                                    </button>
                                    <button
                                        type="button"
                                        className={`role-option ${formData.role === 'ADMIN' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                                    >
                                        <FiShield /> Admin
                                    </button>
                                </div>
                            </div>

                            <div className="glass-form-group">
                                <label className="glass-label">Full Name</label>
                                <div className="glass-input-group">
                                    <input
                                        type="text"
                                        className="glass-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="e.g. John Doe"
                                    />
                                    <FiUser className="glass-input-icon" />
                                </div>
                            </div>

                            <div className="glass-form-group">
                                <label className="glass-label">Email Address</label>
                                <div className="glass-input-group">
                                    <input
                                        type="email"
                                        className="glass-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="john@example.com"
                                    />
                                    <FiMail className="glass-input-icon" />
                                </div>
                            </div>

                            <div className="glass-form-group">
                                <label className="glass-label">Password</label>
                                <div className="glass-input-group">
                                    <input
                                        type="password"
                                        className="glass-input"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                    />
                                    <FiLock className="glass-input-icon" />
                                </div>
                                <small style={{ display: 'block', marginTop: '6px', color: 'var(--color-text-)', fontSize: 'var(--fs-small)' }}>
                                    Password will be securely hashed.
                                </small>
                            </div>

                            <div className="glass-form-group">
                                <label className="glass-label">Phone Number (Optional)</label>
                                <div className="glass-input-group">
                                    <input
                                        type="tel"
                                        className="glass-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 9876543210"
                                    />
                                    <FiPhone className="glass-input-icon" />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-glass-secondary"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-glass-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CreateUserModal;
