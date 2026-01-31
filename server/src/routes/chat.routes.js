const express = require('express');
const router = express.Router();

module.exports = (prisma, authenticateToken, requireRole, io) => {
    // Get all groups for user
    router.get('/groups', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;

            const memberships = await prisma.groupMember.findMany({
                where: {
                    userId,
                    status: 'accepted'
                },
                include: {
                    group: {
                        include: {
                            createdBy: { select: { name: true, avatar: true } },
                            members: {
                                where: { status: 'accepted' },
                                include: { user: { select: { name: true, avatar: true } } }
                            },
                            messages: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                                include: { sender: { select: { name: true } } }
                            }
                        }
                    }
                }
            });

            const groups = memberships.map(m => ({
                ...m.group,
                myRole: m.role
            }));

            res.json(groups);
        } catch (error) {
            console.error('Get groups error:', error);
            res.status(500).json({ error: 'Failed to fetch groups' });
        }
    });

    // Get pending invites
    router.get('/invites', authenticateToken, async (req, res) => {
        try {
            const invites = await prisma.groupMember.findMany({
                where: {
                    userId: req.user.id,
                    status: 'pending'
                },
                include: {
                    group: {
                        include: {
                            createdBy: { select: { name: true, avatar: true } }
                        }
                    }
                }
            });
            res.json(invites);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch invites' });
        }
    });

    // Create group
    router.post('/groups', authenticateToken, requireRole('MENTOR', 'ADMIN'), async (req, res) => {
        try {
            const { name, description, memberIds } = req.body;

            const group = await prisma.chatGroup.create({
                data: {
                    name,
                    description,
                    createdById: req.user.id,
                    members: {
                        create: [
                            { userId: req.user.id, role: 'admin', status: 'accepted' },
                            ...memberIds.map(id => ({ userId: id, role: 'member', status: 'pending' }))
                        ]
                    }
                },
                include: {
                    createdBy: { select: { name: true } },
                    members: { include: { user: { select: { name: true } } } }
                }
            });

            memberIds.forEach(userId => {
                io.to(`user_${userId}`).emit('group_invite', { group });
            });

            res.status(201).json(group);
        } catch (error) {
            console.error('Create group error:', error);
            res.status(500).json({ error: 'Failed to create group' });
        }
    });

    // Accept/Reject invite
    router.put('/invites/:id', authenticateToken, async (req, res) => {
        try {
            const { status } = req.body;

            const invite = await prisma.groupMember.update({
                where: { id: req.params.id },
                data: { status },
                include: { group: true }
            });

            if (status === 'accepted') {
                io.to(`group_${invite.groupId}`).emit('member_joined', {
                    groupId: invite.groupId,
                    userId: req.user.id
                });
            }

            res.json(invite);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update invite' });
        }
    });

    // Get messages for a group
    router.get('/groups/:groupId/messages', authenticateToken, async (req, res) => {
        try {
            const messages = await prisma.chatMessage.findMany({
                where: { groupId: req.params.groupId },
                include: {
                    sender: { select: { id: true, name: true, avatar: true } }
                },
                orderBy: { createdAt: 'asc' }
            });
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    });

    // Send message
    router.post('/groups/:groupId/messages', authenticateToken, async (req, res) => {
        try {
            const { content } = req.body;

            const message = await prisma.chatMessage.create({
                data: {
                    groupId: req.params.groupId,
                    senderId: req.user.id,
                    content
                },
                include: {
                    sender: { select: { id: true, name: true, avatar: true } }
                }
            });

            io.to(`group_${req.params.groupId}`).emit('new_message', message);

            res.status(201).json(message);
        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ error: 'Failed to send message' });
        }
    });

    // Get all users for inviting
    router.get('/users', authenticateToken, requireRole('MENTOR', 'ADMIN'), async (req, res) => {
        try {
            const users = await prisma.user.findMany({
                where: { role: 'STUDENT' },
                select: { id: true, name: true, email: true, avatar: true }
            });
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    });

    return router;
};
