const prisma = require('../config/prisma');

/**
 * Verify that two users share a batch or mentorship.
 * Admins can message anyone.
 */
const verifyRelationship = async (user1Id, user2Id, user1Role) => {
    if (user1Role === 'ADMIN') return true;

    const sharedBatch = await prisma.batch.findFirst({
        where: {
            AND: [
                { OR: [{ students: { some: { studentId: user1Id } } }, { mentors: { some: { mentorId: user1Id } } }] },
                { OR: [{ students: { some: { studentId: user2Id } } }, { mentors: { some: { mentorId: user2Id } } }] }
            ]
        }
    });
    if (sharedBatch) return true;

    const mentorship = await prisma.mentorship.findFirst({
        where: {
            OR: [
                { mentorId: user1Id, menteeId: user2Id },
                { mentorId: user2Id, menteeId: user1Id }
            ],
            status: 'ACTIVE',
            deletedAt: null
        }
    });
    return !!mentorship;
};

exports.getGroups = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const groups = await prisma.chatGroup.findMany({
            where: { members: { some: { userId } } },
            include: {
                members: { include: { user: { select: { id: true, name: true, avatar: true, role: true } } } },
                createdBy: { select: { id: true, name: true, avatar: true } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: { name: true } } } },
                batch: { select: { id: true, name: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json({ success: true, data: groups });
    } catch (error) {
        next(error);
    }
};

/**
 * ISSUE #8 FIX: Fetch user names from DB instead of relying on JWT payload.
 * ISSUE #9 FIX: Use req.app.get('io') instead of non-existent global.io.
 */
exports.createDirectMessage = async (req, res, next) => {
    try {
        const { userId: targetUserId } = req.body;
        const currentUserId = req.user.id;

        if (!targetUserId) {
            return res.status(400).json({ success: false, error: 'Target user ID is required.' });
        }
        if (targetUserId === currentUserId) {
            return res.status(400).json({ success: false, error: 'Cannot message yourself.' });
        }

        const isAuthorized = await verifyRelationship(currentUserId, targetUserId, req.user.role);
        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only message users in your batch or assigned mentees/mentors.'
            });
        }

        // Check if DM already exists
        let group = await prisma.chatGroup.findFirst({
            where: {
                groupType: 'direct',
                AND: [
                    { members: { some: { userId: currentUserId } } },
                    { members: { some: { userId: targetUserId } } }
                ]
            },
            include: {
                members: { include: { user: { select: { id: true, name: true, avatar: true, role: true } } } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        });

        if (group) {
            return res.json({ success: true, data: group });
        }

        // ISSUE #8 FIX: Fetch both user names from DB
        const [currentUser, otherUser] = await Promise.all([
            prisma.user.findUnique({ where: { id: currentUserId }, select: { name: true } }),
            prisma.user.findUnique({ where: { id: targetUserId }, select: { name: true } })
        ]);

        if (!otherUser) {
            return res.status(404).json({ success: false, error: 'Target user not found.' });
        }

        group = await prisma.chatGroup.create({
            data: {
                name: `DM: ${currentUser.name} & ${otherUser.name}`,
                groupType: 'direct',
                createdById: currentUserId,
                members: {
                    create: [
                        { userId: currentUserId, role: 'member', status: 'accepted' },
                        { userId: targetUserId, role: 'member', status: 'accepted' }
                    ]
                }
            },
            include: {
                members: { include: { user: { select: { id: true, name: true, avatar: true, role: true } } } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        });

        // ISSUE #9 FIX: Use app-level io, not global.io
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${targetUserId}`).emit('group:created', { group });
        }

        res.status(201).json({ success: true, data: group });
    } catch (error) {
        next(error);
    }
};

exports.getMessages = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const membership = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } }
        });
        if (!membership) {
            return res.status(403).json({ success: false, error: 'Access denied to this conversation.' });
        }

        const messages = await prisma.chatMessage.findMany({
            where: { groupId },
            include: {
                sender: { select: { id: true, name: true, avatar: true, role: true } },
                reads: { include: { user: { select: { id: true, name: true } } } },
                reactions: { include: { user: { select: { id: true, name: true } } } }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

exports.sendMessage = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { content, attachments } = req.body;
        const userId = req.user.id;

        if (!content && !attachments) {
            return res.status(400).json({ success: false, error: 'Message content or attachments required.' });
        }

        const membership = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } }
        });
        if (!membership) {
            return res.status(403).json({ success: false, error: 'Access denied to this conversation.' });
        }

        const message = await prisma.chatMessage.create({
            data: { groupId, senderId: userId, content: content || '', attachments },
            include: { sender: { select: { id: true, name: true, avatar: true, role: true } } }
        });

        await prisma.chatGroup.update({
            where: { id: groupId },
            data: { updatedAt: new Date() }
        });

        // ISSUE #9 FIX: Use req.app.get('io')
        const io = req.app.get('io');
        if (io) {
            io.to(`group_${groupId}`).emit('message:received', message);
        }

        res.status(201).json({ success: true, data: message });
    } catch (error) {
        next(error);
    }
};

exports.getContacts = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let students = [];
        let mentors = [];

        if (userRole === 'ADMIN') {
            [students, mentors] = await Promise.all([
                prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true, name: true, avatar: true, role: true } }),
                prisma.user.findMany({ where: { role: 'MENTOR' }, select: { id: true, name: true, avatar: true, role: true } })
            ]);
        } else {
            const userBatches = await prisma.batch.findMany({
                where: {
                    OR: [
                        { students: { some: { studentId: userId } } },
                        { mentors: { some: { mentorId: userId } } }
                    ]
                },
                include: {
                    students: { include: { student: { select: { id: true, name: true, avatar: true, role: true } } } },
                    mentors: { include: { mentor: { select: { id: true, name: true, avatar: true, role: true } } } }
                }
            });

            const uniqueUsers = new Map();
            userBatches.forEach(batch => {
                batch.students.forEach(bs => {
                    if (bs.student.id !== userId) uniqueUsers.set(bs.student.id, bs.student);
                });
                batch.mentors.forEach(bm => {
                    if (bm.mentor.id !== userId) uniqueUsers.set(bm.mentor.id, bm.mentor);
                });
            });

            if (userRole === 'MENTOR') {
                const mentees = await prisma.mentorship.findMany({
                    where: { mentorId: userId, status: 'ACTIVE' },
                    include: { mentee: { select: { id: true, name: true, avatar: true, role: true } } }
                });
                mentees.forEach(m => uniqueUsers.set(m.mentee.id, m.mentee));
            }

            const allContacts = Array.from(uniqueUsers.values());
            students = allContacts.filter(u => u.role === 'STUDENT');
            mentors = allContacts.filter(u => u.role === 'MENTOR');
        }

        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN', id: { not: userId } },
            select: { id: true, name: true, avatar: true, role: true }
        });

        res.json({ success: true, data: { students, mentors, admins } });
    } catch (error) {
        next(error);
    }
};

// ── Dummy / Missing endpoints for Frontend Compatibility ──

exports.createGroup = async (req, res, next) => {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
};

exports.createBatchGroup = async (req, res, next) => {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
};

exports.getInvites = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

exports.respondToInvite = async (req, res, next) => {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
};

exports.uploadFiles = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded.' });
        }
        const fileUrls = req.files.map(f => `/uploads/${f.filename}`);
        res.json({ success: true, data: fileUrls });
    } catch (error) {
        next(error);
    }
};

exports.getUsers = async (req, res, next) => {
    res.status(501).json({ success: false, error: 'Not implemented yet' });
};

