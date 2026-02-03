const express = require('express');
const router = express.Router();

module.exports = (prisma, authenticateToken, requireRole) => {
    // =====================================================
    // ADMIN BATCH MANAGEMENT ROUTES
    // =====================================================

    /**
     * GET /api/batches/admin
     * List all batches with mentor info and student counts (Admin only)
     */
    router.get('/admin', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const batches = await prisma.batch.findMany({
                include: {
                    mentor: {
                        select: { id: true, name: true, email: true, avatar: true }
                    },
                    createdBy: {
                        select: { id: true, name: true }
                    },
                    _count: {
                        select: { students: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const formattedBatches = batches.map(batch => ({
                ...batch,
                studentCount: batch._count.students,
                _count: undefined
            }));

            res.json(formattedBatches);
        } catch (error) {
            console.error('Get batches error:', error);
            res.status(500).json({ error: 'Failed to fetch batches' });
        }
    });

    /**
     * GET /api/batches/admin/:id
     * Get single batch details with students (Admin only)
     */
    router.get('/admin/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const batch = await prisma.batch.findUnique({
                where: { id: req.params.id },
                include: {
                    mentor: {
                        select: { id: true, name: true, email: true, avatar: true, phone: true }
                    },
                    createdBy: {
                        select: { id: true, name: true }
                    },
                    students: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            createdAt: true,
                            profileCompleted: true
                        },
                        orderBy: { name: 'asc' }
                    }
                }
            });

            if (!batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            res.json(batch);
        } catch (error) {
            console.error('Get batch error:', error);
            res.status(500).json({ error: 'Failed to fetch batch' });
        }
    });

    /**
     * POST /api/batches/admin
     * Create a new batch (Admin only)
     */
    router.post('/admin', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const { name, description, mentorId, isActive = true } = req.body;

            // Validate required fields
            if (!name || !mentorId) {
                return res.status(400).json({ error: 'Name and mentor are required' });
            }

            // Verify mentor exists and has MENTOR role
            const mentor = await prisma.user.findUnique({
                where: { id: mentorId }
            });

            if (!mentor) {
                return res.status(404).json({ error: 'Mentor not found' });
            }

            if (mentor.role !== 'MENTOR') {
                return res.status(400).json({ error: 'Selected user is not a mentor' });
            }

            const batch = await prisma.batch.create({
                data: {
                    name,
                    description: description || null,
                    mentorId,
                    isActive,
                    createdById: req.user.id
                },
                include: {
                    mentor: {
                        select: { id: true, name: true, email: true, avatar: true }
                    }
                }
            });

            res.status(201).json(batch);
        } catch (error) {
            console.error('Create batch error:', error);
            res.status(500).json({ error: 'Failed to create batch' });
        }
    });

    /**
     * PUT /api/batches/admin/:id
     * Update batch details (Admin only)
     */
    router.put('/admin/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const { name, description, mentorId, isActive } = req.body;

            // Verify batch exists
            const existingBatch = await prisma.batch.findUnique({
                where: { id: req.params.id }
            });

            if (!existingBatch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            // If changing mentor, verify new mentor
            if (mentorId && mentorId !== existingBatch.mentorId) {
                const mentor = await prisma.user.findUnique({
                    where: { id: mentorId }
                });

                if (!mentor) {
                    return res.status(404).json({ error: 'Mentor not found' });
                }

                if (mentor.role !== 'MENTOR') {
                    return res.status(400).json({ error: 'Selected user is not a mentor' });
                }
            }

            const updatedBatch = await prisma.batch.update({
                where: { id: req.params.id },
                data: {
                    ...(name && { name }),
                    ...(description !== undefined && { description }),
                    ...(mentorId && { mentorId }),
                    ...(isActive !== undefined && { isActive })
                },
                include: {
                    mentor: {
                        select: { id: true, name: true, email: true, avatar: true }
                    },
                    _count: {
                        select: { students: true }
                    }
                }
            });

            res.json({
                ...updatedBatch,
                studentCount: updatedBatch._count.students,
                _count: undefined
            });
        } catch (error) {
            console.error('Update batch error:', error);
            res.status(500).json({ error: 'Failed to update batch' });
        }
    });

    /**
     * DELETE /api/batches/admin/:id
     * Delete batch (Admin only) - only if no students assigned
     */
    router.delete('/admin/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            // Check if batch has students
            const batch = await prisma.batch.findUnique({
                where: { id: req.params.id },
                include: {
                    _count: {
                        select: { students: true }
                    }
                }
            });

            if (!batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            if (batch._count.students > 0) {
                return res.status(400).json({ 
                    error: 'Cannot delete batch with assigned students. Remove or reassign students first.' 
                });
            }

            await prisma.batch.delete({
                where: { id: req.params.id }
            });

            res.json({ message: 'Batch deleted successfully' });
        } catch (error) {
            console.error('Delete batch error:', error);
            res.status(500).json({ error: 'Failed to delete batch' });
        }
    });

    // =====================================================
    // MENTOR BATCH ACCESS ROUTES
    // =====================================================

    /**
     * GET /api/batches/mentor
     * Get mentor's assigned batches with student list
     */
    router.get('/mentor', authenticateToken, requireRole('MENTOR'), async (req, res) => {
        try {
            const batches = await prisma.batch.findMany({
                where: { mentorId: req.user.id },
                include: {
                    students: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            createdAt: true,
                            profileCompleted: true
                        },
                        orderBy: { name: 'asc' }
                    },
                    _count: {
                        select: { students: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const formattedBatches = batches.map(batch => ({
                ...batch,
                studentCount: batch._count.students,
                _count: undefined
            }));

            res.json(formattedBatches);
        } catch (error) {
            console.error('Get mentor batches error:', error);
            res.status(500).json({ error: 'Failed to fetch batches' });
        }
    });

    /**
     * GET /api/batches/mentor/students
     * Get all students from mentor's batches
     */
    router.get('/mentor/students', authenticateToken, requireRole('MENTOR'), async (req, res) => {
        try {
            // Get all batches for this mentor
            const batches = await prisma.batch.findMany({
                where: { mentorId: req.user.id },
                select: { id: true }
            });

            const batchIds = batches.map(b => b.id);

            // Get students from these batches with progress data
            const students = await prisma.user.findMany({
                where: {
                    role: 'STUDENT',
                    batchId: { in: batchIds }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    createdAt: true,
                    profileCompleted: true,
                    batchId: true,
                    batch: {
                        select: { id: true, name: true }
                    },
                    sessionTrackings: {
                        select: {
                            completionPercentage: true,
                            attendanceMarked: true
                        }
                    },
                    loginLogs: {
                        take: 1,
                        orderBy: { loginDate: 'desc' }
                    }
                },
                orderBy: { name: 'asc' }
            });

            // Calculate progress metrics for each student
            const studentsWithMetrics = students.map(student => {
                const totalSessions = student.sessionTrackings.length;
                const completedSessions = student.sessionTrackings.filter(s => s.completionPercentage >= 80).length;
                const attendedSessions = student.sessionTrackings.filter(s => s.attendanceMarked).length;
                const avgCompletion = totalSessions > 0 
                    ? student.sessionTrackings.reduce((sum, s) => sum + s.completionPercentage, 0) / totalSessions 
                    : 0;

                return {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    avatar: student.avatar,
                    createdAt: student.createdAt,
                    profileCompleted: student.profileCompleted,
                    batch: student.batch,
                    lastLogin: student.loginLogs[0]?.loginDate || null,
                    metrics: {
                        totalSessions,
                        completedSessions,
                        attendedSessions,
                        avgCompletion: Math.round(avgCompletion),
                        attendanceRate: totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0
                    }
                };
            });

            res.json(studentsWithMetrics);
        } catch (error) {
            console.error('Get mentor students error:', error);
            res.status(500).json({ error: 'Failed to fetch students' });
        }
    });

    /**
     * GET /api/batches/mentor/reports
     * Get batch-level reports for mentor's batches
     */
    router.get('/mentor/reports', authenticateToken, requireRole('MENTOR'), async (req, res) => {
        try {
            // Get all batches for this mentor
            const batches = await prisma.batch.findMany({
                where: { mentorId: req.user.id },
                include: {
                    students: {
                        select: { id: true }
                    }
                }
            });

            const batchIds = batches.map(b => b.id);
            const studentIds = batches.flatMap(b => b.students.map(s => s.id));

            // Get aggregated metrics
            const [sessionStats, meetingCount, loginStats] = await Promise.all([
                // Session tracking stats
                prisma.sessionTracking.aggregate({
                    where: { userId: { in: studentIds } },
                    _avg: { completionPercentage: true },
                    _count: { id: true }
                }),
                // Meeting count
                prisma.meeting.count({
                    where: {
                        mentorship: { mentorId: req.user.id }
                    }
                }),
                // Login activity (last 30 days)
                prisma.loginLog.count({
                    where: {
                        userId: { in: studentIds },
                        loginDate: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                })
            ]);

            // Get at-risk students (low completion/attendance)
            const atRiskStudents = await prisma.user.findMany({
                where: {
                    id: { in: studentIds },
                    sessionTrackings: {
                        some: {
                            completionPercentage: { lt: 50 }
                        }
                    }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    batch: { select: { name: true } }
                },
                take: 10
            });

            res.json({
                summary: {
                    totalBatches: batches.length,
                    totalStudents: studentIds.length,
                    avgCompletionRate: Math.round(sessionStats._avg.completionPercentage || 0),
                    totalSessions: sessionStats._count.id,
                    totalMeetings: meetingCount,
                    activeLoginsLast30Days: loginStats
                },
                batches: batches.map(b => ({
                    id: b.id,
                    name: b.name,
                    studentCount: b.students.length,
                    isActive: b.isActive
                })),
                atRiskStudents
            });
        } catch (error) {
            console.error('Get mentor reports error:', error);
            res.status(500).json({ error: 'Failed to fetch reports' });
        }
    });

    return router;
};
