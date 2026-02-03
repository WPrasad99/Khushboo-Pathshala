import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';

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
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const initRan = useRef(false);

    // Configure axios defaults
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Initialize Socket.IO
    useEffect(() => {
        if (user && !socket) {
            const newSocket = io('http://localhost:5000');
            newSocket.on('connect', () => {
                newSocket.emit('join_user', user.id);
            });
            setSocket(newSocket);

            return () => newSocket.close();
        }
    }, [user, socket]);

    // Check if user is logged in on mount - ONLY RUN ONCE
    useEffect(() => {
        const initAuth = async () => {
            // Prevent double execution
            if (initRan.current) return;
            initRan.current = true;

            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const response = await axios.get(`${API_URL}/users/me`);
                    setUser(response.data);
                } catch (error) {
                    console.error('Auth init error:', error);
                    logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []); // Empty dependency array - run ONLY on mount

    const login = async (email, password) => {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        const { token: newToken, user: userData } = response.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        return userData;
    };

    const register = async (email, password, name, role) => {
        const response = await axios.post(`${API_URL}/auth/register`, { email, password, name, role });
        const { token: newToken, user: userData } = response.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        return userData;
    };

    const updateProfile = async (profileData) => {
        const response = await axios.put(`${API_URL}/users/profile`, profileData);
        setUser(response.data);
        return response.data;
    };

    const setSession = (newToken, userData) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
        delete axios.defaults.headers.common['Authorization'];
    };

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
