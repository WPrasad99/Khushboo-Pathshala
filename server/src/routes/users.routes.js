const express = require('express');
const router = express.Router();

module.exports = (prisma, authenticateToken) => {
    // Get current user profile
    router.get('/me', authenticateToken, async (req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    phone: true,
                    gender: true,
                    dateOfBirth: true,
                    educationLevel: true,
                    avatar: true,
                    profileCompleted: true
                }
            });
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch user' });
        }
    });

    // Update user profile
    router.put('/profile', authenticateToken, async (req, res) => {
        try {
            const { phone, gender, dateOfBirth, educationLevel, name } = req.body;

            if (dateOfBirth) {
                const parsed = new Date(dateOfBirth);
                if (Number.isNaN(parsed.getTime())) {
                    return res.status(400).json({ error: 'Invalid dateOfBirth format' });
                }
            }

            const user = await prisma.user.update({
                where: { id: req.user.id },
                data: {
                    phone,
                    gender,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                    educationLevel,
                    name,
                    profileCompleted: true
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    phone: true,
                    gender: true,
                    dateOfBirth: true,
                    educationLevel: true,
                    avatar: true,
                    profileCompleted: true
                }
            });

            res.json(user);
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    });

    // Get login history for heatmap
    router.get('/login-history', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const loginLogs = await prisma.loginLog.findMany({
                where: {
                    userId,
                    loginDate: { gte: oneYearAgo }
                },
                orderBy: { loginDate: 'asc' }
            });

            const loginDates = loginLogs.map(log =>
                log.loginDate.toISOString().split('T')[0]
            );

            res.json({ loginDates });
        } catch (error) {
            console.error('Login history error:', error);
            res.status(500).json({ error: 'Failed to fetch login history' });
        }
    });

    // Get dashboard data for current user
    router.get('/dashboard', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;

            if (userRole === 'STUDENT') {
                const [trackings, achievements, activities, announcements, sessions] = await Promise.all([
                    prisma.sessionTracking.findMany({
                        where: { userId },
                        include: { resource: true }
                    }),
                    prisma.achievement.findMany({ where: { userId } }),
                    prisma.activity.findMany({
                        where: { userId },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    }),
                    prisma.announcement.findMany({
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        include: { createdBy: { select: { name: true } } }
                    }),
                    prisma.session.findMany({
                        where: { scheduledAt: { gte: new Date() } },
                        orderBy: { scheduledAt: 'asc' },
                        take: 3
                    })
                ]);

                const totalSessions = trackings.length;
                const attendedSessions = trackings.filter(t => t.attendanceMarked).length;
                const attendancePercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;
                const completedCourses = trackings.filter(t => t.completionPercentage >= 80).length;
                const badges = achievements.filter(a => a.type === 'BADGE');

                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                endOfMonth.setHours(23, 59, 59, 999);
                const totalDaysInMonth = endOfMonth.getDate();

                const loginLogsThisMonth = await prisma.loginLog.findMany({
                    where: {
                        userId,
                        loginDate: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    }
                });
                const activeDaysThisMonth = loginLogsThisMonth.length;

                res.json({
                    stats: {
                        attendancePercentage,
                        completedCourses,
                        badgesCount: badges.length,
                        activeDaysThisMonth,
                        totalDaysInMonth
                    },
                    recentActivities: activities,
                    upcomingSessions: sessions,
                    announcements,
                    achievements: badges
                });
            } else if (userRole === 'MENTOR') {
                const [mentorships, meetings, resources] = await Promise.all([
                    prisma.mentorship.findMany({
                        where: { mentorId: userId },
                        include: {
                            mentee: {
                                select: { id: true, name: true, email: true, avatar: true }
                            }
                        }
                    }),
                    prisma.meeting.findMany({
                        where: {
                            mentorship: { mentorId: userId }
                        },
                        orderBy: { meetingDate: 'desc' },
                        take: 5,
                        include: {
                            mentorship: {
                                include: {
                                    mentee: { select: { name: true, avatar: true } }
                                }
                            }
                        }
                    }),
                    prisma.learningResource.findMany({
                        where: { uploadedById: userId }
                    })
                ]);

                res.json({
                    mentees: mentorships.map(m => m.mentee),
                    recentMeetings: meetings,
                    uploadedResources: resources.length,
                    totalMentees: mentorships.length
                });
            } else if (userRole === 'ADMIN') {
                const [userCount, resourceCount, sessionCount, postCount] = await Promise.all([
                    prisma.user.count(),
                    prisma.learningResource.count(),
                    prisma.session.count(),
                    prisma.forumPost.count()
                ]);

                const recentUsers = await prisma.user.findMany({
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: { id: true, name: true, email: true, role: true, createdAt: true }
                });

                res.json({
                    stats: {
                        totalUsers: userCount,
                        totalResources: resourceCount,
                        totalSessions: sessionCount,
                        totalForumPosts: postCount
                    },
                    recentUsers
                });
            }
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard data' });
        }
    });

    return router;
};
