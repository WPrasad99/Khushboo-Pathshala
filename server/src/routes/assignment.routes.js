const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multiplexing upload logic (minimal version since index.js has it, but for decoupling)
const uploadDir = path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/', assignmentController.createAssignment);
router.get('/', assignmentController.getAssignments);
router.get('/:id', assignmentController.getAssignmentDetails);
router.post('/:id/submit', upload.single('file'), assignmentController.submitAssignment);
router.put('/submissions/:submissionId/review', assignmentController.reviewSubmission);

module.exports = router;
