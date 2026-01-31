import api from './axios';

export const adminAPI = {
    getUsers: () => api.get('/admin/users'),
    updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
    getReports: () => api.get('/admin/reports'),
    getAnnouncements: () => api.get('/announcements'),
    createAnnouncement: (data) => api.post('/announcements', data),
};

export default adminAPI;
