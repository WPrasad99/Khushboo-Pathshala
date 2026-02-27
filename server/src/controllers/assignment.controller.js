const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createAssignment = async (req, res, next) => {
    try {
        const { title, description, dueDate, batchId, maxMarks } = req.body;
        const mentorId = req.user.id;

        if (req.user.role !== 'MENTOR' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Only mentors or admins can create assignments' });
        }

        // Verify mentor is assigned to the batch
        if (req.user.role === 'MENTOR') {
            const batchMentor = await prisma.batchMentor.findFirst({
                where: { batchId, mentorId }
            });
            if (!batchMentor) {
                return res.status(403).json({ success: false, error: 'You are not assigned to this batch' });
            }
        }

        const assignment = await prisma.assignment.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                batchId,
                maxMarks: Number(maxMarks) || 100,
                createdById: mentorId
            },
            include: {
                batch: { select: { name: true } }
            }
        });

        res.status(201).json({
            success: true,
            data: assignment,
            message: 'Assignment created successfully'
        });
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
                where: { studentId: userId },
                select: { batchId: true }
            });
            const batchIds = studentBatches.map(b => b.batchId);
            where.batchId = { in: batchIds };
        } else if (role === 'MENTOR') {
            const mentorBatches = await prisma.batchMentor.findMany({
                where: { mentorId: userId },
                select: { batchId: true }
            });
            const batchIds = mentorBatches.map(b => b.batchId);
            where = {
                OR: [
                    { batchId: { in: batchIds } },
                    { createdById: userId }
                ]
            };
        }

        if (batchId) {
            // Apply filtering by batchId if provided, but still within access limits
            if (role === 'STUDENT' || role === 'MENTOR') {
                const originalWhere = { ...where };
                where = {
                    AND: [
                        originalWhere,
                        { batchId }
                    ]
                };
            } else {
                where = { batchId };
            }
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

        res.json({
            success: true,
            data: assignments,
            message: 'Assignments fetched successfully'
        });
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
                    include: {
                        student: { select: { id: true, name: true, avatar: true } }
                    }
                }
            }
        });

        if (!assignment) {
            return res.status(404).json({ success: false, error: 'Assignment not found' });
        }

        // Access check
        if (role !== 'ADMIN') {
            const isStudentInBatch = assignment.batch.students.some(s => s.studentId === userId);
            const isMentorInBatch = assignment.batch.mentors.some(m => m.mentorId === userId);
            const isCreator = assignment.createdById === userId;

            if (!isStudentInBatch && !isMentorInBatch && !isCreator) {
                return res.status(403).json({ success: false, error: 'Access denied to this assignment' });
            }
        }

        res.json({
            success: true,
            data: assignment,
            message: 'Assignment details fetched successfully'
        });
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
            return res.status(403).json({ success: false, error: 'Only students can submit assignments' });
        }

        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: { batch: { include: { students: { where: { studentId } } } } }
        });

        if (!assignment || assignment.batch.students.length === 0) {
            return res.status(403).json({ success: false, error: 'You are not eligible to submit this assignment' });
        }

        let submissionContent = content || '';
        if (file) {
            submissionContent = `/uploads/${file.filename}`;
        }

        const submission = await prisma.assignmentSubmission.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId: id,
                    studentId
                }
            },
            update: {
                content: submissionContent,
                status: 'PENDING',
                submittedAt: new Date()
            },
            create: {
                assignmentId: id,
                studentId,
                content: submissionContent,
                status: 'PENDING'
            }
        });

        res.json({
            success: true,
            data: submission,
            message: 'Assignment submitted successfully'
        });
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
            return res.status(403).json({ success: false, error: 'Only mentors or admins can review submissions' });
        }

        const submission = await prisma.assignmentSubmission.findUnique({
            where: { id: submissionId },
            include: { assignment: { include: { batch: { include: { mentors: { where: { mentorId } } } } } } }
        });

        if (!submission) {
            return res.status(404).json({ success: false, error: 'Submission not found' });
        }

        // Ownership/Batch check for mentors
        if (req.user.role === 'MENTOR') {
            const isAssignedMentor = submission.assignment.batch.mentors.length > 0;
            const isCreator = submission.assignment.createdById === mentorId;
            if (!isAssignedMentor && !isCreator) {
                return res.status(403).json({ success: false, error: 'You are not authorized to grade this batch' });
            }
        }

        const updated = await prisma.assignmentSubmission.update({
            where: { id: submissionId },
            data: {
                marks: Number(marks),
                feedback,
                status: status || 'REVIEWED',
                reviewedById: mentorId,
                reviewedAt: new Date()
            }
        });

        res.json({
            success: true,
            data: updated,
            message: 'Submission reviewed successfully'
        });
    } catch (error) {
        next(error);
    }
};
