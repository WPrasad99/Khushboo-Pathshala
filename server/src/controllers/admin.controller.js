const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config');

// ── User Management ────────────────────────────────────

exports.getUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, email: true, role: true,
                avatar: true, phone: true, createdAt: true, profileCompleted: true
            }
        });
        res.json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

exports.createUser = async (req, res, next) => {
    try {
        const { email, password, name, role, phone } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ success: false, error: 'Email, password, and name are required.' });
        }

        const validRoles = ['STUDENT', 'MENTOR', 'ADMIN'];
        const finalRole = validRoles.includes(role) ? role : 'STUDENT';

        const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (existingUser) {
            return res.status(409).json({ success: false, error: 'User already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
        const user = await prisma.user.create({
            data: {
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                name: name.trim(),
                role: finalRole,
                phone: phone || null,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.trim().replace(/\s/g, '')}`,
                profileCompleted: true
            }
        });

        const { password: _, ...safeUser } = user;
        res.status(201).json({ success: true, data: safeUser });
    } catch (error) {
        next(error);
    }
};

/**
 * ISSUE #4 FIX: Removed mode: 'insensitive' (not supported by SQLite).
 * Uses manual case-insensitive comparison instead.
 * ISSUE #14 FIX: Uses crypto.randomBytes for secure password generation.
 */
exports.bulkCreateUsers = async (req, res, next) => {
    try {
        const { users, batchName } = req.body;

        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ success: false, error: 'No users provided.' });
        }
        if (!batchName || typeof batchName !== 'string' || batchName.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Batch name is required.' });
        }

        const trimmedBatchName = batchName.trim();

        // ISSUE #4 FIX: Fetch all batches and do case-insensitive match in JS
        const allBatches = await prisma.batch.findMany({ select: { id: true, name: true } });
        let batch = allBatches.find(b => b.name.toLowerCase() === trimmedBatchName.toLowerCase());

        if (!batch) {
            batch = await prisma.batch.create({
                data: { name: trimmedBatchName, status: 'ACTIVE' }
            });
        }

        const validOperations = [];
        const errors = [];

        for (const userData of users) {
            const { name, email } = userData;
            if (!name || !email) {
                errors.push({ email: email || 'unknown', error: 'Missing name or email' });
                continue;
            }

            const trimmedEmail = email.trim().toLowerCase();
            const exists = await prisma.user.findUnique({ where: { email: trimmedEmail } });
            if (exists) {
                errors.push({ email: trimmedEmail, error: 'User already exists' });
                continue;
            }

            // ISSUE #14 FIX: Cryptographically secure password
            const generatedPassword = crypto.randomBytes(8).toString('base64url');
            const hashedPassword = await bcrypt.hash(generatedPassword, config.bcrypt.saltRounds);

            validOperations.push({
                userData: {
                    email: trimmedEmail,
                    password: hashedPassword,
                    name: name.trim(),
                    role: 'STUDENT',
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.trim().replace(/\s/g, '')}`,
                    profileCompleted: true
                },
                plainPassword: generatedPassword
            });
        }

        if (validOperations.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid users to create.', data: { errors } });
        }

        const createdUsers = await prisma.$transaction(async (tx) => {
            const results = [];
            for (const op of validOperations) {
                const user = await tx.user.create({ data: op.userData });
                await tx.batchStudent.create({
                    data: { batchId: batch.id, studentId: user.id }
                });
                const { password: _, ...safeUser } = user;
                results.push({ ...safeUser, generatedPassword: op.plainPassword });
            }
            return results;
        });

        res.status(201).json({
            success: true,
            message: `Created ${createdUsers.length} users in batch "${batch.name}".`,
            data: { createdUsers, errors, batch: { id: batch.id, name: batch.name } }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['STUDENT', 'MENTOR', 'ADMIN'];
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ success: false, error: `Role must be one of: ${validRoles.join(', ')}` });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        });
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

/**
 * ISSUE #5 FIX: Comprehensive cascading delete.
 * Removes ALL dependent records before deleting the user.
 */
exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (id === req.user.id) {
            return res.status(400).json({ success: false, error: 'Cannot delete your own account.' });
        }

        await prisma.$transaction(async (tx) => {
            // Forum data
            await tx.answerVote.deleteMany({ where: { userId: id } });
            await tx.forumAnswer.deleteMany({ where: { authorId: id } });
            await tx.forumPost.deleteMany({ where: { authorId: id } });

            // Chat data
            await tx.messageReaction.deleteMany({ where: { userId: id } });
            await tx.messageRead.deleteMany({ where: { userId: id } });
            await tx.chatMessage.deleteMany({ where: { senderId: id } });
            await tx.groupMember.deleteMany({ where: { userId: id } });

            // Meetings via mentorships
            const mentorships = await tx.mentorship.findMany({
                where: { OR: [{ mentorId: id }, { menteeId: id }] },
                select: { id: true }
            });
            if (mentorships.length > 0) {
                await tx.meeting.deleteMany({
                    where: { mentorshipId: { in: mentorships.map(m => m.id) } }
                });
            }
            await tx.mentorship.deleteMany({ where: { OR: [{ mentorId: id }, { menteeId: id }] } });

            // Academic data
            await tx.quizSubmission.deleteMany({ where: { studentId: id } });
            await tx.assignmentSubmission.deleteMany({ where: { studentId: id } });
            await tx.sessionTracking.deleteMany({ where: { userId: id } });
            await tx.courseProgress.deleteMany({ where: { studentId: id } });

            // Activity & logs
            await tx.achievement.deleteMany({ where: { userId: id } });
            await tx.activity.deleteMany({ where: { userId: id } });
            await tx.loginLog.deleteMany({ where: { userId: id } });
            await tx.notification.deleteMany({ where: { userId: id } });

            // Batch memberships
            await tx.batchMentor.deleteMany({ where: { mentorId: id } });
            await tx.batchStudent.deleteMany({ where: { studentId: id } });

            // Announcements created by this user
            await tx.announcement.deleteMany({ where: { createdById: id } });

            // Finally delete user
            await tx.user.delete({ where: { id } });
        });

        res.json({ success: true, message: 'User and all associated data deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

// ── Reports & Analytics ────────────────────────────────

exports.getReports = async (req, res, next) => {
    try {
        const [totalStudents, totalMentors, totalResources, totalSessions, recentTrackings, recentBatches] = await Promise.all([
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'MENTOR' } }),
            prisma.learningResource.count(),
            prisma.session.count(),
            prisma.sessionTracking.findMany({
                take: 10, orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } }, resource: { select: { title: true } } }
            }),
            prisma.batch.findMany({
                take: 6, orderBy: { createdAt: 'desc' },
                include: { _count: { select: { students: true } } }
            })
        ]);

        res.json({
            success: true,
            data: { stats: { totalStudents, totalMentors, totalResources, totalSessions }, recentTrackings, recentBatches }
        });
    } catch (error) {
        next(error);
    }
};

exports.getStudents = async (req, res, next) => {
    try {
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: { id: true, name: true, email: true, avatar: true, phone: true, createdAt: true }
        });
        res.json({ success: true, data: students });
    } catch (error) {
        next(error);
    }
};

exports.getMentors = async (req, res, next) => {
    try {
        const mentors = await prisma.user.findMany({
            where: { role: 'MENTOR' },
            select: { id: true, name: true, email: true, avatar: true, phone: true }
        });
        res.json({ success: true, data: mentors });
    } catch (error) {
        next(error);
    }
};

// ── Batch Management ───────────────────────────────────

