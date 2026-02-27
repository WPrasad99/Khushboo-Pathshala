const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// User Management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.post('/users/bulk', adminController.bulkCreateUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Batch Management
router.get('/batches', adminController.getBatches);
router.post('/batches', adminController.createBatch);
router.put('/batches/:id', adminController.updateBatch);
router.delete('/batches/:id', adminController.deleteBatch);

// Batch Memberships
router.post('/batches/:id/students', adminController.addStudentsToBatch);
router.delete('/batches/:id/students/:studentId', adminController.removeStudentFromBatch);
router.post('/batches/:id/mentors', adminController.addMentorsToBatch);
router.delete('/batches/:id/mentors/:mentorId', adminController.removeMentorFromBatch);

// Analytics & Reports
router.get('/reports', adminController.getReports);
router.get('/students', adminController.getStudents);
router.get('/mentors', adminController.getMentors);

module.exports = router;
