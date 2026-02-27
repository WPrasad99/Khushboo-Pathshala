const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const config = require('../config');

exports.getDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                loginLogs: { orderBy: { loginDate: 'desc' }, take: 10 },
                achievements: true,
                activities: { orderBy: { createdAt: 'desc' }, take: 5 }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        const [totalResources, totalQuizzes, completedQuizzes] = await Promise.all([
            prisma.learningResource.count(),
            prisma.quiz.count(),
            prisma.quizSubmission.count({ where: { studentId: userId, status: 'COMPLETED' } })
        ]);

        res.json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, role: user.role, avatar: user.avatar },
                stats: { totalResources, totalQuizzes, completedQuizzes },
                recentActivity: user.activities,
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getStudentDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [batches, activities, assignments, trackings] = await Promise.all([
            prisma.batchStudent.findMany({
                where: { studentId: userId },
                include: {
                    batch: {
                        include: {
                            mentors: { include: { mentor: { select: { name: true, avatar: true } } } }
                        }
                    }
                }
            }),
            prisma.activity.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),
            prisma.assignment.findMany({
                where: {
                    batch: { students: { some: { studentId: userId } } },
                    dueDate: { gte: new Date() },
                    deletedAt: null
                },
                take: 5,
                orderBy: { dueDate: 'asc' }
            }),
            prisma.sessionTracking.findMany({ where: { userId } })
        ]);

        const avgProgress = trackings.length > 0
            ? trackings.reduce((acc, curr) => acc + curr.completionPercentage, 0) / trackings.length
            : 0;

        res.json({
            success: true,
            data: {
                batches: batches.map(b => b.batch),
                activities,
                upcomingAssignments: assignments,
                stats: {
                    avgProgress: Math.round(avgProgress),
                    attendanceCount: trackings.filter(t => t.attendanceMarked).length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true, name: true, email: true, role: true, avatar: true,
                phone: true, gender: true, dateOfBirth: true, educationLevel: true,
                bio: true, skills: true, hobbies: true, profileCompleted: true, createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

/**
 * ISSUE #11 FIX: Explicit allowlist prevents mass assignment.
 * Only these specific fields can be updated via profile endpoint.
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const allowedFields = ['name', 'phone', 'gender', 'dateOfBirth', 'educationLevel', 'bio', 'skills', 'hobbies', 'avatar'];
        const updateData = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        // Validate dateOfBirth if provided
        if (updateData.dateOfBirth) {
            const parsed = new Date(updateData.dateOfBirth);
            if (isNaN(parsed.getTime())) {
                return res.status(400).json({ success: false, error: 'Invalid date of birth.' });
            }
            updateData.dateOfBirth = parsed;
        }

        updateData.profileCompleted = true;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true, name: true, email: true, role: true, avatar: true,
                phone: true, gender: true, dateOfBirth: true, educationLevel: true,
                bio: true, skills: true, hobbies: true, profileCompleted: true
            }
        });

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

exports.uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded.' });
        }

        const avatarUrl = `/uploads/${req.file.filename}`;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { avatar: avatarUrl },
            select: { id: true, avatar: true }
        });

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

exports.getLoginHistory = async (req, res, next) => {
    try {
        const logs = await prisma.loginLog.findMany({
            where: { userId: req.user.id },
            orderBy: { loginDate: 'desc' },
            take: 20
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Current and new password are required.' });
        }
        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Block password change for Google-only accounts
        if (user.password.startsWith('GOOGLE_OAUTH_')) {
            return res.status(400).json({ success: false, error: 'Google accounts cannot change password here.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        next(error);
    }
};
