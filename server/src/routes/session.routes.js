const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

router.get('/', async (req, res, next) => {
    try {
        const sessions = await prisma.session.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json({ success: true, data: sessions });
    } catch (error) {
        next(error);
    }
});

router.get('/tracking', async (req, res, next) => {
    try {
        const trackings = await prisma.sessionTracking.findMany({
            where: { userId: req.user.id },
            include: { resource: { select: { title: true, type: true } } },
            orderBy: { updatedAt: 'desc' },
            take: 50
        });
        res.json({ success: true, data: trackings });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
