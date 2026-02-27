import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
// Fallback for direct base url where needed
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

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

// Auto-logout on expired/invalid token
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Token is expired or invalid — force logout
            const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
            if (!isAuthRoute) {
                localStorage.removeItem('token');
                delete api.defaults.headers.common['Authorization'];
                // Redirect to login if not already there
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// API functions
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
};

export const userAPI = {
    getDashboard: () => api.get('/users/dashboard'),
    getStudentDashboard: () => api.get('/student/dashboard'),
    getProfile: () => api.get('/users/me'),
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
    getAll: (params) => api.get('/resources', { params }),  // Support category and type filters
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
        // Check if data is FormData (for file uploads)
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

export default api;
