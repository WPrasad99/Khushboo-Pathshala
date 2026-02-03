import api from './axios';

/**
 * Student Admin API
 * Admin-only endpoints for student management
 */
export const studentAdminAPI = {
    /**
     * Get all students with batch info
     * @param {Object} params - { batchId?, search? }
     */
    getAllStudents: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/students/admin${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get single student details
     */
    getStudent: (id) => api.get(`/students/admin/${id}`),

    /**
     * Create a new student with batch assignment
     * @param {Object} data - { name, email, password?, batchId, phone?, gender?, educationLevel? }
     */
    createStudent: (data) => api.post('/students/admin', data),

    /**
     * Bulk create students
     * @param {Object} data - { students: [{name, email, phone?}], batchId }
     */
    bulkCreateStudents: (data) => api.post('/students/admin/bulk', data),

    /**
     * Update student details
     * @param {string} id - Student ID
     * @param {Object} data - { name?, email?, batchId?, phone?, gender?, educationLevel? }
     */
    updateStudent: (id, data) => api.put(`/students/admin/${id}`, data),

    /**
     * Reset student password
     */
    resetPassword: (id) => api.put(`/students/admin/${id}/reset-password`),

    /**
     * Delete student
     */
    deleteStudent: (id) => api.delete(`/students/admin/${id}`),

    /**
     * Get students not assigned to any batch
     */
    getUnassignedStudents: () => api.get('/students/admin/unassigned'),

    /**
     * Bulk assign students to a batch
     * @param {Object} data - { studentIds: string[], batchId: string }
     */
    assignBatch: (data) => api.put('/students/admin/assign-batch', data),
};
