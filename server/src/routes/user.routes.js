const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '../../uploads') });

router.get('/dashboard', userController.getDashboard);
router.get('/student-dashboard', userController.getStudentDashboard);
router.get('/me', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/avatar', upload.single('file'), userController.uploadAvatar);
router.get('/login-history', userController.getLoginHistory);
router.put('/password', userController.changePassword);

module.exports = router;
