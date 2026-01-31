const express = require('express');
const router = express.Router();

module.exports = (prisma, authenticateToken) => {
    // Get all sessions
    router.get('/', authenticateToken, async (req, res) => {
        try {
            const sessions = await prisma.session.findMany({
                orderBy: { scheduledAt: 'asc' }
            });
            res.json(sessions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    });

    // Get user's session tracking
    router.get('/tracking', authenticateToken, async (req, res) => {
        try {
            const trackings = await prisma.sessionTracking.findMany({
                where: { userId: req.user.id },
                include: {
                    resource: true
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(trackings);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch session tracking' });
        }
    });

    return router;
};
