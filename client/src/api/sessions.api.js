import api from './axios';

export const sessionAPI = {
    getAll: () => api.get('/sessions'),
    getTracking: () => api.get('/sessions/tracking'),
};

export default sessionAPI;
