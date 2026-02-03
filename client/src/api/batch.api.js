import api from './axios';

/**
 * Batch Management API
 * Admin endpoints for batch CRUD, Mentor endpoints for scoped access
 */
export const batchAPI = {
    // =====================================================
    // ADMIN BATCH MANAGEMENT
    // =====================================================

    /**
     * Get all batches with mentor info and student counts
     */
    getAllBatches: () => api.get('/batches/admin'),

    /**
     * Get single batch details with students
     */
    getBatch: (id) => api.get(`/batches/admin/${id}`),

    /**
     * Create a new batch
     * @param {Object} data - { name, description, mentorId, isActive }
     */
    createBatch: (data) => api.post('/batches/admin', data),

    /**
     * Update batch details
     * @param {string} id - Batch ID
     * @param {Object} data - { name, description, mentorId, isActive }
     */
    updateBatch: (id, data) => api.put(`/batches/admin/${id}`, data),

    /**
     * Delete batch (only if no students assigned)
     */
    deleteBatch: (id) => api.delete(`/batches/admin/${id}`),

    // =====================================================
    // MENTOR BATCH ACCESS
    // =====================================================

    /**
     * Get mentor's assigned batches with student list
     */
    getMentorBatches: () => api.get('/batches/mentor'),

    /**
     * Get all students from mentor's batches with progress metrics
     */
    getMentorStudents: () => api.get('/batches/mentor/students'),

    /**
     * Get batch-level reports for mentor's batches
     */
    getMentorReports: () => api.get('/batches/mentor/reports'),
};
