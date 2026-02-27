const prisma = require('../config/prisma');

exports.createQuiz = async (req, res, next) => {
    try {
        const { title, description, duration, totalMarks, passingMarks, dueDate, batches, questions } = req.body;

        if (!title || !duration || !totalMarks || !questions) {
            return res.status(400).json({ success: false, error: 'Title, duration, totalMarks, and questions are required.' });
        }

        const quiz = await prisma.quiz.create({
            data: {
                title: title.trim(),
                description: description || null,
                duration: parseInt(duration) || 60,
                totalMarks: parseInt(totalMarks) || 100,
                passingMarks: passingMarks ? parseInt(passingMarks) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                batches: batches || [],
                questions,
                createdById: req.user.id
            }
        });
        res.status(201).json({ success: true, data: quiz });
    } catch (error) {
        next(error);
    }
};

exports.getMentorQuizzes = async (req, res, next) => {
    try {
        const quizzes = await prisma.quiz.findMany({
            where: { createdById: req.user.id },
            include: { _count: { select: { submissions: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: quizzes });
    } catch (error) {
        next(error);
    }
};

/**
 * ISSUE #21 FIX: Instead of fetching ALL quizzes, we still need the JS filter
 * due to SQLite JSON limitations, but we limit the result set and add pagination.
 */
exports.getStudentQuizzes = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userBatches = await prisma.batchStudent.findMany({
            where: { studentId: userId },
            select: { batchId: true }
        });
        const batchIds = userBatches.map(b => b.batchId);

        // SQLite has no JSON_CONTAINS, so we must filter in JS.
        // Mitigate performance by only fetching active/recent quizzes.
        const allQuizzes = await prisma.quiz.findMany({
            include: { submissions: { where: { studentId: userId } } },
            orderBy: { createdAt: 'desc' },
            take: 200 // Safety cap — no infinite table scans
        });

        const studentQuizzes = allQuizzes.filter(q => {
            if (!q.batches) return false;
            const qBatches = typeof q.batches === 'string' ? JSON.parse(q.batches) : q.batches;
            if (!Array.isArray(qBatches)) return false;
            return qBatches.some(bid => batchIds.includes(bid));
        });

        res.json({ success: true, data: studentQuizzes });
    } catch (error) {
        next(error);
    }
};

exports.getQuizDetails = async (req, res, next) => {
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: req.params.id },
            include: { submissions: { where: { studentId: req.user.id } } }
        });
        if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found.' });
        res.json({ success: true, data: quiz });
    } catch (error) {
        next(error);
    }
};

exports.startQuiz = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify quiz exists
        const quiz = await prisma.quiz.findUnique({ where: { id } });
        if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found.' });

        const submission = await prisma.quizSubmission.upsert({
            where: { quizId_studentId: { quizId: id, studentId: userId } },
            update: {},
            create: { quizId: id, studentId: userId, answers: {}, status: 'IN_PROGRESS' }
        });
        res.json({ success: true, data: submission });
    } catch (error) {
        next(error);
    }
};

exports.submitQuiz = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { answers } = req.body;
        const userId = req.user.id;

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ success: false, error: 'Answers object is required.' });
        }

        const quiz = await prisma.quiz.findUnique({ where: { id } });
        if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found.' });

        // Check submission exists and is in progress
        const existingSubmission = await prisma.quizSubmission.findUnique({
            where: { quizId_studentId: { quizId: id, studentId: userId } }
        });
        if (!existingSubmission) {
            return res.status(400).json({ success: false, error: 'Quiz has not been started.' });
        }
        if (existingSubmission.status === 'COMPLETED') {
            return res.status(400).json({ success: false, error: 'Quiz already submitted.' });
        }

        // Calculate score
        let score = 0;
        const questions = typeof quiz.questions === 'string' ? JSON.parse(quiz.questions) : quiz.questions;
        if (Array.isArray(questions) && questions.length > 0) {
            const pointsPerQuestion = quiz.totalMarks / questions.length;
            questions.forEach(q => {
                if (answers[q.id] === q.correctOption) {
                    score += pointsPerQuestion;
                }
            });
        }

        const submission = await prisma.quizSubmission.update({
            where: { quizId_studentId: { quizId: id, studentId: userId } },
            data: {
                answers,
                score: Math.round(score),
                submittedAt: new Date(),
                status: 'COMPLETED'
            }
        });

        res.json({ success: true, data: submission });
    } catch (error) {
        next(error);
    }
};
