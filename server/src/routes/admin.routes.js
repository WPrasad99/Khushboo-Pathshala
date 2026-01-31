const express = require('express');
const router = express.Router();

module.exports = (prisma, authenticateToken, requireRole) => {
    // Get all users
    router.get('/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    phone: true,
                    avatar: true,
                    createdAt: true,
                    profileCompleted: true
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    });

    // Update user role
    router.put('/users/:id/role', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const { role } = req.body;

            const user = await prisma.user.update({
                where: { id: req.params.id },
                data: { role },
                select: { id: true, name: true, role: true }
            });

            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update user role' });
        }
    });

    // Get reports
    router.get('/reports', authenticateToken, requireRole('ADMIN'), async (req, res) => {
        try {
            const [
                totalStudents,
                totalMentors,
                totalResources,
                totalSessions,
                recentTrackings
            ] = await Promise.all([
                prisma.user.count({ where: { role: 'STUDENT' } }),
                prisma.user.count({ where: { role: 'MENTOR' } }),
                prisma.learningResource.count(),
                prisma.session.count(),
                prisma.sessionTracking.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: { select: { name: true } },
                        resource: { select: { title: true } }
                    }
                })
            ]);

            res.json({
                stats: {
                    totalStudents,
                    totalMentors,
                    totalResources,
                    totalSessions
                },
                recentTrackings
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch reports' });
        }
    });

    return router;
};
