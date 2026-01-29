import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiEye, FiEyeOff, FiBook, FiUsers, FiSettings } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './Auth.css';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Login form state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Signup form state
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('STUDENT');

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(loginEmail, loginPassword);
            if (!user.profileCompleted) {
                navigate('/complete-profile');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(signupEmail, signupPassword, signupName, selectedRole);
            navigate('/complete-profile');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to register. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleAuthMode = () => {
        setError('');
        setIsLogin(!isLogin);
    };

    const roles = [
        { id: 'STUDENT', title: 'Student', icon: <FiBook /> },
        { id: 'MENTOR', title: 'Mentor', icon: <FiUsers /> },
        { id: 'ADMIN', title: 'Admin', icon: <FiSettings /> }
    ];

    return (
        <div className="auth-page-animated">
            {/* Left Side - Login Form */}
            <motion.div
                className="auth-left-panel"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-form-wrapper">
                    {/* Brand Logo */}
                    <div className="auth-brand-logo">
                        <img src="/logo.png" alt="Cybage Khushboo" className="brand-logo-img" />
                    </div>

                    {/* Welcome Text */}
                    <h1 className="auth-title">Welcome Back</h1>

                    {/* Google Login Button */}
                    <button className="google-login-btn" type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Log in with Google
                    </button>

                    {/* Divider */}
                    <div className="auth-divider">
                        <span>OR LOGIN WITH EMAIL</span>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="auth-form">
                        {error && isLogin && (
                            <div className="auth-error">{error}</div>
                        )}

                        <div className="form-field">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Password</label>
                            <div className="password-field">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <div className="auth-options-row">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                Keep me logged in
                            </label>
                            <a href="#" className="forgot-link">Forgot your password?</a>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Log in'}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Don't have an account? <button className="link-btn" onClick={toggleAuthMode}>Sign up</button>
                    </p>
                </div>
            </motion.div>

            {/* Right Side - Animated Panel */}
            <div className="auth-right-panel">
                <AnimatePresence mode="wait">
                    {isLogin ? (
                        /* Image Panel - Full Bleed */
                        <motion.div
                            key="image-panel"
                            className="auth-image-panel-fullbleed"
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        >
                            <img
                                src="/auth-illustration.jpg"
                                alt="Authentication Illustration"
                                className="auth-illustration-fullbleed"
                            />
                        </motion.div>
                    ) : (
                        /* Signup Form Panel */
                        <motion.div
                            key="signup-panel"
                            className="auth-signup-panel"
                            initial={{ rotateY: -90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: 90, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        >
                            <div className="signup-form-container">
                                <h2 className="signup-title">Create Account</h2>
                                <p className="signup-subtitle">Join our learning community</p>

                                {error && !isLogin && (
                                    <div className="auth-error">{error}</div>
                                )}

                                <form onSubmit={handleSignup} className="auth-form">
                                    <div className="form-field">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={signupName}
                                            onChange={(e) => setSignupName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={signupEmail}
                                            onChange={(e) => setSignupEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            placeholder="Create a password"
                                            value={signupPassword}
                                            onChange={(e) => setSignupPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Select Role</label>
                                        <div className="role-selector">
                                            {roles.map((role) => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    className={`role-pill ${selectedRole === role.id ? 'active' : ''}`}
                                                    onClick={() => setSelectedRole(role.id)}
                                                >
                                                    {role.icon}
                                                    <span>{role.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="auth-submit-btn signup-btn"
                                        disabled={loading}
                                    >
                                        {loading ? 'Creating account...' : 'Sign up'}
                                    </button>
                                </form>

                                <p className="auth-footer-text light">
                                    Already have an account? <button className="link-btn light" onClick={toggleAuthMode}>Log in</button>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Login;
