const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resource.controller');
const { requireRole } = require('../middlewares/auth.middleware');

router.get('/', resourceController.getResources);
router.get('/student', resourceController.getStudentResources);
router.get('/:id', resourceController.getResource);
router.post('/', requireRole('MENTOR', 'ADMIN'), resourceController.createResource);
router.post('/:id/track', resourceController.trackProgress);

module.exports = router;
