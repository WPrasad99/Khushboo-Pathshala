require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

// Serve uploaded files statically
const path = require('path');
const fs = require('fs');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports images (jpeg, jpg, png)"));
    }
});

// Session config
app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard_cat',
    resave: false,
    saveUninitialized: false
}));

// Passport config
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists
            let user = await prisma.user.findUnique({
                where: { email: profile.emails[0].value }
            });

            if (user) {
                return done(null, user);
            }

            // Create new user
            user = await prisma.user.create({
                data: {
                    email: profile.emails[0].value,
                    name: profile.displayName,
                    password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
                    role: 'STUDENT',
                    avatar: profile.photos[0].value,
                    profileCompleted: false
                }
            });
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    }));

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

// Google Auth Routes
app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
);

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        const token = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?token=${token}`);
    }
);

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

// Upload Avatar
app.post('/api/users/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const avatarUrl = `http://localhost:${PORT}/uploads/avatars/${req.file.filename}`;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { avatar: avatarUrl },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true
            }
        });

        res.json({ message: 'Avatar updated successfully', user });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// Change Password
app.put('/api/users/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to change password' });
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
            const [trackings, achievements, activities, announcements, studentBatches] = await Promise.all([
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
                prisma.batchStudent.findMany({
                    where: { studentId: userId },
                    select: { batchId: true }
                })
            ]);

            const studentBatchIds = studentBatches.map(b => b.batchId);

            // Fetch all upcoming sessions and filter by batch in memory
            // (In a production app, we'd use a more direct relational query)
            const allSessions = await prisma.session.findMany({
                where: { scheduledAt: { gte: new Date() } },
                orderBy: { scheduledAt: 'asc' }
            });

            const sessions = allSessions.filter(s => {
                try {
                    const meta = JSON.parse(s.description);
                    // If session has a batchId, check if student is in that batch
                    if (meta.batchId) {
                        return studentBatchIds.includes(meta.batchId);
                    }
                    return true; // Global session
                } catch {
                    return true; // Legacy session with no JSON meta
                }
            }).slice(0, 3);

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

// ============ MENTOR DASHBOARD ROUTES ============

