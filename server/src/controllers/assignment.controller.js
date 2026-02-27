const prisma = require('../config/prisma');

exports.createAssignment = async (req, res, next) => {
    try {
        const { title, description, dueDate, batchId, maxMarks } = req.body;
        const mentorId = req.user.id;

        if (!title || !description || !dueDate || !batchId) {
            return res.status(400).json({ success: false, error: 'Title, description, dueDate, and batchId are required.' });
        }

        if (req.user.role !== 'MENTOR' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Only mentors or admins can create assignments.' });
        }

        if (req.user.role === 'MENTOR') {
            const batchMentor = await prisma.batchMentor.findFirst({ where: { batchId, mentorId } });
            if (!batchMentor) {
                return res.status(403).json({ success: false, error: 'You are not assigned to this batch.' });
            }
        }

        const assignment = await prisma.assignment.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                dueDate: new Date(dueDate),
                batchId,
                maxMarks: Number(maxMarks) || 100,
                createdById: mentorId
            },
            include: { batch: { select: { name: true } } }
        });

        res.status(201).json({ success: true, data: assignment });
    } catch (error) {
        next(error);
    }
};

exports.getAssignments = async (req, res, next) => {
    try {
        const { batchId } = req.query;
        const userId = req.user.id;
        const role = req.user.role;

        let where = {};

        if (role === 'STUDENT') {
            const studentBatches = await prisma.batchStudent.findMany({
                where: { studentId: userId }, select: { batchId: true }
            });
            where.batchId = { in: studentBatches.map(b => b.batchId) };
        } else if (role === 'MENTOR') {
            const mentorBatches = await prisma.batchMentor.findMany({
                where: { mentorId: userId }, select: { batchId: true }
            });
            where = {
                OR: [
                    { batchId: { in: mentorBatches.map(b => b.batchId) } },
                    { createdById: userId }
                ]
            };
        }

        if (batchId) {
            where = role === 'ADMIN' ? { batchId } : { AND: [where, { batchId }] };
        }

        const assignments = await prisma.assignment.findMany({
            where,
            include: {
                batch: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
                _count: { select: { submissions: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: assignments });
    } catch (error) {
        next(error);
    }
};

exports.getAssignmentDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                batch: {
                    include: {
                        students: { select: { studentId: true } },
                        mentors: { select: { mentorId: true } }
                    }
                },
                createdBy: { select: { id: true, name: true } },
                submissions: {
                    include: { student: { select: { id: true, name: true, avatar: true } } }
                }
            }
        });

        if (!assignment) {
            return res.status(404).json({ success: false, error: 'Assignment not found.' });
        }

        if (role !== 'ADMIN') {
            const isStudentInBatch = assignment.batch.students.some(s => s.studentId === userId);
            const isMentorInBatch = assignment.batch.mentors.some(m => m.mentorId === userId);
            const isCreator = assignment.createdById === userId;

            if (!isStudentInBatch && !isMentorInBatch && !isCreator) {
                return res.status(403).json({ success: false, error: 'Access denied.' });
            }
        }

        res.json({ success: true, data: assignment });
    } catch (error) {
        next(error);
    }
};

exports.submitAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const studentId = req.user.id;
        const file = req.file;

        if (req.user.role !== 'STUDENT') {
            return res.status(403).json({ success: false, error: 'Only students can submit assignments.' });
        }

        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: { batch: { include: { students: { where: { studentId } } } } }
        });

        if (!assignment || assignment.batch.students.length === 0) {
            return res.status(403).json({ success: false, error: 'You are not eligible to submit this assignment.' });
        }

        let submissionContent = content || '';
        if (file) {
            submissionContent = `/uploads/${file.filename}`;
        }

        if (!submissionContent) {
            return res.status(400).json({ success: false, error: 'Content or file is required.' });
        }

        const submission = await prisma.assignmentSubmission.upsert({
            where: { assignmentId_studentId: { assignmentId: id, studentId } },
            update: { content: submissionContent, status: 'PENDING', submittedAt: new Date() },
            create: { assignmentId: id, studentId, content: submissionContent, status: 'PENDING' }
        });

        res.json({ success: true, data: submission });
    } catch (error) {
        next(error);
    }
};

exports.reviewSubmission = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const { marks, feedback, status } = req.body;
        const mentorId = req.user.id;

        if (req.user.role !== 'MENTOR' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Only mentors or admins can review.' });
        }

        const submission = await prisma.assignmentSubmission.findUnique({
            where: { id: submissionId },
            include: { assignment: { include: { batch: { include: { mentors: { where: { mentorId } } } } } } }
        });

        if (!submission) {
            return res.status(404).json({ success: false, error: 'Submission not found.' });
        }

        if (req.user.role === 'MENTOR') {
            const isAssigned = submission.assignment.batch.mentors.length > 0;
            const isCreator = submission.assignment.createdById === mentorId;
            if (!isAssigned && !isCreator) {
                return res.status(403).json({ success: false, error: 'Not authorized to grade this batch.' });
            }
        }

        const updated = await prisma.assignmentSubmission.update({
            where: { id: submissionId },
            data: {
                marks: marks != null ? Number(marks) : undefined,
                feedback: feedback || undefined,
                status: status || 'REVIEWED',
                reviewedById: mentorId,
                reviewedAt: new Date()
            }
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};
