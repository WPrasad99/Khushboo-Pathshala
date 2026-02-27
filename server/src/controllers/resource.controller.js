const prisma = require('../config/prisma');
const { fetchPlaylistData } = require('../utils/youtube.util');

/**
 * GET /api/resources
 * ISSUE #6 FIX: Proper AND/OR composition for batch visibility + type filtering.
 */
exports.getResources = async (req, res, next) => {
    try {
        const { category, type } = req.query;
        const userId = req.user.id;

        const conditions = [];

        // Batch visibility for students
        if (req.user.role === 'STUDENT') {
            const userBatches = await prisma.batchStudent.findMany({
                where: { studentId: userId },
                select: { batchId: true }
            });
            const batchIds = userBatches.map(b => b.batchId);
            conditions.push({
                OR: [{ batchId: { in: batchIds } }, { batchId: null }]
            });
        }

        // Category filter
        if (category && category !== 'all') {
            conditions.push({ category: category.toUpperCase() });
        }

        // Type filter
        if (type) {
            if (type === 'COURSE') {
                conditions.push({ OR: [{ type: 'COURSE' }, { type: null }] });
            } else {
                conditions.push({ type });
            }
        }

        const where = conditions.length > 0 ? { AND: conditions } : {};

        const resources = await prisma.learningResource.findMany({
            where,
            include: {
                uploadedBy: { select: { name: true, avatar: true } },
                batch: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Attach user progress
        const trackings = await prisma.sessionTracking.findMany({ where: { userId } });
        const trackingMap = new Map();
        trackings.forEach(t => trackingMap.set(t.resourceId, t));

        const data = resources.map(r => ({
            ...r,
            userProgress: trackingMap.get(r.id) || null
        }));

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.getResource = async (req, res, next) => {
    try {
        const resource = await prisma.learningResource.findUnique({
            where: { id: req.params.id },
            include: { uploadedBy: { select: { name: true } } }
        });

        if (!resource) {
            return res.status(404).json({ success: false, error: 'Resource not found.' });
        }

        const tracking = await prisma.sessionTracking.findFirst({
            where: { userId: req.user.id, resourceId: resource.id }
        });

        res.json({ success: true, data: { ...resource, userProgress: tracking } });
    } catch (error) {
        next(error);
    }
};

exports.createResource = async (req, res, next) => {
    try {
        const { title, description, category, videoUrl, duration, thumbnailUrl, lessonsCount, isHot, batchId, type } = req.body;

        if (!title || !category) {
            return res.status(400).json({ success: false, error: 'Title and category are required.' });
        }

        let finalThumbnailUrl = thumbnailUrl;
        let lessons = [];
        let finalLessonsCount = lessonsCount || 1;

        // YouTube playlist auto-parsing
        if (videoUrl && videoUrl.includes('list=')) {
            try {
                const urlObj = new URL(videoUrl);
                const listId = urlObj.searchParams.get('list');
                if (listId) {
                    const playlistLessons = await fetchPlaylistData(listId);
                    if (playlistLessons && playlistLessons.length > 0) {
                        lessons = playlistLessons;
                        finalLessonsCount = playlistLessons.length;
                        if (!finalThumbnailUrl && playlistLessons[0].thumbnailUrl) {
                            finalThumbnailUrl = playlistLessons[0].thumbnailUrl;
                        }
                    }
                }
            } catch (urlError) {
                // Invalid URL, continue without playlist parsing
            }
        }

        const resource = await prisma.learningResource.create({
            data: {
                title: title.trim(),
                description: description || '',
                category,
                videoUrl: videoUrl || '',
                duration: parseInt(duration) || 0,
                thumbnailUrl: finalThumbnailUrl || null,
                lessonsCount: finalLessonsCount,
                lessons: lessons.length > 0 ? lessons : undefined,
                isHot: isHot || false,
                batchId: batchId || null,
                type: type || 'RESOURCE',
                uploadedById: req.user.id
            }
        });

        res.status(201).json({ success: true, data: resource });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/resources/:id/track
 * ISSUE #7 FIX: Guards against division by zero.
 */
exports.trackProgress = async (req, res, next) => {
    try {
        const { watchDuration, totalDuration, dropOffPoint } = req.body;
        const resourceId = req.params.id;
        const userId = req.user.id;

        // Validate numeric inputs
        const watchDur = Number(watchDuration) || 0;
        const totalDur = Number(totalDuration) || 0;
        const dropOff = Number(dropOffPoint) || 0;

        if (watchDur < 0 || totalDur < 0) {
            return res.status(400).json({ success: false, error: 'Duration values must be non-negative.' });
        }

        // ISSUE #7 FIX: Prevent division by zero
        const completionPercentage = totalDur > 0 ? Math.min((watchDur / totalDur) * 100, 100) : 0;
        const attendanceMarked = completionPercentage >= 80;

        const existing = await prisma.sessionTracking.findFirst({
            where: { userId, resourceId }
        });

        let tracking;
        if (existing) {
            tracking = await prisma.sessionTracking.update({
                where: { id: existing.id },
                data: {
                    watchDuration: Math.max(existing.watchDuration, watchDur),
                    totalDuration: totalDur,
                    dropOffPoint: dropOff,
                    completionPercentage: Math.min(Math.max(existing.completionPercentage, completionPercentage), 100),
                    attendanceMarked: existing.attendanceMarked || attendanceMarked
                }
            });
        } else {
            tracking = await prisma.sessionTracking.create({
                data: { userId, resourceId, watchDuration: watchDur, totalDuration: totalDur, dropOffPoint: dropOff, completionPercentage, attendanceMarked }
            });
        }

        res.json({ success: true, data: { tracking, attendanceMarked } });
    } catch (error) {
        next(error);
    }
};

exports.getStudentResources = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userBatches = await prisma.batchStudent.findMany({
            where: { studentId: userId },
            select: { batchId: true }
        });
        const batchIds = userBatches.map(b => b.batchId);

        const resources = await prisma.learningResource.findMany({
            where: {
                OR: [{ batchId: { in: batchIds } }, { batchId: null }]
            },
            include: {
                uploadedBy: { select: { name: true } },
                sessionTrackings: { where: { userId } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: resources });
    } catch (error) {
        next(error);
    }
};
