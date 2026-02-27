const prisma = require('../config/prisma');

exports.getAnnouncements = async (req, res, next) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: { select: { id: true, name: true, avatar: true } },
                batches: { include: { batch: { select: { id: true, name: true } } } }
            }
        });
        res.json({ success: true, data: announcements });
    } catch (error) {
        next(error);
    }
};

exports.createAnnouncement = async (req, res, next) => {
    try {
        const { title, content, priority = 'normal', batchIds = [] } = req.body;

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Title is required.' });
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Content is required.' });
        }

        const validPriorities = ['low', 'normal', 'high'];
        const finalPriority = validPriorities.includes(priority) ? priority : 'normal';

        const announcement = await prisma.announcement.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                priority: finalPriority,
                createdById: req.user.id,
                ...(Array.isArray(batchIds) && batchIds.length > 0 && {
                    batches: { create: batchIds.map(batchId => ({ batchId })) }
                })
            },
            include: {
                createdBy: { select: { id: true, name: true, avatar: true } },
                batches: { include: { batch: { select: { id: true, name: true } } } }
            }
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('announcement:created', announcement);
        }

        res.status(201).json({ success: true, data: announcement });
    } catch (error) {
        next(error);
    }
};
