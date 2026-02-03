// Re-export all API modules for backward compatibility
import api from './axios';
import { authAPI } from './auth.api';
import { userAPI } from './user.api';
import { resourceAPI } from './resources.api';
import { sessionAPI } from './sessions.api';
import { forumAPI } from './forum.api';
import { adminAPI } from './admin.api';
import { mentorshipAPI } from './mentorship.api';
import { batchAPI } from './batch.api';
import { studentAdminAPI } from './studentAdmin.api';

// Chat API (kept here for Socket.IO integration)
export const chatAPI = {
    getGroups: () => api.get('/chat/groups'),
    getInvites: () => api.get('/chat/invites'),
    createGroup: (data) => api.post('/chat/groups', data),
    respondToInvite: (id, status) => api.put(`/chat/invites/${id}`, { status }),
    getMessages: (groupId) => api.get(`/chat/groups/${groupId}/messages`),
    sendMessage: (groupId, content) => api.post(`/chat/groups/${groupId}/messages`, { content }),
    getUsers: () => api.get('/chat/users'),
};

// Announcement API
export const announcementAPI = {
    getAll: () => api.get('/announcements'),
    create: (data) => api.post('/announcements', data),
};

// Export all APIs
export {
    api as default,
    authAPI,
    userAPI,
    resourceAPI,
    sessionAPI,
    forumAPI,
    adminAPI,
    mentorshipAPI,
    batchAPI,
    studentAdminAPI,
};
