const express = require('express');
const router = express.Router();

module.exports = (prisma, authenticateToken) => {
    // Get mentorship data
    router.get('/', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const role = req.user.role;

            if (role === 'STUDENT') {
                const mentorship = await prisma.mentorship.findFirst({
                    where: { menteeId: userId },
                    include: {
                        mentor: {
                            select: { id: true, name: true, email: true, avatar: true, phone: true }
                        },
                        meetings: {
                            orderBy: { meetingDate: 'desc' },
                            take: 5
                        }
                    }
                });
                res.json(mentorship);
            } else if (role === 'MENTOR') {
                const mentorships = await prisma.mentorship.findMany({
                    where: { mentorId: userId },
                    include: {
                        mentee: {
                            select: { id: true, name: true, email: true, avatar: true }
                        },
                        meetings: {
                            orderBy: { meetingDate: 'desc' },
                            take: 3
                        }
                    }
                });
                res.json(mentorships);
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch mentorship data' });
        }
    });

    // Get meetings
    router.get('/meetings', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const role = req.user.role;

            let meetings;
            if (role === 'MENTOR') {
                meetings = await prisma.meeting.findMany({
                    where: {
                        mentorship: { mentorId: userId }
                    },
                    include: {
                        mentorship: {
                            include: {
                                mentee: { select: { name: true, avatar: true } }
                            }
                        }
                    },
                    orderBy: { meetingDate: 'desc' }
                });
            } else {
                meetings = await prisma.meeting.findMany({
                    where: {
                        mentorship: { menteeId: userId }
                    },
                    include: {
                        mentorship: {
                            include: {
                                mentor: { select: { name: true, avatar: true } }
                            }
                        }
                    },
                    orderBy: { meetingDate: 'desc' }
                });
            }

            res.json(meetings);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch meetings' });
        }
    });

    // Create meeting
    router.post('/meetings', authenticateToken, async (req, res) => {
        try {
            const { menteeId, mentorId, meetingDate, duration, discussionSummary, feedback, remarks } = req.body;
            const role = req.user.role;

            let mentorship;
            if (role === 'MENTOR') {
                mentorship = await prisma.mentorship.findFirst({
                    where: { mentorId: req.user.id, menteeId }
                });
                if (!mentorship) {
                    mentorship = await prisma.mentorship.create({
                        data: { mentorId: req.user.id, menteeId }
                    });
                }
            } else {
                mentorship = await prisma.mentorship.findFirst({
                    where: { menteeId: req.user.id }
                });
                if (!mentorship && !mentorId) {
                    return res.status(400).json({ error: "No mentor assigned yet." });
                }
            }

            const meeting = await prisma.meeting.create({
                data: {
                    mentorshipId: mentorship.id,
                    meetingDate: new Date(meetingDate),
                    duration: duration || 30,
                    discussionSummary: discussionSummary || (role === 'STUDENT' ? 'Meeting Requested by Student' : 'Scheduled by Mentor'),
                    feedback,
                    remarks
                }
            });

            // Create Notification
            const otherPartyId = role === 'MENTOR' ? mentorship.menteeId : mentorship.mentorId;
            await prisma.notification.create({
                data: {
                    userId: otherPartyId,
                    title: 'New Meeting Scheduled',
                    message: `A meeting has been scheduled on ${new Date(meetingDate).toLocaleDateString()}`,
                    type: 'info'
                }
            });

            res.status(201).json(meeting);
        } catch (error) {
            console.error('Create meeting error:', error);
            res.status(500).json({ error: 'Failed to create meeting' });
        }
    });

    // Send message
    router.post('/message', authenticateToken, async (req, res) => {
        try {
            const { recipientId, content } = req.body;
            await prisma.notification.create({
                data: {
                    userId: recipientId,
                    title: `New Message from ${req.user.name || 'User'}`,
                    message: content,
                    type: 'info'
                }
            });
            res.json({ success: true, message: 'Message sent' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to send message' });
        }
    });

    return router;
};
