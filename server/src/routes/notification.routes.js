const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// GET /api/notifications — fetch current user's notifications
router.get('/', async (req, res, next) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json({ success: true, data: notifications });
    } catch (error) {
        next(error);
    }
});

// PUT /api/notifications/:id/read — mark single notification as read
router.put('/:id/read', async (req, res, next) => {
    try {
        const notification = await prisma.notification.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { read: true, readAt: new Date() }
        });
        res.json({ success: true, data: notification });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
