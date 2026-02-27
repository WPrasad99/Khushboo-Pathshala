const express = require('express');
const router = express.Router();
const mentorshipController = require('../controllers/mentorship.controller');

router.get('/', mentorshipController.getMentorship);
router.get('/meetings', mentorshipController.getMeetings);

module.exports = router;
