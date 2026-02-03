const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

module.exports = (prisma, authenticateToken, requireRole) => {
    // =====================================================
    // ADMIN STUDENT MANAGEMENT ROUTES
    // =====================================================

    /**
     * GET /api/students/admin
     * List all students with batch info (Admin only)
     */
    router.get('/admin', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const { batchId, search } = req.query;

            const whereClause = {
                role: 'STUDENT',
                ...(batchId && { batchId }),
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                })
            };

            const students = await prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    phone: true,
                    createdAt: true,
                    profileCompleted: true,
                    batch: {
                        select: { id: true, name: true, isActive: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json(students);
        } catch (error) {
            console.error('Get students error:', error);
            res.status(500).json({ error: 'Failed to fetch students' });
        }
    });

    /**
     * GET /api/students/admin/:id
     * Get single student details (Admin only)
     */
    router.get('/admin/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const student = await prisma.user.findUnique({
                where: { id: req.params.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    gender: true,
                    dateOfBirth: true,
                    educationLevel: true,
                    avatar: true,
                    createdAt: true,
                    profileCompleted: true,
                    batch: {
                        select: { id: true, name: true, isActive: true, mentor: { select: { name: true } } }
                    },
                    sessionTrackings: {
                        select: {
                            completionPercentage: true,
                            attendanceMarked: true
                        }
                    },
                    loginLogs: {
                        take: 5,
                        orderBy: { loginDate: 'desc' }
                    }
                }
            });

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            if (student.role !== 'STUDENT') {
                return res.status(400).json({ error: 'User is not a student' });
            }

            res.json(student);
        } catch (error) {
            console.error('Get student error:', error);
            res.status(500).json({ error: 'Failed to fetch student' });
        }
    });

    /**
     * POST /api/students/admin
     * Create a new student with batch assignment (Admin only)
     */
    router.post('/admin', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const { name, email, password, batchId, phone, gender, educationLevel } = req.body;

            // Validate required fields
            if (!name || !email || !batchId) {
                return res.status(400).json({ error: 'Name, email, and batch are required' });
            }

            // Check if email already exists
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Verify batch exists and is valid
            const batch = await prisma.batch.findUnique({
                where: { id: batchId }
            });

            if (!batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            // Generate password if not provided (default: first 4 chars of name + 1234)
            const defaultPassword = password || `${name.replace(/\s/g, '').substring(0, 4).toLowerCase()}1234`;
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            const student = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'STUDENT',
                    batchId,
                    phone: phone || null,
                    gender: gender || null,
                    educationLevel: educationLevel || null,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    createdAt: true,
                    batch: {
                        select: { id: true, name: true }
                    }
                }
            });

            res.status(201).json({
                ...student,
                generatedPassword: defaultPassword // Return for admin to share with student
            });
        } catch (error) {
            console.error('Create student error:', error);
            res.status(500).json({ error: 'Failed to create student' });
        }
    });

    /**
     * POST /api/students/admin/bulk
     * Bulk create students (Admin only)
     */
    router.post('/admin/bulk', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const { students, batchId } = req.body;

            if (!students || !Array.isArray(students) || students.length === 0) {
                return res.status(400).json({ error: 'Students array is required' });
            }

            if (!batchId) {
                return res.status(400).json({ error: 'Batch ID is required' });
            }

            // Verify batch exists
            const batch = await prisma.batch.findUnique({
                where: { id: batchId }
            });

            if (!batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            const results = {
                created: [],
                failed: []
            };

            for (const studentData of students) {
                try {
                    const { name, email, phone } = studentData;

                    if (!name || !email) {
                        results.failed.push({ email: email || 'unknown', reason: 'Name and email required' });
                        continue;
                    }

                    // Check if email exists
                    const existing = await prisma.user.findUnique({
                        where: { email }
                    });

                    if (existing) {
                        results.failed.push({ email, reason: 'Email already exists' });
                        continue;
                    }

                    const defaultPassword = `${name.replace(/\s/g, '').substring(0, 4).toLowerCase()}1234`;
                    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

                    const student = await prisma.user.create({
                        data: {
                            name,
                            email,
                            password: hashedPassword,
                            role: 'STUDENT',
                            batchId,
                            phone: phone || null,
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`
                        }
                    });

                    results.created.push({
                        id: student.id,
                        name: student.name,
                        email: student.email,
                        generatedPassword: defaultPassword
                    });
                } catch (err) {
                    results.failed.push({ email: studentData.email, reason: err.message });
                }
            }

            res.status(201).json(results);
        } catch (error) {
            console.error('Bulk create students error:', error);
            res.status(500).json({ error: 'Failed to create students' });
        }
    });

    /**
     * PUT /api/students/admin/:id
     * Update student details (Admin only)
     */
    router.put('/admin/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const { name, email, batchId, phone, gender, educationLevel } = req.body;

            // Verify student exists
            const existingStudent = await prisma.user.findUnique({
                where: { id: req.params.id }
            });

            if (!existingStudent) {
                return res.status(404).json({ error: 'Student not found' });
            }

            if (existingStudent.role !== 'STUDENT') {
                return res.status(400).json({ error: 'User is not a student' });
            }

            // If changing batch, verify new batch exists
            if (batchId && batchId !== existingStudent.batchId) {
                const batch = await prisma.batch.findUnique({
                    where: { id: batchId }
                });

                if (!batch) {
                    return res.status(404).json({ error: 'Batch not found' });
                }
            }

            // If changing email, check it's not taken
            if (email && email !== existingStudent.email) {
                const emailExists = await prisma.user.findUnique({
                    where: { email }
                });

                if (emailExists) {
                    return res.status(400).json({ error: 'Email already in use' });
                }
            }

            const updatedStudent = await prisma.user.update({
                where: { id: req.params.id },
                data: {
                    ...(name && { name }),
                    ...(email && { email }),
                    ...(batchId && { batchId }),
                    ...(phone !== undefined && { phone }),
                    ...(gender !== undefined && { gender }),
                    ...(educationLevel !== undefined && { educationLevel })
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatar: true,
                    batch: {
                        select: { id: true, name: true }
                    }
                }
            });

            res.json(updatedStudent);
        } catch (error) {
            console.error('Update student error:', error);
            res.status(500).json({ error: 'Failed to update student' });
        }
    });

    /**
     * PUT /api/students/admin/:id/reset-password
     * Reset student password (Admin only)
     */
    router.put('/admin/:id/reset-password', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const student = await prisma.user.findUnique({
                where: { id: req.params.id }
            });

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            if (student.role !== 'STUDENT') {
                return res.status(400).json({ error: 'User is not a student' });
            }

            // Generate new password
            const newPassword = `${student.name.replace(/\s/g, '').substring(0, 4).toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await prisma.user.update({
                where: { id: req.params.id },
                data: { password: hashedPassword }
            });

            res.json({
                message: 'Password reset successful',
                newPassword
            });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Failed to reset password' });
        }
    });

    /**
     * DELETE /api/students/admin/:id
     * Delete student (Admin only)
     */
    router.delete('/admin/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const student = await prisma.user.findUnique({
                where: { id: req.params.id }
            });

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            if (student.role !== 'STUDENT') {
                return res.status(400).json({ error: 'User is not a student' });
            }

            // Delete related data first (to maintain referential integrity)
            await prisma.$transaction([
                prisma.sessionTracking.deleteMany({ where: { userId: req.params.id } }),
                prisma.loginLog.deleteMany({ where: { userId: req.params.id } }),
                prisma.notification.deleteMany({ where: { userId: req.params.id } }),
                prisma.activity.deleteMany({ where: { userId: req.params.id } }),
                prisma.achievement.deleteMany({ where: { userId: req.params.id } }),
                prisma.forumAnswer.deleteMany({ where: { authorId: req.params.id } }),
                prisma.forumPost.deleteMany({ where: { authorId: req.params.id } }),
                prisma.groupMember.deleteMany({ where: { userId: req.params.id } }),
                prisma.chatMessage.deleteMany({ where: { senderId: req.params.id } }),
                prisma.mentorship.deleteMany({ where: { menteeId: req.params.id } }),
                prisma.user.delete({ where: { id: req.params.id } })
            ]);

            res.json({ message: 'Student deleted successfully' });
        } catch (error) {
            console.error('Delete student error:', error);
            res.status(500).json({ error: 'Failed to delete student' });
        }
    });

    /**
     * GET /api/students/admin/unassigned
     * Get students without batch assignment (for migration/cleanup)
     */
    router.get('/admin/unassigned', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const unassignedStudents = await prisma.user.findMany({
                where: {
                    role: 'STUDENT',
                    batchId: null
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json(unassignedStudents);
        } catch (error) {
            console.error('Get unassigned students error:', error);
            res.status(500).json({ error: 'Failed to fetch unassigned students' });
        }
    });

    /**
     * PUT /api/students/admin/assign-batch
     * Bulk assign students to a batch (Admin only)
     */
    router.put('/admin/assign-batch', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const { studentIds, batchId } = req.body;

            if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                return res.status(400).json({ error: 'Student IDs array is required' });
            }

            if (!batchId) {
                return res.status(400).json({ error: 'Batch ID is required' });
            }

            // Verify batch exists
            const batch = await prisma.batch.findUnique({
                where: { id: batchId }
            });

            if (!batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            const result = await prisma.user.updateMany({
                where: {
                    id: { in: studentIds },
                    role: 'STUDENT'
                },
                data: { batchId }
            });

            res.json({
                message: `${result.count} students assigned to batch`,
                count: result.count
            });
        } catch (error) {
            console.error('Assign batch error:', error);
            res.status(500).json({ error: 'Failed to assign students to batch' });
        }
    });

    return router;
};
