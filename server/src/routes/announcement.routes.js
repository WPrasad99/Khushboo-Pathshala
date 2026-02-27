const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const { requireRole } = require('../middlewares/auth.middleware');

router.get('/', announcementController.getAnnouncements);
router.post('/', requireRole('ADMIN'), announcementController.createAnnouncement);

module.exports = router;
