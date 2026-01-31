import api from './axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
    googleAuth: () => {
        window.location.href = `${API_URL}/auth/google`;
    }
};

export default authAPI;
