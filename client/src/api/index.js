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
    getDashboard: () => api.get('/users/dashboard'),
    getProfile: () => api.get('/users/me'),
    updateProfile: (data) => api.put('/users/profile', data),
    uploadAvatar: (formData) => api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    changePassword: (data) => api.put('/users/password', data),
    getLoginHistory: () => api.get('/users/login-history'),
    getNotifications: () => api.get('/notifications'),
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
    sendMessage: (data) => api.post('/mentorship/message', data),
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
    createUser: (data) => api.post('/admin/users', data),
    updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
    getReports: () => api.get('/admin/reports'),
    getStudents: () => api.get('/admin/students'),
    getMentors: () => api.get('/admin/mentors'),
};

export const batchAPI = {
    getAll: () => api.get('/admin/batches'),
    getById: (id) => api.get(`/admin/batches/${id}`),
    create: (data) => api.post('/admin/batches', data),
    update: (id, data) => api.put(`/admin/batches/${id}`, data),
    delete: (id) => api.delete(`/admin/batches/${id}`),
    addStudents: (id, studentIds) => api.post(`/admin/batches/${id}/students`, { studentIds }),
    removeStudent: (id, studentId) => api.delete(`/admin/batches/${id}/students/${studentId}`),
    addMentors: (id, mentorIds) => api.post(`/admin/batches/${id}/mentors`, { mentorIds }),
    removeMentor: (id, mentorId) => api.delete(`/admin/batches/${id}/mentors/${mentorId}`),
};

export const chatAPI = {
    getGroups: () => api.get('/chat/groups'),
    getInvites: () => api.get('/chat/invites'),
    createGroup: (data) => api.post('/chat/groups', data),
    respondToInvite: (id, status) => api.put(`/chat/invites/${id}`, { status }),
    getMessages: (groupId) => api.get(`/chat/groups/${groupId}/messages`),
    sendMessage: (groupId, content) => api.post(`/chat/groups/${groupId}/messages`, { content }),
    getUsers: () => api.get('/chat/users'),
};

export default api;
