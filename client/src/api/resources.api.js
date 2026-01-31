import api from './axios';

export const resourceAPI = {
    getAll: (category) => api.get('/resources', { params: { category } }),
    getOne: (id) => api.get(`/resources/${id}`),
    create: (data) => api.post('/resources', data),
    trackProgress: (id, data) => api.post(`/resources/${id}/track`, data),
};

export default resourceAPI;
