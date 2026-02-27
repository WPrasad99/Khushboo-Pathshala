import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../api';
import { FiBook, FiUsers, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './Auth.css';

const RoleSelection = ({ mode = 'register' }) => {
    const [selectedRole, setSelectedRole] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: credentials, 2: role selection

    const { register } = useAuth();
    const navigate = useNavigate();

    const roles = [
        {
            id: 'STUDENT',
            title: 'Student',
            description: 'Learn and engage with resources and mentorship.',
            icon: <FiBook />
        },
        {
            id: 'MENTOR',
            title: 'Mentor',
            description: 'Guide and support students through their learning journey.',
            icon: <FiUsers />
        },
        {
            id: 'ADMIN',
            title: 'Admin',
            description: 'Manage and oversee the platform\'s activities.',
            icon: <FiSettings />
        }
    ];

    const handleCredentialsSubmit = (e) => {
        e.preventDefault();
        if (name && email && password) {
            setStep(2);
        }
    };

    const handleRoleSubmit = async () => {
        if (!selectedRole) {
            setError('Please select a role');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await register(email, password, name, selectedRole);
            navigate('/complete-profile');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to register. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-background">
                <div className="auth-bg-shape auth-bg-shape-1"></div>
                <div className="auth-bg-shape auth-bg-shape-2"></div>
                <div className="auth-bg-shape auth-bg-shape-3"></div>
            </div>

            <motion.div
                className="auth-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <div className="auth-brand">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="40" height="40" rx="10" fill="url(#gradient)" />
                            <path d="M10 28V12L20 8L30 12V28L20 32L10 28Z" fill="white" opacity="0.9" />
                            <path d="M15 18L20 16L25 18V24L20 26L15 24V18Z" fill="#4A90E2" />
                            <defs>
                                <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#4A90E2" />
                                    <stop offset="1" stopColor="#357ABD" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span>Learning & Engagement Dashboard</span>
                    </div>
                </div>

                <div className="auth-content glass-card-static">
                    {step === 1 ? (
                        <motion.div
                            className="auth-form"
                            style={{ gridColumn: '1 / -1', maxWidth: '400px', margin: '0 auto' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <h2 style={{ textAlign: 'center' }}>Create Account</h2>
                            <p style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>Join our learning community</p>

                            {error && <div className="auth-error">{error}</div>}

                            <form onSubmit={handleCredentialsSubmit}>
                                <div className="input-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="input-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        className="input"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="input-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="Create a password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg w-full">
                                    Continue
                                </button>
                            </form>

                            <p className="auth-footer">
                                Already have an account? <Link to="/login">Log In</Link>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            className="role-selection-page"
                            style={{ gridColumn: '1 / -1' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <h2>Select Your Role</h2>
                            <p>Please choose your role to proceed.</p>

                            {error && <div className="auth-error" style={{ marginBottom: 'var(--spacing-md)' }}>{error}</div>}

                            <div className="role-cards">
                                {roles.map((role) => (
                                    <motion.div
                                        key={role.id}
                                        className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedRole(role.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="role-icon">
                                            {role.icon}
                                        </div>
                                        <h3>{role.title}</h3>
                                        <p>{role.description}</p>
                                    </motion.div>
                                ))}
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleRoleSubmit}
                                disabled={loading || !selectedRole}
                                style={{ minWidth: '200px' }}
                            >
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </button>

                            <p className="auth-footer" style={{ marginTop: 'var(--spacing-lg)' }}>
                                By signing up, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default RoleSelection;
