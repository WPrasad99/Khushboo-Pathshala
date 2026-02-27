const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const resourceController = require('../controllers/resource.controller');
const mentorshipController = require('../controllers/mentorship.controller');

router.get('/dashboard', userController.getStudentDashboard);
router.get('/resources', resourceController.getStudentResources);
router.get('/batches', mentorshipController.getBatches);

module.exports = router;
