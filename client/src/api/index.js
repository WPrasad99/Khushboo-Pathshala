import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
// Fallback for direct base url where needed
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

/**
 * Logout callback - set by AuthProvider on mount.
 * Enables API interceptor to trigger logout without circular dependency.
 */
let onAuthFailure = null;
export const setAuthFailureCallback = (cb) => { onAuthFailure = cb; };
export const clearAuthFailureCallback = () => { onAuthFailure = null; };

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Response interceptor: Only logout on 401 (auth failure).
 * - 401: No token, invalid token, expired token -> trigger logout
 * - 403: Insufficient permissions -> do NOT logout (user is authenticated)
 * - 500/network errors: Never logout
 */
api.interceptors.response.use(
    (response) => {
        // Standard contract: return the 'data' field directly if success is true
        if (response.data && response.data.success === true) {
            return response.data; // We return the whole wrapper so components can check .data.items etc
            // Actually, many components might expect response.data to BE the array.
            // Let's return response.data.data to be transparent.
        }
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const data = error.response?.data;

        // Extract error message from contract
        if (data && data.success === false && data.error) {
            error.message = data.error.message || error.message;
        }
        const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
        const is401 = status === 401;

        // Only logout on confirmed 401 auth failure (never on 403, 500, or network errors)
        if (is401 && !isAuthRoute) {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            if (typeof onAuthFailure === 'function') {
                onAuthFailure();
            } else if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Standard error extractor for consistent UI messages
export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
    if (!error) return fallback;
    const data = error.response?.data;
    if (data?.error) {
        if (typeof data.error === 'string') return data.error;
        if (data.error?.message) return data.error.message;
    }
    if (error.message && !error.message.startsWith('Network')) return error.message;
    if (error.response?.status === 500) return 'Server error. Please try again later.';
    if (!error.response) return 'Unable to connect. Please check your network.';
    return fallback;
};

// API functions
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
};

export const userAPI = {
    getDashboard: () => api.get('/users/dashboard'),
    getStudentDashboard: () => api.get('/student/dashboard'),
    getProfile: () => api.get('/users/me'),
    getMe: () => api.get('/users/me'), // Alias for Google login / getProfile
    updateProfile: (data) => api.put('/users/profile', data),
    uploadAvatar: (formData) => api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    changePassword: (data) => api.put('/users/password', data),
    getLoginHistory: () => api.get('/users/login-history'),
    getNotifications: () => api.get('/notifications'),
    getStudentResources: () => api.get('/student/resources'),
};

export const resourceAPI = {
    getAll: (params) => api.get('/resources', { params }),
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
    getMeetings: (filter) => api.get('/mentorship/meetings', { params: { filter } }),
    getBatches: () => api.get('/student/batches'),
    createMeeting: (data) => api.post('/mentorship/meetings', data),
    sendMessage: (data) => api.post('/mentorship/message', data),
};

export const mentorAPI = {
    getBatches: () => api.get('/mentor/batches'),
    getStudents: () => api.get('/mentor/students'),
    getMeetings: () => api.get('/mentor/meetings'),
    scheduleMeeting: (data) => api.post('/mentor/meetings', data),
    uploadSession: (data) => api.post('/mentor/sessions/upload', data),
    uploadResource: (data) => api.post('/mentor/resources/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getUploads: (type) => api.get('/mentor/uploads', { params: { type } }),
    deleteUpload: (id) => api.delete(`/mentor/uploads/${id}`),
};

export const forumAPI = {
    getPosts: (batchId) => api.get('/forum/posts', { params: { batchId } }),
    getPostById: (id) => api.get(`/forum/posts/${id}`),
    createPost: (data) => api.post('/forum/posts', data),
    createAnswer: (postId, content) => api.post(`/forum/posts/${postId}/answers`, { content }),
    upvoteAnswer: (answerId) => api.post(`/forum/answers/${answerId}/upvote`),
};

export const assignmentAPI = {
    createAssignment: (data) => api.post('/assignments', data),
    getAssignments: (batchId) => api.get('/assignments', { params: { batchId } }),
    getAssignmentDetails: (id) => api.get(`/assignments/${id}`),
    submitAssignment: (id, data) => {
        const isFormData = data instanceof FormData;
        return api.post(`/assignments/${id}/submit`, data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
    },
    reviewSubmission: (submissionId, data) => api.put(`/assignments/submissions/${submissionId}/review`, data),
};

export const announcementAPI = {
    getAll: () => api.get('/announcements'),
    create: (data) => api.post('/announcements', data),
};

export const adminAPI = {
    getUsers: () => api.get('/admin/users'),
    createUser: (data) => api.post('/admin/users', data),
    bulkCreateUsers: (data) => api.post('/admin/users/bulk', data),
    updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getReports: () => api.get('/admin/reports'),
    getStudents: () => api.get('/admin/students'),
    getMentors: () => api.get('/admin/mentors'),
    // Batch management (proxied to batchAPI for convenience)
    getBatches: () => api.get('/admin/batches'),
    createBatch: (data) => api.post('/admin/batches', data),
    updateBatch: (id, data) => api.put(`/admin/batches/${id}`, data),
    deleteBatch: (id) => api.delete(`/admin/batches/${id}`),
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
    createBatchGroup: (batchId) => api.post('/chat/groups/batch', { batchId }),
    createDirectMessage: (userId) => api.post('/chat/groups/direct', { userId }),
    respondToInvite: (id, status) => api.put(`/chat/invites/${id}`, { status }),
    getMessages: (groupId) => api.get(`/chat/groups/${groupId}/messages`),
    sendMessage: (groupId, content, attachments) => api.post(`/chat/groups/${groupId}/messages`, { content, attachments }),
    uploadFiles: (formData) => api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getUsers: () => api.get('/chat/users'),
    getContacts: () => api.get('/chat/contacts'),
};

export const quizAPI = {
    createQuiz: (data) => api.post('/quizzes', data),
    getMentorQuizzes: () => api.get('/quizzes/mentor'),
    getStudentQuizzes: () => api.get('/quizzes/student'),
    getQuizDetails: (id) => api.get(`/quizzes/${id}`),
    startQuiz: (id) => api.post(`/quizzes/${id}/start`),
    submitQuiz: (id, answers) => api.post(`/quizzes/${id}/submit`, { answers }),
};

export const chatbotAPI = {
    askQuestion: (question, conversationHistory) =>
        api.post('/chatbot/ask', { question, conversationHistory })
};

export const roadmapAPI = {
    generate: (topic, days) => api.post('/roadmaps/generate', { topic, days }),
    getHistory: () => api.get('/roadmaps/history'),
    delete: (id) => api.delete(`/roadmaps/${id}`)
};

export default api;
