import api from '../api';

const MENTOR_V2_PREFIX = '/v2/mentor';

export const mentorService = {
    getBatches: async () => {
        const response = await api.get(`${MENTOR_V2_PREFIX}/batches`);
        return response.data;
    },

    getStudents: async (params) => {
        const response = await api.get(`${MENTOR_V2_PREFIX}/students`, { params });
        return response.data;
    },

    getMeetings: async (params) => {
        const response = await api.get(`${MENTOR_V2_PREFIX}/meetings`, { params });
        return response.data;
    },

    scheduleMeeting: async (data) => {
        const response = await api.post(`${MENTOR_V2_PREFIX}/meetings`, data);
        return response.data;
    },

    // Other existing endpoints mapped correctly for backward compatibility
    getUploads: async (type) => {
        const response = await api.get(`/mentor/uploads`, { params: { type } });
        return response.data;
    },

    uploadSession: async (data) => {
        const response = await api.post(`/mentor/sessions/upload`, data);
        return response.data;
    },

    deleteUpload: async (id) => {
        const response = await api.delete(`/mentor/uploads/${id}`);
        return response.data;
    },

    getAssignments: async (batchId) => {
        const response = await api.get('/assignments', { params: { batchId, mentorMode: true } });
        return response.data;
    },
};
