const express = require('express');
const router = express.Router();

module.exports = (prisma, authenticateToken, requireRole) => {
    // Get all resources (with optional category filter)
    router.get('/', authenticateToken, async (req, res) => {
        try {
            const { category } = req.query;

            const where = category && category !== 'all'
                ? { category: category.toUpperCase() }
                : {};

            const resources = await prisma.learningResource.findMany({
                where,
                include: {
                    uploadedBy: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Get user's tracking for each resource
            const userId = req.user.id;
            const trackings = await prisma.sessionTracking.findMany({
                where: { userId }
            });

            const trackingMap = {};
            trackings.forEach(t => {
                trackingMap[t.resourceId] = t;
            });

            const resourcesWithProgress = resources.map(r => ({
                ...r,
                userProgress: trackingMap[r.id] || null
            }));

            res.json(resourcesWithProgress);
        } catch (error) {
            console.error('Resources error:', error);
            res.status(500).json({ error: 'Failed to fetch resources' });
        }
    });

    // Get single resource
    router.get('/:id', authenticateToken, async (req, res) => {
        try {
            const resource = await prisma.learningResource.findUnique({
                where: { id: req.params.id },
                include: {
                    uploadedBy: { select: { name: true } }
                }
            });

            if (!resource) {
                return res.status(404).json({ error: 'Resource not found' });
            }

            const tracking = await prisma.sessionTracking.findFirst({
                where: {
                    userId: req.user.id,
                    resourceId: resource.id
                }
            });

            res.json({ ...resource, userProgress: tracking });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch resource' });
        }
    });

    // Create resource (Mentor/Admin only)
    router.post('/', authenticateToken, requireRole('MENTOR', 'ADMIN'), async (req, res) => {
        try {
            const { title, description, category, videoUrl, duration, thumbnailUrl, lessonsCount, isHot } = req.body;

            if (!title || !description || !category || !videoUrl) {
                return res.status(400).json({ error: 'Title, description, category, and videoUrl are required' });
            }

            const durationValue = Number(duration);
            if (!Number.isFinite(durationValue) || durationValue <= 0) {
                return res.status(400).json({ error: 'Duration must be a positive number' });
            }

            const categoryValue = String(category).toUpperCase();
            const validCategories = ['TECHNICAL_SKILLS', 'SOFT_SKILLS', 'CAREER_GUIDANCE'];
            if (!validCategories.includes(categoryValue)) {
                return res.status(400).json({ error: `Invalid category. Use one of: ${validCategories.join(', ')}` });
            }

            const lessonsCountValue = lessonsCount !== undefined ? Number(lessonsCount) : undefined;
            if (lessonsCountValue !== undefined && (!Number.isInteger(lessonsCountValue) || lessonsCountValue <= 0)) {
                return res.status(400).json({ error: 'lessonsCount must be a positive integer' });
            }

            const resource = await prisma.learningResource.create({
                data: {
                    title,
                    description,
                    category: categoryValue,
                    videoUrl,
                    duration: durationValue,
                    thumbnailUrl,
                    lessonsCount: lessonsCountValue || 1,
                    isHot: isHot || false,
                    uploadedById: req.user.id
                }
            });

            res.status(201).json(resource);
        } catch (error) {
            console.error('Create resource error:', error);
            res.status(500).json({ error: 'Failed to create resource' });
        }
    });

    // Track video progress
    router.post('/:id/track', authenticateToken, async (req, res) => {
        try {
            const { watchDuration, totalDuration, dropOffPoint } = req.body;
            const resourceId = req.params.id;
            const userId = req.user.id;

            const totalDurationValue = Number(totalDuration);
            const watchDurationValue = Number(watchDuration);
            const dropOffPointValue = dropOffPoint === undefined ? 0 : Number(dropOffPoint);

            if (!Number.isFinite(totalDurationValue) || totalDurationValue <= 0) {
                return res.status(400).json({ error: 'totalDuration must be a positive number' });
            }
            if (!Number.isFinite(watchDurationValue) || watchDurationValue < 0) {
                return res.status(400).json({ error: 'watchDuration must be a non-negative number' });
            }
            if (!Number.isFinite(dropOffPointValue) || dropOffPointValue < 0) {
                return res.status(400).json({ error: 'dropOffPoint must be a non-negative number' });
            }

            const resource = await prisma.learningResource.findUnique({
                where: { id: resourceId },
                select: { id: true }
            });
            if (!resource) {
                return res.status(404).json({ error: 'Resource not found' });
            }

            const normalizedWatch = Math.min(watchDurationValue, totalDurationValue);
            const normalizedDropOff = Math.min(dropOffPointValue, totalDurationValue);
            const completionPercentage = Math.min(100, (normalizedWatch / totalDurationValue) * 100);
            const attendanceMarked = completionPercentage >= 80;

            const existing = await prisma.sessionTracking.findFirst({
                where: { userId, resourceId }
            });

            let tracking;
            if (existing) {
                tracking = await prisma.sessionTracking.update({
                    where: { id: existing.id },
                    data: {
                        watchDuration: Math.max(existing.watchDuration, normalizedWatch),
                        totalDuration: totalDurationValue,
                        dropOffPoint: normalizedDropOff,
                        completionPercentage: Math.max(existing.completionPercentage, completionPercentage),
                        attendanceMarked: existing.attendanceMarked || attendanceMarked
                    }
                });
            } else {
                tracking = await prisma.sessionTracking.create({
                    data: {
                        userId,
                        resourceId,
                        watchDuration: normalizedWatch,
                        totalDuration: totalDurationValue,
                        dropOffPoint: normalizedDropOff,
                        completionPercentage,
                        attendanceMarked
                    }
                });
            }

            res.json({ tracking, attendanceMarked });
        } catch (error) {
            console.error('Track error:', error);
            res.status(500).json({ error: 'Failed to track progress' });
        }
    });

    return router;
};
