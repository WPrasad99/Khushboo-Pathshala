const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate.middleware');
const { getMeetingsSchema, getStudentsSchema, scheduleMeetingSchema } = require('../schemas/mentor.schema');
const mentorController = require('../controllers/mentor.controller');

// router will be mounted under /api/v2/mentor in index.js
// using existing `authenticateToken` and `requireRole` middleware

router.get('/batches', mentorController.getBatches);
router.get('/students', validate(getStudentsSchema), mentorController.getStudents);
router.get('/meetings', validate(getMeetingsSchema), mentorController.getMeetings);
router.post('/meetings', validate(scheduleMeetingSchema), mentorController.scheduleMeeting);

module.exports = router;
