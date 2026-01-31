import api from './axios';

export const mentorshipAPI = {
    get: () => api.get('/mentorship'),
    getMeetings: () => api.get('/mentorship/meetings'),
    createMeeting: (data) => api.post('/mentorship/meetings', data),
    sendMessage: (data) => api.post('/mentorship/message', data),
};

export default mentorshipAPI;
