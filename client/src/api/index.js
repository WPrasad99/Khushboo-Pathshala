import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// API functions
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
};

export const userAPI = {
    getMe: () => api.get('/users/me'),
    updateProfile: (data) => api.put('/users/profile', data),
    getDashboard: () => api.get('/users/dashboard'),
};

export const resourceAPI = {
    getAll: (category) => api.get('/resources', { params: { category } }),
    getOne: (id) => api.get(`/resources/${id}`),
    create: (data) => api.post('/resources', data),
    trackProgress: (id, data) => api.post(`/resources/${id}/track`, data),
};

export const sessionAPI = {
    getAll: () => api.get('/sessions'),
    getTracking: () => api.get('/sessions/tracking'),
};

export const mentorshipAPI = {
    get: () => api.get('/mentorship'),
    getMeetings: () => api.get('/mentorship/meetings'),
    createMeeting: (data) => api.post('/mentorship/meetings', data),
};

export const forumAPI = {
    getPosts: () => api.get('/forum/posts'),
    createPost: (data) => api.post('/forum/posts', data),
    createAnswer: (postId, content) => api.post(`/forum/posts/${postId}/answers`, { content }),
    upvoteAnswer: (answerId) => api.post(`/forum/answers/${answerId}/upvote`),
};

export const announcementAPI = {
    getAll: () => api.get('/announcements'),
    create: (data) => api.post('/announcements', data),
};

export const adminAPI = {
    getUsers: () => api.get('/admin/users'),
    updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
    getReports: () => api.get('/admin/reports'),
};

export default api;
