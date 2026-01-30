require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'khushboo-secret-key';

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token.' });
    }
};

// Role-based access middleware
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'STUDENT',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`
            }
        });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                profileCompleted: user.profileCompleted
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        // Record login for heatmap and active days tracking
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingLog = await prisma.loginLog.findFirst({
            where: {
                userId: user.id,
                loginDate: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });
        if (!existingLog) {
            await prisma.loginLog.create({
                data: {
                    userId: user.id,
                    loginDate: new Date()
                }
            });
        }

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                profileCompleted: user.profileCompleted
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// ============ USER ROUTES ============

// Get current user profile
app.get('/api/users/me', authenticateToken, async (req, res) => {
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
app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { phone, gender, dateOfBirth, educationLevel, name } = req.body;

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

// Get login history for heatmap (last 365 days)
app.get('/api/users/login-history', authenticateToken, async (req, res) => {
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

        // Return array of date strings (YYYY-MM-DD)
        const loginDates = loginLogs.map(log =>
            log.loginDate.toISOString().split('T')[0]
        );

        res.json({ loginDates });
    } catch (error) {
        console.error('Login history error:', error);
        res.status(500).json({ error: 'Failed to fetch login history' });
    }
});

// Get notifications for bell icon
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get recent activities and announcements as notifications
        const [activities, announcements] = await Promise.all([
            prisma.activity.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),
            prisma.announcement.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ]);

        const notifications = [
            ...announcements.map(a => ({
                id: a.id,
                type: 'announcement',
                title: a.title,
                content: a.content,
                createdAt: a.createdAt,
                read: false
            })),
            ...activities.map(a => ({
                id: a.id,
                type: 'activity',
                title: a.title,
                content: a.description,
                createdAt: a.createdAt,
                read: false
            }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

        res.json({
            notifications,
            unreadCount: notifications.length
        });
    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Get dashboard data for current user
app.get('/api/users/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole === 'STUDENT') {
            // Get student dashboard data
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

            // Calculate stats
            const totalSessions = trackings.length;
            const attendedSessions = trackings.filter(t => t.attendanceMarked).length;
            const attendancePercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;
            const completedCourses = trackings.filter(t => t.completionPercentage >= 80).length;
            const badges = achievements.filter(a => a.type === 'BADGE');

            // Calculate active days this month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
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
            // Get mentor dashboard data
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
            // Get admin dashboard data
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

// ============ LEARNING RESOURCES ROUTES ============

// Get all resources (with optional category filter)
app.get('/api/resources', authenticateToken, async (req, res) => {
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
app.get('/api/resources/:id', authenticateToken, async (req, res) => {
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

        // Get user's tracking
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
app.post('/api/resources', authenticateToken, requireRole('MENTOR', 'ADMIN'), async (req, res) => {
    try {
        const { title, description, category, videoUrl, duration, thumbnailUrl, lessonsCount, isHot } = req.body;

        const resource = await prisma.learningResource.create({
            data: {
                title,
                description,
                category,
                videoUrl,
                duration,
                thumbnailUrl,
                lessonsCount: lessonsCount || 1,
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
app.post('/api/resources/:id/track', authenticateToken, async (req, res) => {
    try {
        const { watchDuration, totalDuration, dropOffPoint } = req.body;
        const resourceId = req.params.id;
        const userId = req.user.id;

        const completionPercentage = (watchDuration / totalDuration) * 100;
        const attendanceMarked = completionPercentage >= 80;

        // Upsert tracking
        const existing = await prisma.sessionTracking.findFirst({
            where: { userId, resourceId }
        });

        let tracking;
        if (existing) {
            tracking = await prisma.sessionTracking.update({
                where: { id: existing.id },
                data: {
                    watchDuration: Math.max(existing.watchDuration, watchDuration),
                    totalDuration,
                    dropOffPoint,
                    completionPercentage: Math.max(existing.completionPercentage, completionPercentage),
                    attendanceMarked: existing.attendanceMarked || attendanceMarked
                }
            });
        } else {
            tracking = await prisma.sessionTracking.create({
                data: {
                    userId,
                    resourceId,
                    watchDuration,
                    totalDuration,
                    dropOffPoint,
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

// ============ SESSIONS ROUTES ============

app.get('/api/sessions', authenticateToken, async (req, res) => {
    try {
        const sessions = await prisma.session.findMany({
            orderBy: { scheduledAt: 'asc' }
        });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

app.get('/api/sessions/tracking', authenticateToken, async (req, res) => {
    try {
        const trackings = await prisma.sessionTracking.findMany({
            where: { userId: req.user.id },
            include: {
                resource: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(trackings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch session tracking' });
    }
});

// ============ MENTORSHIP ROUTES ============

app.get('/api/mentorship', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        if (role === 'STUDENT') {
            // Get student's mentor
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
            // Get mentor's mentees
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

app.get('/api/mentorship/meetings', authenticateToken, async (req, res) => {
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

app.post('/api/mentorship/meetings', authenticateToken, requireRole('MENTOR'), async (req, res) => {
    try {
        const { menteeId, meetingDate, duration, discussionSummary, feedback, remarks } = req.body;

        // Find or create mentorship
        let mentorship = await prisma.mentorship.findFirst({
            where: {
                mentorId: req.user.id,
                menteeId
            }
        });

        if (!mentorship) {
            mentorship = await prisma.mentorship.create({
                data: {
                    mentorId: req.user.id,
                    menteeId
                }
            });
        }

        const meeting = await prisma.meeting.create({
            data: {
                mentorshipId: mentorship.id,
                meetingDate: new Date(meetingDate),
                duration,
                discussionSummary,
                feedback,
                remarks
            }
        });

        res.status(201).json(meeting);
    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({ error: 'Failed to create meeting' });
    }
});

// ============ FORUM ROUTES ============

app.get('/api/forum/posts', authenticateToken, async (req, res) => {
    try {
        const posts = await prisma.forumPost.findMany({
            include: {
                author: { select: { name: true, avatar: true } },
                answers: {
                    include: {
                        author: { select: { name: true, avatar: true } }
                    },
                    orderBy: { upvotes: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch forum posts' });
    }
});

app.post('/api/forum/posts', authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;

        const post = await prisma.forumPost.create({
            data: {
                title,
                content,
                authorId: req.user.id
            },
            include: {
                author: { select: { name: true, avatar: true } }
            }
        });

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create post' });
    }
});

app.post('/api/forum/posts/:id/answers', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;

        const answer = await prisma.forumAnswer.create({
            data: {
                postId,
                content,
                authorId: req.user.id
            },
            include: {
                author: { select: { name: true, avatar: true } }
            }
        });

        // Update answers count
        await prisma.forumPost.update({
            where: { id: postId },
            data: { answersCount: { increment: 1 } }
        });

        res.status(201).json(answer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create answer' });
    }
});

app.post('/api/forum/answers/:id/upvote', authenticateToken, async (req, res) => {
    try {
        const answer = await prisma.forumAnswer.update({
            where: { id: req.params.id },
            data: { upvotes: { increment: 1 } }
        });
        res.json(answer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to upvote answer' });
    }
});

// ============ ANNOUNCEMENTS ROUTES ============

app.get('/api/announcements', authenticateToken, async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            include: {
                createdBy: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

app.post('/api/announcements', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { title, content, priority } = req.body;

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                priority: priority || 'normal',
                createdById: req.user.id
            }
        });

        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

// ============ ADMIN ROUTES ============

app.get('/api/admin/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                avatar: true,
                createdAt: true,
                profileCompleted: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.put('/api/admin/users/:id/role', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { role } = req.body;

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { role },
            select: { id: true, name: true, role: true }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

app.get('/api/admin/reports', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const [
            totalStudents,
            totalMentors,
            totalResources,
            totalSessions,
            recentTrackings
        ] = await Promise.all([
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'MENTOR' } }),
            prisma.learningResource.count(),
            prisma.session.count(),
            prisma.sessionTracking.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true } },
                    resource: { select: { title: true } }
                }
            })
        ]);

        res.json({
            stats: {
                totalStudents,
                totalMentors,
                totalResources,
                totalSessions
            },
            recentTrackings
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Khushboo Pathshala API is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Khushboo Scholar Learning & Engagement Dashboard API`);
});
