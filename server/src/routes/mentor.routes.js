const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate.middleware');
const {
    getMeetingsSchema,
    getStudentsSchema,
    scheduleMeetingSchema,
    uploadResourceSchema,
    markAttendanceSchema
} = require('../schemas/mentor.schema');
const mentorController = require('../controllers/mentor.controller');
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '../../uploads') });

// Mounted at /api/mentor in index.js with authenticateToken + requireRole('MENTOR','ADMIN')
router.get('/batches', mentorController.getBatches);
router.get('/students', validate(getStudentsSchema), mentorController.getStudents);
router.get('/meetings', validate(getMeetingsSchema), mentorController.getMeetings);
router.post('/meetings', validate(scheduleMeetingSchema), mentorController.scheduleMeeting);

router.get('/attendance', mentorController.getAttendance);
router.post('/attendance', validate(markAttendanceSchema), mentorController.markAttendance);
router.post('/sessions/upload', upload.single('file'), validate(uploadResourceSchema), mentorController.uploadResource);
router.post('/resources/upload', upload.single('file'), validate(uploadResourceSchema), mentorController.uploadResource);
router.get('/uploads', mentorController.getUploads);
router.delete('/uploads/:id', mentorController.deleteUpload);

module.exports = router;
