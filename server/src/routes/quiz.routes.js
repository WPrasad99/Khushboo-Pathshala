const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { requireRole } = require('../middlewares/auth.middleware');

router.get('/student', quizController.getStudentQuizzes);
router.get('/mentor', requireRole('MENTOR', 'ADMIN'), quizController.getMentorQuizzes);
router.get('/:id', quizController.getQuizDetails);
router.post('/', requireRole('MENTOR', 'ADMIN'), quizController.createQuiz);
router.post('/:id/start', quizController.startQuiz);
router.post('/:id/submit', quizController.submitQuiz);

module.exports = router;