// Get Mentor's Assigned Batches
app.get('/api/mentor/batches', authenticateToken, requireRole('MENTOR'), async (req, res) => {
    try {
        const mentorId = req.user.id;
        const assignedBatches = await prisma.batchMentor.findMany({
            where: { mentorId },
            include: {
                batch: {
                    include: {
                        students: {
                            include: {
                                student: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        avatar: true,
                                        createdAt: true
                                    }
                                }
                            }
                        },
                        mentors: {
                            include: {
                                mentor: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const batches = assignedBatches.map(ab => ({
            ...ab.batch,
            studentsCount: ab.batch.students.length,
            students: ab.batch.students.map(s => s.student),
            assignedMentors: ab.batch.mentors.map(m => m.mentor)
        }));

        res.json(batches);
    } catch (error) {
        console.error('Fetch mentor batches error:', error);
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
});

// Get Mentor's Assigned Students (from all batches)
app.get('/api/mentor/students', authenticateToken, requireRole('MENTOR'), async (req, res) => {
    try {
        const mentorId = req.user.id;
        const assignedBatches = await prisma.batchMentor.findMany({
            where: { mentorId },
            select: {
                batch: {
                    select: {
                        name: true,
                        students: {
                            select: {
                                student: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        avatar: true,
                                        role: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Flatten students and add batch name
        const students = [];
        assignedBatches.forEach(ab => {
            ab.batch.students.forEach(s => {
                students.push({
                    ...s.student,
                    batchName: ab.batch.name,
                    status: 'Active' // Simplification for now
                });
            });
        });

        res.json(students);
    } catch (error) {
        console.error('Fetch mentor students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Create Batch Meeting (Scheduled Meeting)
// Note: We'll repurpose the 'Meeting' model or just use a generic storage.
// Given the requirements, we'll implement a simplified version.
app.post('/api/mentor/meetings', authenticateToken, requireRole('MENTOR'), async (req, res) => {
    const { title, date, duration, mode, link, description, batchId } = req.body;
    try {
        // Since the current schema ties Meeting to Mentorship (1-on-1),
        // and requirements ask for Batch visibility, we'll create a session-like meeting log.
        // For hackathon purposes, we'll store this metadata.
        // In a real app, we'd add BatchId to Meeting or Session.

        // We'll use the 'Meeting' model if we can, but it requires mentorshipId.
        // Instead, let's use the 'Session' model which is closer to a batch meeting.
        const session = await prisma.session.create({
            data: {
                title,
                description: JSON.stringify({ description, mode, link, batchId, mentorId: req.user.id }),
                scheduledAt: new Date(date),
                duration: parseInt(duration),
                type: mode
            }
        });

        res.json(session);
    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({ error: 'Failed to schedule meeting' });
    }
});

// Get Meeting Logs
app.get('/api/mentor/meetings', authenticateToken, requireRole('MENTOR'), async (req, res) => {
    try {
        const mentorId = req.user.id;
        // Fetch sessions and filter those created by this mentor in metadata
        const sessions = await prisma.session.findMany({
            orderBy: { scheduledAt: 'desc' }
        });

        const logs = sessions.filter(s => {
            try {
                const meta = JSON.parse(s.description);
                return meta.mentorId === mentorId;
            } catch {
                return false;
            }
        }).map(s => {
            const meta = JSON.parse(s.description);
            return {
                id: s.id,
                title: s.title,
                date: s.scheduledAt,
                mode: s.type,
                link: meta.link,
                description: meta.description,
                batchId: meta.batchId,
                status: new Date(s.scheduledAt) > new Date() ? 'Scheduled' : 'Completed'
            };
        });

        res.json(logs);
    } catch (error) {
        console.error('Fetch meeting logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
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

app.post('/api/mentorship/meetings', authenticateToken, async (req, res) => {
    try {
        const { menteeId, mentorId, meetingDate, duration, discussionSummary, feedback, remarks, type } = req.body;
        const role = req.user.role;
        const targetUserId = role === 'MENTOR' ? menteeId : mentorId;

        // Find or create mentorship
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
            // For student, mentorship must exist or we find default
            mentorship = await prisma.mentorship.findFirst({
                where: { menteeId: req.user.id }
            });
            // If no mentor assigned to student yet, we can't schedule
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

        // Create Notification for the other party
        const otherPartyId = role === 'MENTOR' ? mentorship.menteeId : mentorship.mentorId;
        await prisma.notification.create({
            data: {
                userId: otherPartyId,
                title: 'New Meeting Scheduled',
                message: `${req.user.name} has scheduled a meeting on ${new Date(meetingDate).toLocaleDateString()}`,
                type: 'info'
            }
        });

        res.status(201).json(meeting);
    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({ error: 'Failed to create meeting' });
    }
});

// Mock Send Message Endpoint
app.post('/api/mentorship/message', authenticateToken, async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        // In a real app, this would save to a ChatMessage model
        // For now, just create a notification
        await prisma.notification.create({
            data: {
                userId: recipientId,
                title: `New Message from ${req.user.name}`,
                message: content,
                type: 'info'
            }
        });
        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
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

        // Broadcast notification to all users
        io.emit('notification', {
            title: 'New Announcement',
            content: announcement.title,
            type: 'announcement',
            createdAt: new Date()
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
            recentTrackings,
            recentBatches
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
            }),
            prisma.batch.findMany({
                take: 6,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { students: true } }
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
            recentTrackings,
            recentBatches
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Seed YouTube Playlists as Courses
app.post('/api/seed-youtube-courses', async (req, res) => {
    try {
        // Get first admin/mentor user
        const mentor = await prisma.user.findFirst({
            where: { role: { in: ['MENTOR', 'ADMIN'] } }
        });

        if (!mentor) {
            return res.status(400).json({ error: 'No mentor/admin user found' });
        }

        const playlistDataPath = require('path').join(__dirname, '../../playlist_data.json');
        let playlistData = {};
        try {
            const fs = require('fs');
            if (fs.existsSync(playlistDataPath)) {
                playlistData = JSON.parse(fs.readFileSync(playlistDataPath, 'utf8'));
            }
        } catch (e) {
            console.error('Failed to read playlist data:', e);
        }

        const youtubeCourses = [
            {
                title: 'Python Complete Tutorial',
                description: 'Complete Python programming tutorial for beginners. Learn Python from scratch with practical examples.',
                category: 'TECHNICAL_SKILLS',
                videoUrl: 'PLsyeobzWxl7oa1WO9n4cP3OY9nOtUcZIg',
                duration: 600,
                thumbnailUrl: 'https://i.ytimg.com/vi/QXeEoD0pB3E/maxresdefault.jpg',
                lessonsCount: playlistData['Python']?.length || 30,
                lessons: playlistData['Python'] || []
            },
            {
                title: 'Java Programming Course',
                description: 'Master Java programming from basics to advanced concepts. Complete Java course with hands-on projects.',
                category: 'TECHNICAL_SKILLS',
                videoUrl: 'PLsyeobzWxl7qbKoSgR5ub6jolI8-ocxCF',
                duration: 480,
                thumbnailUrl: 'https://i.ytimg.com/vi/eIrMbAQSU34/maxresdefault.jpg',
                lessonsCount: playlistData['Java']?.length || 25,
                lessons: playlistData['Java'] || []
            },
            {
                title: 'Web Development Bootcamp',
                description: 'Full web development course covering HTML, CSS, JavaScript and more.',
                category: 'TECHNICAL_SKILLS',
                videoUrl: 'PLsyeobzWxl7r566kReuTnjnINHqaRuRFn',
                duration: 720,
                thumbnailUrl: 'https://i.ytimg.com/vi/PlxWf493en4/maxresdefault.jpg',
                lessonsCount: playlistData['WebDev']?.length || 40,
                lessons: playlistData['WebDev'] || []
            },
            {
                title: 'Data Structures & Algorithms',
                description: 'Master DSA concepts with practical implementation. Essential for coding interviews.',
                category: 'TECHNICAL_SKILLS',
                videoUrl: 'PLfqMhTWNBTe3LtFWcvwpqTkUSlB32kJop',
                duration: 900,
                thumbnailUrl: 'https://i.ytimg.com/vi/8hly31xKli0/maxresdefault.jpg',
                lessonsCount: playlistData['DSA']?.length || 50,
                lessons: playlistData['DSA'] || []
            },
            {
                title: 'Soft Skills Mastery',
                description: 'Develop essential soft skills for career success. Communication, leadership, and teamwork.',
                category: 'SOFT_SKILLS',
                videoUrl: 'PL6ZdH9C1KeueFazoYwshjYuao2pL9ihqY',
                duration: 300,
                thumbnailUrl: 'https://i.ytimg.com/vi/0FFLFcB9xfQ/maxresdefault.jpg',
                lessonsCount: playlistData['SoftSkills']?.length || 20,
                lessons: playlistData['SoftSkills'] || []
            },
            {
                title: 'Career Guidance & Interview Prep',
                description: 'Complete career guidance course with interview preparation tips and strategies.',
                category: 'CAREER_GUIDANCE',
                videoUrl: 'PLOaeOd121eBEEWP14TYgSnFsvaTIjPD22',
                duration: 360,
                thumbnailUrl: 'https://i.ytimg.com/vi/WfdtKbAJOmE/maxresdefault.jpg',
                lessonsCount: playlistData['Career']?.length || 15,
                lessons: playlistData['Career'] || []
            }
        ];

        // Delete existing trackings and courses (in correct order for foreign keys)
        await prisma.sessionTracking.deleteMany({});
        await prisma.learningResource.deleteMany({});

        // Create new courses
        const created = await Promise.all(
            youtubeCourses.map(course =>
                prisma.learningResource.create({
                    data: {
                        ...course,
                        uploadedById: mentor.id
                    }
                })
            )
        );

        res.json({ message: 'YouTube courses seeded successfully', count: created.length });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ error: 'Failed to seed courses' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Khushboo Pathshala API is running!' });
});

// ============ CHAT SYSTEM ROUTES ============

// Get all groups for user
app.get('/api/chat/groups', authenticateToken, async (req, res) => {
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
app.get('/api/chat/invites', authenticateToken, async (req, res) => {
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

// Create group (Mentor only)
app.post('/api/chat/groups', authenticateToken, requireRole('MENTOR', 'ADMIN'), async (req, res) => {
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

        // Notify invited users via socket
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
app.put('/api/chat/invites/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' or 'rejected'

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
app.get('/api/chat/groups/:groupId/messages', authenticateToken, async (req, res) => {
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
app.post('/api/chat/groups/:groupId/messages', authenticateToken, async (req, res) => {
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

        // Broadcast message to group
        io.to(`group_${req.params.groupId}`).emit('new_message', message);

        res.status(201).json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get all users for inviting
app.get('/api/chat/users', authenticateToken, requireRole('MENTOR', 'ADMIN'), async (req, res) => {
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

// ============ ADMIN BATCH ROUTES ============

// Create Batch
app.post('/api/admin/batches', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { name, description, studentIds, mentorIds } = req.body;

        const batch = await prisma.batch.create({
            data: {
                name,
                description,
                students: {
                    create: studentIds?.map(id => ({ studentId: id })) || []
                },
                mentors: {
                    create: mentorIds?.map(id => ({ mentorId: id })) || []
                }
            },
            include: {
                students: true,
                mentors: true
            }
        });

        // Notify students and mentors in the batch
        studentIds?.forEach(id => {
            io.to(`user_${id}`).emit('notification', {
                title: 'New Batch Assignment',
                content: `You have been added to batch: ${batch.name}`,
                type: 'batch',
                createdAt: new Date()
            });
        });

        mentorIds?.forEach(id => {
            io.to(`user_${id}`).emit('notification', {
                title: 'New Batch Assignment',
                content: `You have been assigned to batch: ${batch.name}`,
                type: 'batch',
                createdAt: new Date()
            });
        });

        res.status(201).json(batch);
    } catch (error) {
        console.error('Create batch error:', error);
        res.status(500).json({ error: 'Failed to create batch' });
    }
});

// Get All Batches
app.get('/api/admin/batches', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const batches = await prisma.batch.findMany({
            include: {
                students: {
                    include: {
                        student: { select: { id: true, name: true, email: true, avatar: true } }
                    }
                },
                mentors: {
                    include: {
                        mentor: { select: { id: true, name: true, email: true, avatar: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(batches);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
});

// Get Single Batch
app.get('/api/admin/batches/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const batch = await prisma.batch.findUnique({
            where: { id: req.params.id },
            include: {
                students: {
                    include: {
                        student: { select: { id: true, name: true, email: true, avatar: true } }
                    }
                },
                mentors: {
                    include: {
                        mentor: { select: { id: true, name: true, email: true, avatar: true } }
                    }
                }
            }
        });
        if (!batch) return res.status(404).json({ error: 'Batch not found' });
        res.json(batch);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch batch' });
    }
});

// Update Batch (Name/Desc/Status)
app.put('/api/admin/batches/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { name, description, status } = req.body;
        const batch = await prisma.batch.update({
            where: { id: req.params.id },
            data: { name, description, status }
        });
        res.json(batch);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update batch' });
    }
});

// Delete Batch
app.delete('/api/admin/batches/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        await prisma.batch.delete({ where: { id: req.params.id } });
        res.json({ message: 'Batch deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete batch' });
    }
});

// Add Students to Batch
app.post('/api/admin/batches/:id/students', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { studentIds } = req.body;
        // Logic to add multiple students, ignoring duplicates
        const operations = studentIds.map(studentId =>
            prisma.batchStudent.upsert({
                where: {
                    batchId_studentId: {
                        batchId: req.params.id,
                        studentId: studentId
                    }
                },
                update: {},
                create: {
                    batchId: req.params.id,
                    studentId: studentId
                }
            })
        );

        await prisma.$transaction(operations);
        res.json({ message: 'Students added successfully' });
    } catch (error) {
        console.error('Add students error:', error);
        res.status(500).json({ error: 'Failed to add students' });
    }
});

// Remove Student from Batch
app.delete('/api/admin/batches/:id/students/:studentId', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        await prisma.batchStudent.delete({
            where: {
                batchId_studentId: {
                    batchId: req.params.id,
                    studentId: req.params.studentId
                }
            }
        });
        res.json({ message: 'Student removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove student' });
    }
});

// Add Mentors to Batch
app.post('/api/admin/batches/:id/mentors', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { mentorIds } = req.body;
        const operations = mentorIds.map(mentorId =>
            prisma.batchMentor.upsert({
                where: {
                    batchId_mentorId: {
                        batchId: req.params.id,
                        mentorId: mentorId
                    }
                },
                update: {},
                create: {
                    batchId: req.params.id,
                    mentorId: mentorId
                }
            })
        );

        await prisma.$transaction(operations);
        res.json({ message: 'Mentors added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add mentors' });
    }
});

// Remove Mentor from Batch
app.delete('/api/admin/batches/:id/mentors/:mentorId', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        await prisma.batchMentor.delete({
            where: {
                batchId_mentorId: {
                    batchId: req.params.id,
                    mentorId: req.params.mentorId
                }
            }
        });
        res.json({ message: 'Mentor removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove mentor' });
    }
});

// Create User (Admin Only)
app.post('/api/admin/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { email, password, name, role, phone } = req.body;

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
                phone: phone || null,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`,
                profileCompleted: true
            }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Bulk Create Users (Admin Only)
app.post('/api/admin/users/bulk', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { users, batchName } = req.body;

        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ error: 'No users provided' });
        }

        if (!batchName) {
            return res.status(400).json({ error: 'Batch name is required' });
        }

        // 1. Find or Create Batch
        let batch = await prisma.batch.findFirst({
            where: { name: { equals: batchName, mode: 'insensitive' } }
        });

        if (!batch) {
            batch = await prisma.batch.create({
                data: {
                    name: batchName,
                    status: 'ACTIVE'
                }
            });
        }

        const results = [];
        const errors = [];

        // 2. Process Users
        const creationOperations = await Promise.all(users.map(async (userData) => {
            const { name, email } = userData;

            if (!name || !email) {
                errors.push({ email: email || 'unknown', error: 'Missing name or email' });
                return null;
            }

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                errors.push({ email, error: 'User already exists' });
                return null;
            }

            // Generate secure random password
            const generatedPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2).toUpperCase();
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);

            return {
                userData: {
                    email,
                    password: hashedPassword,
                    name,
                    role: 'STUDENT',
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`,
                    profileCompleted: true
                },
                plainPassword: generatedPassword
            };
        }));

        const validOperations = creationOperations.filter(op => op !== null);

        if (validOperations.length === 0) {
            return res.status(400).json({ error: 'No valid users to create', details: errors });
        }

        // 3. Bulk Create Users and Assign to Batch (Transaction)
        const createdUsers = await prisma.$transaction(async (tx) => {
            const finalResults = [];
            for (const op of validOperations) {
                const user = await tx.user.create({
                    data: op.userData
                });

                await tx.batchStudent.create({
                    data: {
                        batchId: batch.id,
                        studentId: user.id
                    }
                });

                finalResults.push({
                    ...user,
                    password: op.plainPassword // Send back the plain password for admin to download
                });
            }
            return finalResults;
        });

        res.status(201).json({
            message: `Successfully created ${createdUsers.length} users and assigned to batch "${batch.name}"`,
            createdUsers,
            errors,
            batch
        });
    } catch (error) {
        console.error('Bulk create user error:', error);
        res.status(500).json({ error: 'Failed to bulk create users' });
    }
});

// Get All Users (Admin)
app.get('/api/admin/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
                profileCompleted: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update User Role (Admin)
app.put('/api/admin/users/:id/role', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        await prisma.user.update({
            where: { id },
            data: { role }
        });
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Delete User (Admin)
app.delete('/api/admin/users/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.$transaction(async (tx) => {
            // Delete dependent mentorship records and their meetings
            const mentorships = await tx.mentorship.findMany({
                where: { OR: [{ mentorId: id }, { menteeId: id }] },
                select: { id: true }
            });
            const mentorshipIds = mentorships.map(m => m.id);
            if (mentorshipIds.length > 0) {
                await tx.meeting.deleteMany({
                    where: { mentorshipId: { in: mentorshipIds } }
                });
                await tx.mentorship.deleteMany({
                    where: { id: { in: mentorshipIds } }
                });
            }

            // Delete other dependent records
            await tx.sessionTracking.deleteMany({ where: { userId: id } });
            await tx.forumAnswer.deleteMany({ where: { authorId: id } });

            // ForumPosts might have answers from others, let's delete them too
            const forumPosts = await tx.forumPost.findMany({
                where: { authorId: id },
                select: { id: true }
            });
            const postIds = forumPosts.map(p => p.id);
            if (postIds.length > 0) {
                await tx.forumAnswer.deleteMany({
                    where: { postId: { in: postIds } }
                });
                await tx.forumPost.deleteMany({
                    where: { id: { in: postIds } }
                });
            }

            await tx.achievement.deleteMany({ where: { userId: id } });
            await tx.activity.deleteMany({ where: { userId: id } });
            await tx.loginLog.deleteMany({ where: { userId: id } });
            await tx.chatMessage.deleteMany({ where: { senderId: id } });
            await tx.notification.deleteMany({ where: { userId: id } });
            await tx.groupMember.deleteMany({ where: { userId: id } });
            await tx.announcement.deleteMany({ where: { createdById: id } });

            // BatchStudent and BatchMentor have Cascade on User, so they'll be deleted automatically

            // Finally delete the user
            await tx.user.delete({ where: { id } });
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get all students (for selection)
app.get('/api/admin/students', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: { id: true, name: true, email: true, avatar: true }
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Get all mentors (for selection)
app.get('/api/admin/mentors', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const mentors = await prisma.user.findMany({
            where: { role: 'MENTOR' },
            select: { id: true, name: true, email: true, avatar: true }
        });
        res.json(mentors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch mentors' });
    }
});

// ============ SOCKET.IO EVENTS ============

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user's personal room
    socket.on('join_user', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined personal room`);
    });

    // Join group room
    socket.on('join_group', (groupId) => {
        socket.join(`group_${groupId}`);
        console.log(`Socket joined group ${groupId}`);
    });

    // Leave group room
    socket.on('leave_group', (groupId) => {
        socket.leave(`group_${groupId}`);
    });

    // Typing indicator
    socket.on('typing', ({ groupId, userName }) => {
        socket.to(`group_${groupId}`).emit('user_typing', { userName });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server with Socket.IO
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Khushboo Scholar Learning & Engagement Dashboard API`);
    console.log(`💬 Real-time chat enabled with Socket.IO`);
});
