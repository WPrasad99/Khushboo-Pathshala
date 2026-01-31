import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { authAPI, userAPI } from '../../api';
import './Auth.css';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Login form state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const { setSession } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleGoogleRedirect = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            if (token) {
                setLoading(true);
                try {
                    // Temporarily store token for the API request
                    localStorage.setItem('token', token);

                    // Fetch user details using the new token
                    const response = await userAPI.getMe();

                    // Set full session
                    setSession(token, response.data);
                    navigate('/dashboard');
                } catch (err) {
                    console.error('Google login error:', err);
                    setError('Google Login failed. Please try again.');
                    localStorage.removeItem('token');
                    setLoading(false);
                }
            }
        };
        handleGoogleRedirect();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Start a 3-second timer
        const timer = new Promise(resolve => setTimeout(resolve, 3000));

        try {
            // First perform API call WITHOUT updating global auth state
            const response = await authAPI.login(loginEmail, loginPassword);

            // Then wait for the remainder of the 3 seconds
            await timer;

            // Update auth state ONLY after timer finishes
            setSession(response.data.token, response.data.user);

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to login. Please try again.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Redirect to your backend's Google OAuth initiation endpoint
        window.location.href = 'http://localhost:5000/api/auth/google';
    };

    return (
        <>
            {loading && (
                <div className="login-loader-overlay">
                    <div className="loader-content">
                        <div>Loading...</div>
                    </div>
                </div>
            )}
            <div className="auth-container-static">
                {/* Left Side - Login Form */}
                <div className="login-left-panel">
                    <form onSubmit={handleLogin} className="static-login-form">
                        <h1>Welcome Back</h1>

                        <button className="google-login-btn" type="button" onClick={handleGoogleLogin}>
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Log in with Google
                        </button>

                        <div className="auth-divider"><span>OR LOGIN WITH EMAIL</span></div>

                        {error && <div className="auth-error">{error}</div>}

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
                        <div className="form-field password-field">
                            <label>Password</label>
                            <div className="password-input-wrapper">
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
                        </div>

                        <div className="auth-options-row">
                            <label className="checkbox-label">
                                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                Keep me logged in
                            </label>
                            <a href="#" className="forgot-link">Forgot your password?</a>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>

                        <div className="auth-footer">Powered by Cybage Khushboo</div>
                    </form>
                </div>

                {/* Right Side - Image Panel */}
                <div className="login-right-panel">
                    <img src="/login-visual.png" alt="Login Visual" className="static-auth-image" />
                </div>
            </div>
        </>
    );
};

export default Login;