exports.getBatches = async (req, res, next) => {
    try {
        const batches = await prisma.batch.findMany({
            include: {
                students: { include: { student: { select: { id: true, name: true, email: true, avatar: true } } } },
                mentors: { include: { mentor: { select: { id: true, name: true, email: true, avatar: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = batches.map(batch => ({
            ...batch,
            mentor: batch.mentors[0]?.mentor || null,
            students: batch.students.map(s => s.student)
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        next(error);
    }
};

exports.createBatch = async (req, res, next) => {
    try {
        const { name, description, studentIds, mentorIds, mentorId } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Batch name is required.' });
        }

        const finalMentorIds = mentorIds || (mentorId ? [mentorId] : []);

        const batch = await prisma.batch.create({
            data: {
                name: name.trim(),
                description: description || null,
                students: { create: (studentIds || []).map(id => ({ studentId: id })) },
                mentors: { create: finalMentorIds.map(id => ({ mentorId: id })) }
            },
            include: {
                students: { include: { student: { select: { id: true, name: true, email: true, avatar: true } } } },
                mentors: { include: { mentor: { select: { id: true, name: true, email: true, avatar: true } } } }
            }
        });

        res.status(201).json({
            success: true,
            data: { ...batch, mentor: batch.mentors[0]?.mentor || null, students: batch.students.map(s => s.student) }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateBatch = async (req, res, next) => {
    try {
        const { name, description, status, studentIds, mentorIds, mentorId } = req.body;
        const batchId = req.params.id;
        const finalMentorIds = mentorIds || (mentorId ? [mentorId] : null);

        const batch = await prisma.$transaction(async (tx) => {
            await tx.batch.update({ where: { id: batchId }, data: { name, description, status } });

            if (studentIds) {
                await tx.batchStudent.deleteMany({ where: { batchId } });
                if (studentIds.length > 0) {
                    await tx.batchStudent.createMany({
                        data: studentIds.map(id => ({ batchId, studentId: id }))
                    });
                }
            }

            if (finalMentorIds) {
                await tx.batchMentor.deleteMany({ where: { batchId } });
                if (finalMentorIds.length > 0) {
                    await tx.batchMentor.createMany({
                        data: finalMentorIds.map(id => ({ batchId, mentorId: id }))
                    });
                }
            }

            return tx.batch.findUnique({
                where: { id: batchId },
                include: {
                    students: { include: { student: { select: { id: true, name: true, email: true, avatar: true } } } },
                    mentors: { include: { mentor: { select: { id: true, name: true, email: true, avatar: true } } } }
                }
            });
        });

        res.json({
            success: true,
            data: { ...batch, mentor: batch.mentors[0]?.mentor || null, students: batch.students.map(s => s.student) }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteBatch = async (req, res, next) => {
    try {
        await prisma.batch.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Batch deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

exports.addStudentsToBatch = async (req, res, next) => {
    try {
        const { studentIds } = req.body;
        const batchId = req.params.id;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, error: 'studentIds array is required.' });
        }

        const operations = studentIds.map(studentId =>
            prisma.batchStudent.upsert({
                where: { batchId_studentId: { batchId, studentId } },
                update: {},
                create: { batchId, studentId }
            })
        );
        await prisma.$transaction(operations);

        res.json({ success: true, message: `${studentIds.length} students added to batch.` });
    } catch (error) {
        next(error);
    }
};

exports.removeStudentFromBatch = async (req, res, next) => {
    try {
        await prisma.batchStudent.delete({
            where: { batchId_studentId: { batchId: req.params.id, studentId: req.params.studentId } }
        });
        res.json({ success: true, message: 'Student removed from batch.' });
    } catch (error) {
        next(error);
    }
};

exports.addMentorsToBatch = async (req, res, next) => {
    try {
        const { mentorIds } = req.body;
        const batchId = req.params.id;

        if (!mentorIds || !Array.isArray(mentorIds) || mentorIds.length === 0) {
            return res.status(400).json({ success: false, error: 'mentorIds array is required.' });
        }

        const operations = mentorIds.map(mentorId =>
            prisma.batchMentor.upsert({
                where: { batchId_mentorId: { batchId, mentorId } },
                update: {},
                create: { batchId, mentorId }
            })
        );
        await prisma.$transaction(operations);

        res.json({ success: true, message: `${mentorIds.length} mentors added to batch.` });
    } catch (error) {
        next(error);
    }
};

exports.removeMentorFromBatch = async (req, res, next) => {
    try {
        await prisma.batchMentor.delete({
            where: { batchId_mentorId: { batchId: req.params.id, mentorId: req.params.mentorId } }
        });
        res.json({ success: true, message: 'Mentor removed from batch.' });
    } catch (error) {
        next(error);
    }
};
