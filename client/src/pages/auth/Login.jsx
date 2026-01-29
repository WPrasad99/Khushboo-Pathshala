import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiEye, FiEyeOff, FiBook, FiUsers, FiSettings } from 'react-icons/fi';
import './Auth.css';

const Login = () => {
    const [isSignupMode, setIsSignupMode] = useState(false);
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

    const toggleMode = () => {
        setError('');
        setIsSignupMode(!isSignupMode);
    };

    const roles = [
        { id: 'STUDENT', title: 'Student', icon: <FiBook /> },
        { id: 'MENTOR', title: 'Mentor', icon: <FiUsers /> },
        { id: 'ADMIN', title: 'Admin', icon: <FiSettings /> }
    ];

    return (
        <div className={`auth-container-sliding ${isSignupMode ? 'right-panel-active' : ''}`}>

            {/* Sign Up Form Container (Appears on Right) */}
            <div className="form-container sign-up-container">
                <form onSubmit={handleSignup} className="slider-form">
                    <div className="auth-brand-logo small">
                        <img src="/logo.png" alt="Cybage Khushboo" />
                    </div>
                    <h1>Create Account</h1>
                    <p className="subtitle">Join our learning community</p>

                    {error && isSignupMode && <div className="auth-error">{error}</div>}

                    <div className="scrollable-fields">
                        <div className="form-field">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={signupName}
                                onChange={(e) => setSignupName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <input
                                type="email"
                                placeholder="Email"
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <input
                                type="password"
                                placeholder="Password"
                                value={signupPassword}
                                onChange={(e) => setSignupPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

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

                    <button type="submit" className="auth-submit-btn signup-btn" disabled={loading}>
                        {loading ? 'Creating...' : 'Sign Up'}
                    </button>

                    <p className="mobile-toggle-text">
                        Already have an account? <span onClick={toggleMode}>Log In</span>
                    </p>
                </form>
            </div>

            {/* Sign In Form Container (Starts on Left) */}
            <div className="form-container sign-in-container">
                <form onSubmit={handleLogin} className="slider-form">
                    <div className="auth-brand-logo">
                        <img src="/logo.png" alt="Cybage Khushboo" />
                    </div>
                    <h1>Welcome Back</h1>

                    <button className="google-login-btn" type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Log in with Google
                    </button>

                    <div className="auth-divider"><span>OR LOGIN WITH EMAIL</span></div>

                    {error && !isSignupMode && <div className="auth-error">{error}</div>}

                    <div className="form-field">
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-field password-field">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                        />
                        <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </div>

                    <div className="auth-options-row">
                        <label className="checkbox-label">
                            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                            Keep me logged in
                        </label>
                        <a href="#" className="forgot-link">Forgot password?</a>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>

                    <p className="mobile-toggle-text">
                        Don't have an account? <span onClick={toggleMode}>Sign Up</span>
                    </p>
                </form>
            </div>

            {/* Overlay Container (The Sliding Image Panel) */}
            <div className="overlay-container">
                <div className="overlay">
                    {/* Left Overlay - Shows when Signup Mode is Active (Panel on Left) */}
                    <div className="overlay-panel overlay-left">
                        <img src="/auth-illustration.jpg" alt="Illustration" className="overlay-image" />
                        <div className="overlay-content">
                            <h1>Welcome Back!</h1>
                            <p>To keep connected with us please login with your personal info</p>
                            <button className="ghost-btn" onClick={toggleMode}>Log In</button>
                        </div>
                        {/* Dark gradient overlay for text readability */}
                        <div className="image-gradient"></div>
                    </div>

                    {/* Right Overlay - Shows when Login Mode is Active (Panel on Right) */}
                    <div className="overlay-panel overlay-right">
                        <img src="/auth-illustration.jpg" alt="Illustration" className="overlay-image" />
                        <div className="overlay-content">
                            <h1>Hello, Friend!</h1>
                            <p>Enter your personal details and start your journey with us</p>
                            <button className="ghost-btn" onClick={toggleMode}>Sign Up</button>
                        </div>
                        <div className="image-gradient"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
