// ============ READ RECEIPTS & REACTIONS ENDPOINTS ============

// Mark messages as read
app.post('/api/chat/groups/:groupId/messages/read', authenticateToken, async (req, res) => {
    try {
        const { messageIds } = req.body;
        const userId = req.user.id;

        // Create read receipt for each message
        const reads = await Promise.all(
            messageIds.map(messageId =>
                prisma.messageRead.upsert({
                    where: {
                        messageId_userId: {
                            messageId,
                            userId
                        }
                    },
                    create: {
                        messageId,
                        userId
                    },
                    update: {
                        readAt: new Date()
                    }
                })
            )
        );

        res.json({ success: true, reads });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Get message read status
app.get('/api/chat/messages/:messageId/reads', authenticateToken, async (req, res) => {
    try {
        const reads = await prisma.messageRead.findMany({
            where: { messageId: req.params.messageId },
            include: {
                user: { select: { id: true, name: true, avatar: true } }
            }
        });

        res.json(reads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch read status' });
    }
});

// Add reaction to message
app.post('/api/chat/messages/:messageId/reactions', authenticateToken, async (req, res) => {
    try {
        const { emoji } = req.body;
        const messageId = req.params.messageId;
        const userId = req.user.id;

        const reaction = await prisma.messageReaction.upsert({
            where: {
                messageId_userId_emoji: {
                    messageId,
                    userId,
                    emoji
                }
            },
            create: {
                messageId,
                userId,
                emoji
            },
            update: {},
            include: {
                user: { select: { id: true, name: true, avatar: true } }
            }
        });

        // Broadcast reaction to group
        const message = await prisma.chatMessage.findUnique({
            where: { id: messageId }
        });

        io.to(`group_${message.groupId}`).emit('message_reaction', {
            messageId,
            reaction
        });

        res.status(201).json(reaction);
    } catch (error) {
        console.error('Add reaction error:', error);
        res.status(500).json({ error: 'Failed to add reaction' });
    }
});

// Remove reaction from message
app.delete('/api/chat/messages/:messageId/reactions/:emoji', authenticateToken, async (req, res) => {
    try {
        const { messageId, emoji } = req.params;
        const userId = req.user.id;

        await prisma.messageReaction.delete({
            where: {
                messageId_userId_emoji: {
                    messageId,
                    userId,
                    emoji
                }
            }
        });

        // Broadcast reaction removal
        const message = await prisma.chatMessage.findUnique({
            where: { id: messageId }
        });

        io.to(`group_${message.groupId}`).emit('reaction_removed', {
            messageId,
            userId,
            emoji
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Remove reaction error:', error);
        res.status(500).json({ error: 'Failed to remove reaction' });
    }
});

// Get reactions for a message
app.get('/api/chat/messages/:messageId/reactions', authenticateToken, async (req, res) => {
    try {
        const reactions = await prisma.messageReaction.findMany({
            where: { messageId: req.params.messageId },
            include: {
                user: { select: { id: true, name: true, avatar: true } }
            }
        });

        res.json(reactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reactions' });
    }
});

// ============ MESSAGE SEARCH ============

// Search messages in a group
app.get('/api/chat/groups/:groupId/messages/search', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        const groupId = req.params.groupId;

        if (!q) {
            return res.json([]);
        }

        const messages = await prisma.chatMessage.findMany({
            where: {
                groupId,
                content: {
                    contains: q,
                    mode: 'insensitive'
                }
            },
            include: {
                sender: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(messages);
    } catch (error) {
        console.error('Search messages error:', error);
        res.status(500).json({ error: 'Failed to search messages' });
    }
});

// ============ GROUP MANAGEMENT ============

// Get group details with members
app.get('/api/chat/groups/:groupId/info', authenticateToken, async (req, res) => {
    try {
        const group = await prisma.chatGroup.findUnique({
            where: { id: req.params.groupId },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true, role: true } }
                    }
                },
                createdBy: { select: { id: true, name: true, avatar: true } },
                batch: { select: { id: true, name: true } }
            }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        res.json(group);
    } catch (error) {
        console.error('Get group info error:', error);
        res.status(500).json({ error: 'Failed to fetch group info' });
    }
});

// Update group details (admin/creator only)
app.put('/api/chat/groups/:groupId', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const groupId = req.params.groupId;

        // Check if user is group admin or creator
        const member = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: req.user.id
                }
            }
        });

        if (!member || member.role !== 'admin') {
            return res.status(403).json({ error: 'Only group admins can update group details' });
        }

        const group = await prisma.chatGroup.update({
            where: { id: groupId },
            data: { name, description }
        });

        io.to(`group_${groupId}`).emit('group_updated', group);

        res.json(group);
    } catch (error) {
        console.error('Update group error:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

// Add members to group (admin only)
app.post('/api/chat/groups/:groupId/members', authenticateToken, async (req, res) => {
    try {
        const { userIds } = req.body;
        const groupId = req.params.groupId;

        // Check if user is group admin
        const member = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: req.user.id
                }
            }
        });

        if (!member || member.role !== 'admin') {
            return res.status(403).json({ error: 'Only group admins can add members' });
        }

        // Add members
        const newMembers = await Promise.all(
            userIds.map(userId =>
                prisma.groupMember.create({
                    data: {
                        groupId,
                        userId,
                        status: 'accepted'
                    },
                    include: {
                        user: { select: { id: true, name: true, avatar: true } }
                    }
                })
            )
        );

        // Notify new members
        newMembers.forEach(newMember => {
            io.to(`user_${newMember.userId}`).emit('added_to_group', {
                groupId,
                group: { id: groupId }
            });
        });

        res.json(newMembers);
    } catch (error) {
        console.error('Add members error:', error);
        res.status(500).json({ error: 'Failed to add members' });
    }
});

// Remove member from group (admin only)
app.delete('/api/chat/groups/:groupId/members/:userId', authenticateToken, async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        // Check if requester is group admin
        const requester = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: req.user.id
                }
            }
        });

        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ error: 'Only group admins can remove members' });
        }

        // Remove member
        await prisma.groupMember.delete({
            where: {
                groupId_userId: {
                    groupId,
                    userId
                }
            }
        });

        // Notify removed user
        io.to(`user_${userId}`).emit('removed_from_group', { groupId });

        res.json({ success: true });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// Leave group
app.post('/api/chat/groups/:groupId/leave', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.user.id;

        await prisma.groupMember.delete({
            where: {
                groupId_userId: {
                    groupId,
                    userId
                }
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({ error: 'Failed to leave group' });
    }
});
