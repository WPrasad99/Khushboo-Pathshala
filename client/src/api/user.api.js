import api from './axios';

export const userAPI = {
    getMe: () => api.get('/users/me'),
    updateProfile: (data) => api.put('/users/profile', data),
    getDashboard: () => api.get('/users/dashboard'),
    getLoginHistory: () => api.get('/users/login-history'),
    getNotifications: () => api.get('/notifications'),
};

export default userAPI;
