import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api, { userAPI, authAPI, setAuthFailureCallback, clearAuthFailureCallback } from '../api';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => {
        try {
            return localStorage.getItem('token');
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const initRan = useRef(false);

    const logout = useCallback(() => {
        try {
            localStorage.removeItem('token');
        } catch { /* ignore */ }
        setToken(null);
        setUser(null);
        if (socket) {
            try {
                socket.disconnect();
            } catch { /* ignore */ }
            setSocket(null);
        }
        delete api.defaults.headers.common['Authorization'];
    }, [socket]);

    // Register logout callback for API interceptor (401 handling)
    useEffect(() => {
        const handleAuthFailure = () => {
            logout();
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        };
        setAuthFailureCallback(handleAuthFailure);
        return () => clearAuthFailureCallback();
    }, [logout]);

    // Initialize auth on mount - ONLY logout on 401, not on network/500 errors
    useEffect(() => {
        const initAuth = async () => {
            if (initRan.current) return;
            initRan.current = true;

            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
                setLoading(false);
                return;
            }

            try {
                const response = await userAPI.getProfile();
                const userData = response?.data;
                if (userData && typeof userData === 'object') {
                    setUser(userData);
                    setToken(storedToken);
                    api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                } else {
                    // Invalid response shape - clear
                    logout();
                }
            } catch (error) {
                const status = error.response?.status;
                // Only logout on 401 (unauthorized). Never logout on network errors, 500, etc.
                if (status === 401) {
                    logout();
                }
                // For any other error: leave user state as-is, don't clear token.
                // Network blip or 500 should not force logout.
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = async (email, password) => {
        const response = await authAPI.login(email, password);
        const { token: newToken, user: userData } = response.data ?? {};
        if (!newToken || !userData) throw new Error('Invalid login response');
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return userData;
    };

    const register = async (email, password, name, role) => {
        const response = await authAPI.register({ email, password, name, role });
        const { token: newToken, user: userData } = response.data ?? {};
        if (!newToken || !userData) throw new Error('Invalid register response');
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return userData;
    };

    const updateProfile = async (profileData) => {
        const response = await api.put('/users/profile', profileData);
        const userData = response?.data;
        if (userData) setUser(userData);
        return userData;
    };

    const setSession = (newToken, userData) => {
        if (!newToken || !userData) return;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    // Multi-tab logout synchronization
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'token' && e.newValue == null) {
                logout();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [logout]);

    // Initialize Socket.IO
    useEffect(() => {
        if (!user?.id || socket) return;
        const newSocket = io(API_BASE, {
            transports: ['websocket'],
            reconnection: true,
        });
        newSocket.on('connect', () => {
            newSocket.emit('join_user', user.id);
        });
        setSocket(newSocket);
        return () => {
            newSocket.close();
            setSocket(null);
        };
    }, [user?.id]);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            socket,
            login,
            setSession,
            register,
            updateProfile,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
