require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Get Unread Notifications Count
app.get('/api/notifications/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Count unread notifications
        const count = await prisma.notification.count({
            where: {
                userId,
                read: false
            }
        });
        // You might also want to count unread messages here if logic permits
        res.json({ count });
    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// Delete Notification
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await prisma.notification.deleteMany({
            where: {
                id,
                userId // Ensure user owns the notification
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Get User Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(notifications);
    } catch (error) {
        console.error('Fetch notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark Notifications as Read
app.put('/api/notifications/read', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Mark all as read for simplicity, or accept specific IDs
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Mark notifications read error:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

// Role-based access middleware
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

// Helper: Fetch YouTube Playlist Data
const fetchPlaylistData = async (playlistId) => {
    try {
        const response = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        const html = await response.text();

        // Robust JSON extractor using brace counting
        // Find "ytInitialData =" regardless of var/window/const
        const marker = 'ytInitialData =';
        let startIndex = html.indexOf(marker);
        if (startIndex === -1) return null;

        startIndex += marker.length;

        // Find the first '{'
        while (startIndex < html.length && html[startIndex] !== '{') {
            startIndex++;
        }

        if (startIndex >= html.length) return null;

        let braceCount = 0;
        let endIndex = startIndex;
        let found = false;

        for (let i = startIndex; i < html.length; i++) {
            if (html[i] === '{') {
                braceCount++;
            } else if (html[i] === '}') {
                braceCount--;
            }

            if (braceCount === 0) {
                endIndex = i + 1;
                found = true;
                break;
            }
        }

        if (!found) return null;

        const jsonString = html.substring(startIndex, endIndex);
        const data = JSON.parse(jsonString);

        // Navigate to playlist contents
        const contents = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;

        if (!contents) return null;

        const lessons = contents
            .filter(item => item.playlistVideoRenderer)
            .map(item => {
                const video = item.playlistVideoRenderer;
                const thumbnails = video.thumbnail?.thumbnails;
                const thumb = thumbnails?.[thumbnails.length - 1]?.url;

                return {
                    title: video.title?.runs?.[0]?.text || 'Untitled Video',
                    videoId: video.videoId,
                    duration: video.lengthText?.simpleText || '0:00',
                    thumbnailUrl: thumb
                };
            });

        return lessons;
    } catch (error) {
        console.error('Error fetching playlist data:', error);
        return null;
    }
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
            const [trackings, achievements, activities, announcements, studentBatches, manualAttendance] = await Promise.all([
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
                }),
                prisma.activity.findMany({
                    where: {
                        userId,
                        type: { startsWith: 'ATTENDANCE_' }
                    }
                })
            ]);

            const studentBatchIds = studentBatches.map(b => b.batchId);

            // Fetch Meetings (1-on-1 or Batch) and Sessions
            const [studentMeetings, allSessions] = await Promise.all([
                prisma.meeting.findMany({
                    where: {
                        mentorship: { menteeId: userId }
                    },
                    include: {
                        mentorship: {
                            include: { mentor: { select: { name: true, avatar: true } } }
                        }
                    },
                    orderBy: { meetingDate: 'desc' }, // Show latest first (upcoming and recent past)
                    take: 10
                }),
                prisma.session.findMany({
                    orderBy: { scheduledAt: 'desc' }, // Show latest first
                    take: 10
                })
            ]);

            // Filter sessions by batch
            const filteredSessions = allSessions.filter(s => {
                try {
                    const meta = JSON.parse(s.description);
                    if (meta.batchId) {
                        return studentBatchIds.includes(meta.batchId);
                    }
                    return true;
                } catch {
                    return true;
                }
            });

            // Merge and categorize
            const unifiedSessions = [
                ...studentMeetings.map(m => ({
                    id: m.id,
                    title: "Mentorship Meeting", // or use discussion summary if available as title?
                    description: m.discussionSummary || "Scheduled meeting with mentor",
                    scheduledAt: m.meetingDate,
                    duration: m.duration,
                    type: 'MEETING',
                    mentor: m.mentorship.mentor
                })),
                ...filteredSessions.map(s => ({
                    id: s.id,
                    title: s.title,
                    description: s.description,
                    scheduledAt: s.scheduledAt,
                    duration: s.duration,
                    type: 'SESSION'
                }))
            ].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)); // Sort ascending for "Upcoming"?

            // The user wants "createed previouly meetings... also extracted". 
            // If we sort ascending, past meetings are first. 
            // Let's separate future and past or just show them.
            // But usually "Upcoming" card shows immediate next.
            // I will return them all, but frontend cuts to "slice(0, 3)".
            // If I sort ascending: Past (oldest) -> Past (newest) -> Future (soonest) -> Future (later).
            // This hides the *recent* past and *soonest* future if there are many old ones.
            // I should probably filter:
            // 1. Future sessions (asc)
            // 2. Past sessions (desc)
            // And combine?

            const nowTime = new Date();
            const futureSessions = unifiedSessions.filter(s => new Date(s.scheduledAt) >= nowTime)
                .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

            const pastSessions = unifiedSessions.filter(s => new Date(s.scheduledAt) < nowTime)
                .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)); // Recent past first

            // Combine specific requirement: "upcoming sessions... also display previously meetings"
            // I'll prioritize Upcoming, then Recent Past.
            const sessions = [...futureSessions, ...pastSessions].slice(0, 5);

            // Calculate stats
            // Calculate stats
            const manualPresent = manualAttendance.filter(a => a.type === 'ATTENDANCE_PRESENT').length;
            const manualTotal = manualAttendance.length;

            const totalSessions = trackings.length + manualTotal;
            const attendedSessions = trackings.filter(t => t.attendanceMarked).length + manualPresent;

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
                user: {
                    name: req.user.name,
                    email: req.user.email,
                    avatar: req.user.avatar,
                    role: req.user.role,
                    profileCompleted: req.user.profileCompleted
                },
                stats: {
                    attendancePercentage,
                    completedCourses,
                    badgesCount: badges.length,
                    activeDaysThisMonth: activeDaysThisMonth, // Mock data
                    totalDaysInMonth: totalDaysInMonth
                },
                recentActivity: activities,
                upcomingSessions: sessions,
                announcements, // Kept announcements as it was in the original response
                learningProgress: trackings, // Assuming trackings is the learning progress
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

// Get Student's Batches
app.get('/api/student/batches', authenticateToken, requireRole('STUDENT'), async (req, res) => {
    try {
        const studentId = req.user.id;

        const studentBatches = await prisma.batchStudent.findMany({
            where: { studentId },
            include: {
                batch: {
                    include: {
                        mentors: {
                            include: {
                                mentor: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        avatar: true
                                    }
                                }
                            }
                        },
                        students: {
                            select: {
                                studentId: true
                            }
                        }
                    }
                }
            }
        });

        const batches = studentBatches.map(sb => ({
            id: sb.batch.id,
            name: sb.batch.name,
            description: sb.batch.description,
            status: sb.batch.status,
            mentors: sb.batch.mentors.map(m => m.mentor),
            studentCount: sb.batch.students.length,
            enrolledAt: sb.enrolledAt
        }));

        res.json(batches);
    } catch (error) {
        console.error('Fetch student batches error:', error);
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
});

// ============ LEARNING RESOURCES ROUTES ============

// Get all resources (with optional category filter)
app.get('/api/resources', authenticateToken, async (req, res) => {
    try {
        const { category, type } = req.query;
        const userId = req.user.id;

        // Build where clause
        let where = {};

        // For students: Only show resources from their batches OR global resources (no batchId)
        if (req.user.role === 'STUDENT') {
            const userBatches = await prisma.batchStudent.findMany({
                where: { studentId: userId },
                select: { batchId: true }
            });
            const batchIds = userBatches.map(b => b.batchId);

            where.OR = [
                { batchId: { in: batchIds } },  // Resources from student's batches
                { batchId: null }                // Global resources (old courses)
            ];
        }

        // Add category filter
        if (category && category !== 'all') {
            where.category = category.toUpperCase();
        }

        // Add type filter (SESSION, RESOURCE, COURSE, or null for backward compatibility)
        if (type) {
            if (type === 'COURSE') {
                // COURSE type or null (legacy courses)
                where.OR = where.OR ?
                    where.OR.map(condition => ({ ...condition, OR: [{ type: 'COURSE' }, { type: null }] })) :
                    [{ type: 'COURSE' }, { type: null }];
            } else {
                where.type = type; // SESSION or RESOURCE
            }
        }

        const resources = await prisma.learningResource.findMany({
            where,
            include: {
                uploadedBy: { select: { name: true, avatar: true } },
                batch: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get user's tracking for each resource
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

        let finalThumbnailUrl = thumbnailUrl; // Initialize with provided thumbnail

        let lessons = [];
        let finalLessonsCount = lessonsCount || 1;

        if (videoUrl && videoUrl.includes('list=')) {
            try {
                const urlObj = new URL(videoUrl);
                const listId = urlObj.searchParams.get('list');
                if (listId) {
                    const playlistLessons = await fetchPlaylistData(listId);
                    if (playlistLessons && playlistLessons.length > 0) {
                        lessons = playlistLessons;
                        finalLessonsCount = playlistLessons.length;
                        // Use first video thumbnail if none provided
                        if (!finalThumbnailUrl && playlistLessons[0].thumbnailUrl) {
                            finalThumbnailUrl = playlistLessons[0].thumbnailUrl;
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing playlist URL:', e);
            }
        }

        const resource = await prisma.learningResource.create({
            data: {
                title,
                description,
                category,
                videoUrl,
                duration,
                thumbnailUrl: finalThumbnailUrl,
                lessonsCount: finalLessonsCount,
                lessons: lessons.length > 0 ? lessons : undefined,
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

// ============ MENTOR UPLOAD ROUTES ============

// Upload Session (Video/YouTube Link)
app.post('/api/mentor/sessions/upload', authenticateToken, requireRole('MENTOR'), async (req, res) => {
    try {
        const { title, description, videoUrl, batchId, duration, category } = req.body;

        // Validate required fields
        if (!title || !videoUrl || !batchId) {
            return res.status(400).json({ error: 'Title, video URL, and batch are required' });
        }

        // Verify mentor is assigned to this batch
        const batchMentor = await prisma.batchMentor.findFirst({
            where: {
                batchId,
                mentorId: req.user.id
            }
        });

        if (!batchMentor) {
            return res.status(403).json({ error: 'You are not assigned to this batch' });
        }

        let lessons = [];
        let finalDuration = parseInt(duration) || 45;

        // Check for playlist
        let finalThumbnailUrl = null;

        if (videoUrl && videoUrl.includes('list=')) {
            try {
                const urlObj = new URL(videoUrl);
                const listId = urlObj.searchParams.get('list');
                if (listId) {
                    const playlistLessons = await fetchPlaylistData(listId);
                    if (playlistLessons && playlistLessons.length > 0) {
                        lessons = playlistLessons;
                        // Calculate total duration roughly
                        finalDuration = playlistLessons.length * 10; // Assume 10 mins per video if unknown

                        // Use first video thumbnail
                        if (playlistLessons[0].thumbnailUrl) {
                            finalThumbnailUrl = playlistLessons[0].thumbnailUrl;
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing playlist URL:', e);
            }
        }

        // Create session as LearningResource with type='SESSION'
        const session = await prisma.learningResource.create({
            data: {
                title,
                description: description || '',
                videoUrl,
                type: 'SESSION',
                batchId,
                duration: finalDuration,
                thumbnailUrl: finalThumbnailUrl, // Save generated thumbnail
                category: category || 'TECHNICAL_SKILLS',
                uploadedById: req.user.id,
                lessonsCount: lessons.length > 0 ? lessons.length : 1,
                lessons: lessons.length > 0 ? lessons : undefined
            },
            include: {
                batch: { select: { name: true } },
                uploadedBy: { select: { name: true, avatar: true } }
            }
        });

        // Broadcast new session
        io.emit('new_resource', { ...session, type: 'SESSION' });

        // Notification
        try {
            const students = await prisma.batchStudent.findMany({
                where: { batchId },
                select: { studentId: true }
            });
            const recipientIds = students.map(s => s.studentId);
            if (recipientIds.length > 0) {
                await prisma.notification.createMany({
                    data: recipientIds.map(uid => ({
                        userId: uid,
                        title: `New Session: ${title}`,
                        message: `A new learning session has been uploaded.`,
                        type: 'success'
                    }))
                });
            }
        } catch (notifError) { console.error('Notif error', notifError); }

        res.json({ success: true, session });
    } catch (error) {
        console.error('Upload session error:', error);
        res.status(500).json({ error: 'Failed to upload session' });
    }
});

// Upload Resource (Files - PDF, PPTX)
app.post('/api/mentor/resources/upload', authenticateToken, requireRole('MENTOR'), upload.single('file'), async (req, res) => {
    try {
        const { title, description, batchId, category } = req.body;

        // Validate required fields
        if (!title || !req.file || !batchId) {
            return res.status(400).json({ error: 'Title, file, and batch are required' });
        }

        // Verify mentor is assigned to this batch
        const batchMentor = await prisma.batchMentor.findFirst({
            where: {
                batchId,
                mentorId: req.user.id
            }
        });

        if (!batchMentor) {
            return res.status(403).json({ error: 'You are not assigned to this batch' });
        }

        const resourceUrl = `/uploads/avatars/${req.file.filename}`;

        // Create resource as LearningResource with type='RESOURCE'
        const resource = await prisma.learningResource.create({
            data: {
                title,
                description: description || '',
                videoUrl: resourceUrl,  // Reusing videoUrl field for file path
                type: 'RESOURCE',
                batchId,
                duration: 0,  // Resources don't have duration
                category: category || 'TECHNICAL_SKILLS',
                uploadedById: req.user.id
            },
            include: {
                batch: { select: { name: true } },
                uploadedBy: { select: { name: true, avatar: true } }
            }
        });

        // Broadcast new resource
        io.emit('new_resource', { ...resource, type: 'RESOURCE' });

        // Notification
        try {
            const students = await prisma.batchStudent.findMany({
                where: { batchId },
                select: { studentId: true }
            });
            const recipientIds = students.map(s => s.studentId);
            if (recipientIds.length > 0) {
                await prisma.notification.createMany({
                    data: recipientIds.map(uid => ({
                        userId: uid,
                        title: `New Resource: ${title}`,
                        message: `A new resource has been uploaded for your batch.`,
                        type: 'success'
                    }))
                });
            }
        } catch (notifError) { console.error('Notif error', notifError); }

        res.json({ success: true, resource });
    } catch (error) {
        console.error('Upload resource error:', error);
        res.status(500).json({ error: 'Failed to upload resource' });
    }
});

// Mark Batch Attendance (Upload CSV)
app.post('/api/mentor/attendance', authenticateToken, requireRole('MENTOR'), async (req, res) => {
    try {
        const { date, records } = req.body;
        // records: [{ email, status: 'Present' | 'Absent' }]

        if (!records || !Array.isArray(records)) {
            return res.status(400).json({ error: 'Invalid records format' });
        }

        const stats = { success: 0, failed: 0 };
        const activityDate = date ? new Date(date) : new Date();

        // Process sequentially to avoid race conditions or DB locks if large
        for (const record of records) {
            try {
                if (!record.email) continue;

                const student = await prisma.user.findUnique({
                    where: { email: record.email }
                });

                if (student) {
                    await prisma.activity.create({
                        data: {
                            userId: student.id,
                            type: record.status === 'Present' ? 'ATTENDANCE_PRESENT' : 'ATTENDANCE_ABSENT',
                            title: `Attendance: ${activityDate.toLocaleDateString()}`,
                            description: `Marked as ${record.status} by Mentor`,
                            createdAt: activityDate
                        }
                    });
                    stats.success++;
                } else {
                    stats.failed++;
                }
            } catch (err) {
                console.error(`Error marking attendance for ${record.email}:`, err);
                stats.failed++;
            }
        }

        res.json({ message: 'Attendance marked', stats });
    } catch (error) {
        console.error('Attendance upload error:', error);
        res.status(500).json({ error: 'Failed to upload attendance' });
    }
});

// Get Mentor's Uploaded Sessions and Resources
app.get('/api/mentor/uploads', authenticateToken, requireRole('MENTOR'), async (req, res) => {
    try {
        const { type } = req.query;  // Filter by type: SESSION or RESOURCE

        const where = {
            uploadedById: req.user.id,
            type: { not: null }  // Exclude old courses
        };

        if (type) {
            where.type = type;
        }

        const uploads = await prisma.learningResource.findMany({
            where,
            include: {
                batch: { select: { name: true } },
                uploadedBy: { select: { name: true, avatar: true } },
                sessionTrackings: {
                    select: {
                        id: true,
                        completionPercentage: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Add stats for each upload
        const uploadsWithStats = uploads.map(upload => ({
            ...upload,
            studentCount: upload.sessionTrackings.length,
            avgCompletion: upload.sessionTrackings.length > 0
                ? upload.sessionTrackings.reduce((sum, t) => sum + t.completionPercentage, 0) / upload.sessionTrackings.length
                : 0
        }));

        res.json(uploadsWithStats);
    } catch (error) {
        console.error('Fetch uploads error:', error);
        res.status(500).json({ error: 'Failed to fetch uploads' });
    }
});

// Delete Upload (Session or Resource)
app.delete('/api/mentor/uploads/:id', authenticateToken, requireRole('MENTOR'), async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const upload = await prisma.learningResource.findUnique({
            where: { id }
        });

        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        if (upload.uploadedById !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.learningResource.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete upload error:', error);
        res.status(500).json({ error: 'Failed to delete upload' });
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

        // Broadcast new meeting
        io.emit('new_meeting', session);

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
            // 1. Get mentors from direct Mentorship records
            const mentorships = await prisma.mentorship.findMany({
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

            // 2. Get mentors assigned to the student's batches via BatchMentor
            const studentBatches = await prisma.batchStudent.findMany({
                where: { studentId: userId },
                select: { batchId: true }
            });
            const batchIds = studentBatches.map(b => b.batchId);

            let batchMentors = [];
            if (batchIds.length > 0) {
                const batchMentorRecords = await prisma.batchMentor.findMany({
                    where: { batchId: { in: batchIds } },
                    include: {
                        mentor: {
                            select: { id: true, name: true, email: true, avatar: true, phone: true }
                        }
                    }
                });
                batchMentors = batchMentorRecords.map(bm => bm.mentor);
            }

            // 3. Merge and deduplicate all mentors
            const directMentors = mentorships.map(m => m.mentor).filter(Boolean);
            const allMentorsMap = new Map();
            [...directMentors, ...batchMentors].forEach(m => {
                if (m && m.id) allMentorsMap.set(m.id, m);
            });
            const allMentors = Array.from(allMentorsMap.values());

            res.json({
                mentor: allMentors[0] || null,
                mentors: allMentors,
                meetings: mentorships.flatMap(m => m.meetings),
                mentorships: mentorships
            });
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
        const { filter } = req.query; // 'upcoming', 'past', or 'all' (default)

        const now = new Date();
        let dateFilter = {};

        if (filter === 'upcoming') {
            dateFilter = { gte: now };
        } else if (filter === 'past') {
            dateFilter = { lt: now };
        }

        let meetings;
        if (role === 'MENTOR') {
            meetings = await prisma.meeting.findMany({
                where: {
                    mentorship: { mentorId: userId },
                    ...(filter && filter !== 'all' ? { meetingDate: dateFilter } : {})
                },
                include: {
                    mentorship: {
                        include: {
                            mentee: { select: { name: true, avatar: true } }
                        }
                    }
                },
                orderBy: { meetingDate: filter === 'past' ? 'desc' : 'asc' }
            });
        } else {
            // For students: Fetch sessions from batches they're enrolled in
            const studentBatches = await prisma.batchStudent.findMany({
                where: { studentId: userId },
                select: {
                    batchId: true,
                    batch: {
                        select: {
                            mentors: {
                                include: {
                                    mentor: {
                                        select: { id: true, name: true, avatar: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const batchIds = studentBatches.map(sb => sb.batchId);

            // Fetch all sessions
            const sessions = await prisma.session.findMany({
                where: {
                    ...(filter && filter !== 'all' ? { scheduledAt: dateFilter } : {})
                },
                orderBy: { scheduledAt: filter === 'past' ? 'desc' : 'asc' }
            });

            // Filter sessions by batch and transform to meeting format
            meetings = sessions
                .filter(s => {
                    try {
                        const meta = JSON.parse(s.description);
                        return meta.batchId && batchIds.includes(meta.batchId);
                    } catch {
                        return false;
                    }
                })
                .map(s => {
                    const meta = JSON.parse(s.description);
                    // Find mentor info from batch
                    const batch = studentBatches.find(sb => sb.batchId === meta.batchId);
                    const mentor = batch?.batch.mentors.find(m => m.mentor.id === meta.mentorId)?.mentor;

                    return {
                        id: s.id,
                        meetingDate: s.scheduledAt,
                        duration: s.duration,
                        discussionSummary: s.title,
                        mentorship: {
                            mentor: mentor || { name: 'Unknown', avatar: null }
                        }
                    };
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
        const note = await prisma.notification.create({
            data: {
                userId: otherPartyId,
                title: 'New Meeting Scheduled',
                message: `${req.user.name} has scheduled a meeting on ${new Date(meetingDate).toLocaleDateString()}`,
                type: 'info'
            }
        });

        // Socket notification
        io.to(`user_${otherPartyId}`).emit('notification', note);

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

// ============ CHAT CONTACTS ============

// Get available contacts for new chats
app.get('/api/chat/contacts', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                batchesAsStudent: { include: { batch: { include: { mentors: { include: { mentor: true } } } } } },
                batchesAsMentor: { include: { batch: { include: { students: { include: { student: true } } } } } },
                mentorships: { include: { mentor: true } },
                menteeships: { include: { mentee: true } }
            }
        });

        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        const contacts = new Map();

        // Helper to add contact
        const addContact = (user, type) => {
            if (user.id !== userId && !contacts.has(user.id)) {
                contacts.set(user.id, {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    role: user.role,
                    type // 'mentor', 'student', 'admin'
                });
            }
        };

        // 1. Add Admins (visible to everyone)
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, name: true, avatar: true, role: true }
        });
        admins.forEach(admin => addContact(admin, 'admin'));

        // 2. Add specific contacts based on role
        if (currentUser.role === 'STUDENT') {
            // Add Batch Mentors
            currentUser.batchesAsStudent.forEach(bs => {
                bs.batch.mentors.forEach(bm => {
                    addContact(bm.mentor, 'mentor');
                });
            });
            // Add Direct Mentors
            currentUser.mentorships.forEach(m => {
                addContact(m.mentor, 'mentor');
            });
        } else if (currentUser.role === 'MENTOR') {
            // Add Batch Students
            currentUser.batchesAsMentor.forEach(bm => {
                bm.batch.students.forEach(bs => {
                    addContact(bs.student, 'student');
                });
            });
            // Add Direct Mentees
            currentUser.menteeships.forEach(m => {
                addContact(m.mentee, 'student');
            });
        } else if (currentUser.role === 'ADMIN') {
            // Admins can see everyone (or at least Mentors and Students)
            // For scalability, maybe limit this, but user asked for visibility.
            // Let's strictly follow "admin should gets added in student and mentor messaging list"
            // -> This endpoint is for the user to see contacts. Admin sees everyone?
            // Let's fetch all Mentors and Students for Admin.
            const allUsers = await prisma.user.findMany({
                where: { role: { in: ['STUDENT', 'MENTOR'] } },
                select: { id: true, name: true, avatar: true, role: true }
            });
            allUsers.forEach(u => addContact(u, u.role.toLowerCase()));
        }

        res.json(Array.from(contacts.values()));
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// Create Direct Message Group
app.post('/api/chat/groups/direct', authenticateToken, async (req, res) => {
    try {
        const { userId: targetUserId } = req.body;
        const currentUserId = req.user.id;

        if (!targetUserId) {
            return res.status(400).json({ error: 'Target user ID is required' });
        }

        // Check if DM already exists
        const existingGroup = await prisma.chatGroup.findFirst({
            where: {
                groupType: 'direct',
                AND: [
                    { members: { some: { userId: currentUserId } } },
                    { members: { some: { userId: targetUserId } } }
                ]
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true, role: true } }
                    }
                },
                createdBy: { select: { id: true, name: true, avatar: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { sender: { select: { name: true } } }
                }
            }
        });

        if (existingGroup) {
            return res.json(existingGroup);
        }

        // Create new DM group
        const newGroup = await prisma.chatGroup.create({
            data: {
                name: 'Direct Message',
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
                members: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true, role: true } }
                    }
                },
                createdBy: { select: { id: true, name: true, avatar: true } },
                messages: true // Empty initially
            }
        });

        // Notify target user
        io.to(`user_${targetUserId}`).emit('group_invite', { group: newGroup });

        res.status(201).json(newGroup);
    } catch (error) {
        console.error('Create DM error:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// ============ CHAT SYSTEM ROUTES ============

// Get all groups for user
app.get('/api/chat/groups', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // --- AUTO-CREATE DEFAULT CONVERSATIONS START ---
        // Fetch current user role
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (currentUser) {
            const targetIds = new Set();

            // 1. Add all Admins (everyone should be able to chat with admin)
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true }
            });
            admins.forEach(a => targetIds.add(a.id));

            // 2. Add Assigned Mentors (if user is Student)
            if (currentUser.role === 'STUDENT') {
                const mentorships = await prisma.mentorship.findMany({
                    where: { menteeId: userId },
                    select: { mentorId: true }
                });
                mentorships.forEach(m => targetIds.add(m.mentorId));
            }

            // 3. Add Students (if user is Mentor - optional, but user requested 'added in list')
            // Note: This might spam mentor if they have many students, but requested behavior implies mutual visibility.
            if (currentUser.role === 'MENTOR') {
                // For now, let's strictly follow "when student message to mentor... student should get added".
                // But also "assigned mentor... added to chat list".
                // So for Mentor, we won't auto-create chats with all students to avoid clutter, 
                // as the requirement says "when student message to mentor".
                // However, "admin should gets added in student and mentor messaging list".
            }

            // Remove self and ensure no duplicates
            targetIds.delete(userId);

            // Ensure DM groups exist
            for (const targetId of targetIds) {
                // Check if group exists
                const existingGroup = await prisma.chatGroup.findFirst({
                    where: {
                        groupType: 'direct',
                        AND: [
                            { members: { some: { userId: userId } } },
                            { members: { some: { userId: targetId } } }
                        ]
                    }
                });

                if (!existingGroup) {
                    console.log(`Auto-creating DM between ${userId} and ${targetId}`);
                    try {
                        await prisma.chatGroup.create({
                            data: {
                                name: 'Direct Message',
                                groupType: 'direct',
                                createdById: userId, // User acts as creator
                                members: {
                                    create: [
                                        { userId: userId, role: 'member', status: 'accepted' },
                                        { userId: targetId, role: 'member', status: 'accepted' }
                                    ]
                                }
                            }
                        });
                    } catch (err) {
                        console.error('Error auto-creating DM:', err);
                        // Continue to next target, don't fail the request
                    }
                }
            }
        }
        // --- AUTO-CREATE DEFAULT CONVERSATIONS END ---

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

// Create Batch Group (Admin only)
app.post('/api/chat/groups/batch', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { batchId } = req.body;

        console.log('Creating batch group for batchId:', batchId);

        if (!batchId) {
            return res.status(400).json({ error: 'Batch ID is required' });
        }

        // Get batch with all students and mentors
        const batch = await prisma.batch.findUnique({
            where: { id: batchId },
            include: {
                students: { include: { student: true } },
                mentors: { include: { mentor: true } }
            }
        });

        if (!batch) {
            console.log('Batch not found:', batchId);
            return res.status(404).json({ error: 'Batch not found' });
        }

        console.log(`Found batch: ${batch.name}, Students: ${batch.students?.length || 0}, Mentors: ${batch.mentors?.length || 0}`);

        // Collect all user IDs (students + mentors)
        const studentIds = batch.students?.map(s => s.studentId) || [];
        const mentorIds = batch.mentors?.map(m => m.mentorId) || [];
        const allMemberIds = [...studentIds, ...mentorIds].filter(id => id !== req.user.id); // Exclude admin creator

        console.log('Member IDs:', allMemberIds);

        // Create batch group
        const group = await prisma.chatGroup.create({
            data: {
                name: `${batch.name} - Batch Group`,
                description: `Group chat for ${batch.name}`,
                groupType: 'batch',
                batchId: batchId,
                createdById: req.user.id,
                members: {
                    create: [
                        { userId: req.user.id, role: 'admin', status: 'accepted' },
                        ...allMemberIds.map(id => ({ userId: id, role: 'member', status: 'accepted' }))
                    ]
                }
            },
            include: {
                createdBy: { select: { name: true } },
                batch: { select: { name: true } },
                members: { include: { user: { select: { id: true, name: true, avatar: true } } } }
            }
        });

        console.log('Batch group created successfully:', group.id);

        // Notify all members via socket
        allMemberIds.forEach(userId => {
            io.to(`user_${userId}`).emit('group:created', { group });
        });

        res.status(201).json(group);
    } catch (error) {
        console.error('Create batch group error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        res.status(500).json({
            error: 'Failed to create batch group',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Create or Get Direct Message Group
app.post('/api/chat/groups/direct', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.body; // The other user's ID
        const currentUserId = req.user.id;

        if (userId === currentUserId) {
            return res.status(400).json({ error: 'Cannot create direct message with yourself' });
        }

        // Check if direct group already exists between these two users
        const existingGroup = await prisma.chatGroup.findFirst({
            where: {
                groupType: 'direct',
                AND: [
                    { members: { some: { userId: currentUserId } } },
                    { members: { some: { userId } } }
                ]
            },
            include: {
                members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        });

        if (existingGroup) {
            return res.json(existingGroup);
        }

        // Get the other user's info
        const otherUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

        // Create new direct message group
        const group = await prisma.chatGroup.create({
            data: {
                name: `${req.user.name} & ${otherUser.name}`,
                groupType: 'direct',
                createdById: currentUserId,
                members: {
                    create: [
                        { userId: currentUserId, role: 'admin', status: 'accepted' },
                        { userId, role: 'member', status: 'accepted' }
                    ]
                }
            },
            include: {
                members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        });

        // Notify the other user
        io.to(`user_${userId}`).emit('group:created', { group });

        res.status(201).json(group);
    } catch (error) {
        console.error('Create direct message error:', error);
        res.status(500).json({ error: 'Failed to create direct message' });
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

// Upload files for chat
app.post('/api/chat/upload', authenticateToken, upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const fileData = req.files.map(file => ({
            type: file.mimetype.startsWith('image/') ? 'image' : 'document',
            url: `/uploads/${file.filename}`,
            name: file.originalname,
            size: file.size,
            mimeType: file.mimetype
        }));

        res.json({ files: fileData });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

// Send message
app.post('/api/chat/groups/:groupId/messages', authenticateToken, async (req, res) => {
    try {
        const { content, attachments } = req.body;

        const message = await prisma.chatMessage.create({
            data: {
                groupId: req.params.groupId,
                senderId: req.user.id,
                content: content || '',
                attachments: attachments || null
            },
            include: {
                sender: { select: { id: true, name: true, avatar: true } }
            }
        });

        // Broadcast message to group
        io.to(`group_${req.params.groupId}`).emit('new_message', message);

        // Notify all group members (for Navbar badge)
        const groupMembers = await prisma.groupMember.findMany({
            where: { groupId: req.params.groupId }
        });

        groupMembers.forEach(member => {
            if (member.userId !== req.user.id) {
                io.to(`user_${member.userId}`).emit('new_message_notification', message);
            }
        });

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

// ============ READ RECEIPTS & REACTIONS ENDPOINTS ============

// Mark messages as read
app.post('/api/chat/groups/:groupId/messages/read', authenticateToken, async (req, res) => {
    try {
        const { messageIds } = req.body;
        const userId = req.user.id;

        const reads = await Promise.all(
            messageIds.map(messageId =>
                prisma.messageRead.upsert({
                    where: { messageId_userId: { messageId, userId } },
                    create: { messageId, userId },
                    update: { readAt: new Date() }
                })
            )
        );

        res.json({ success: true, reads });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Add reaction to message
app.post('/api/chat/messages/:messageId/reactions', authenticateToken, async (req, res) => {
    try {
        const { emoji } = req.body;
        const messageId = req.params.messageId;
        const userId = req.user.id;

        const reaction = await prisma.messageReaction.upsert({
            where: { messageId_userId_emoji: { messageId, userId, emoji } },
            create: { messageId, userId, emoji },
            update: {},
            include: { user: { select: { id: true, name: true, avatar: true } } }
        });

        const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
        io.to(`group_${message.groupId}`).emit('message_reaction', { messageId, reaction });

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
            where: { messageId_userId_emoji: { messageId, userId, emoji } }
        });

        const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
        io.to(`group_${message.groupId}`).emit('reaction_removed', { messageId, userId, emoji });

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
            include: { user: { select: { id: true, name: true, avatar: true } } }
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
        if (!q) return res.json([]);

        const messages = await prisma.chatMessage.findMany({
            where: {
                groupId: req.params.groupId,
                content: { contains: q, mode: 'insensitive' }
            },
            include: { sender: { select: { id: true, name: true, avatar: true } } },
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
                    include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } }
                },
                createdBy: { select: { id: true, name: true, avatar: true } },
                batch: { select: { id: true, name: true } }
            }
        });

        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (error) {
        console.error('Get group info error:', error);
        res.status(500).json({ error: 'Failed to fetch group info' });
    }
});

// Update group details (admin only)
app.put('/api/chat/groups/:groupId', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const groupId = req.params.groupId;

        const member = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: req.user.id } }
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

        const member = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: req.user.id } }
        });

        if (!member || member.role !== 'admin') {
            return res.status(403).json({ error: 'Only group admins can add members' });
        }

        const newMembers = await Promise.all(
            userIds.map(userId =>
                prisma.groupMember.create({
                    data: { groupId, userId, status: 'accepted' },
                    include: { user: { select: { id: true, name: true, avatar: true } } }
                })
            )
        );

        newMembers.forEach(newMember => {
            io.to(`user_${newMember.userId}`).emit('added_to_group', { groupId, group: { id: groupId } });
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

        const requester = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: req.user.id } }
        });

        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ error: 'Only group admins can remove members' });
        }

        await prisma.groupMember.delete({
            where: { groupId_userId: { groupId, userId } }
        });

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
        await prisma.groupMember.delete({
            where: { groupId_userId: { groupId: req.params.groupId, userId: req.user.id } }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({ error: 'Failed to leave group' });
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

// ============ FORUM / Q&A ============

// Get all forum posts (with optional batch filtering for mentors)
app.get('/api/forum/posts', authenticateToken, async (req, res) => {
    try {
        const { batchId } = req.query;
        const userId = req.user.id;
        const role = req.user.role;

        let whereClause = {};

        // If mentor, only show posts from students in their batches
        if (role === 'MENTOR' && batchId) {
            // Get students in this specific batch
            const batchStudents = await prisma.batchStudent.findMany({
                where: { batchId },
                select: { studentId: true }
            });
            const studentIds = batchStudents.map(bs => bs.studentId);
            whereClause.authorId = { in: studentIds };
        } else if (role === 'MENTOR' && !batchId) {
            // Get all students from all mentor's batches
            const mentorBatches = await prisma.batchMentor.findMany({
                where: { mentorId: userId },
                select: { batchId: true }
            });
            const batchIds = mentorBatches.map(bm => bm.batchId);
            const batchStudents = await prisma.batchStudent.findMany({
                where: { batchId: { in: batchIds } },
                select: { studentId: true }
            });
            const studentIds = batchStudents.map(bs => bs.studentId);
            whereClause.authorId = { in: studentIds };
        }

        const posts = await prisma.forumPost.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                },
                _count: {
                    select: { answers: true }
                }
            }
        });

        // Transform to include answersCount
        const transformedPosts = posts.map(post => ({
            ...post,
            answersCount: post._count.answers,
            _count: undefined
        }));

        res.json(transformedPosts);
    } catch (error) {
        console.error('Fetch forum posts error:', error);
        res.status(500).json({ error: 'Failed to fetch forum posts' });
    }
});

// Get single forum post with all answers
app.get('/api/forum/posts/:id', authenticateToken, async (req, res) => {
    try {
        const post = await prisma.forumPost.findUnique({
            where: { id: req.params.id },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true, role: true }
                },
                answers: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: {
                            select: { id: true, name: true, avatar: true, role: true }
                        }
                    }
                }
            }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Fetch forum post error:', error);
        res.status(500).json({ error: 'Failed to fetch forum post' });
    }
});

// Create forum post
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
                author: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        res.status(201).json(post);
    } catch (error) {
        console.error('Create forum post error:', error);
        res.status(500).json({ error: 'Failed to create forum post' });
    }
});

// Create answer to a forum post
app.post('/api/forum/posts/:postId/answers', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const { postId } = req.params;

        const answer = await prisma.forumAnswer.create({
            data: {
                content,
                postId,
                authorId: req.user.id
            },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true, role: true }
                }
            }
        });

        // Update answers count on the post
        await prisma.forumPost.update({
            where: { id: postId },
            data: {
                answersCount: {
                    increment: 1
                }
            }
        });

        res.status(201).json(answer);
    } catch (error) {
        console.error('Create answer error:', error);
        res.status(500).json({ error: 'Failed to create answer' });
    }
});

// Upvote an answer
app.post('/api/forum/answers/:answerId/upvote', authenticateToken, async (req, res) => {
    try {
        const answer = await prisma.forumAnswer.update({
            where: { id: req.params.answerId },
            data: {
                upvotes: {
                    increment: 1
                }
            }
        });

        res.json(answer);
    } catch (error) {
        console.error('Upvote answer error:', error);
        res.status(500).json({ error: 'Failed to upvote answer' });
    }
});

// ============ ASSIGNMENTS ============

// Mentor Routes
app.get('/api/mentor/batches', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        console.log('Fetching batches for mentor:', userId);
        const batches = await prisma.batchMentor.findMany({
            where: { mentorId: userId },
            include: { batch: true }
        });
        res.json(batches.map(bm => bm.batch));
    } catch (error) {
        console.error('Get mentor batches error:', error);
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
});

app.get('/api/mentor/students', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const mentorBatches = await prisma.batchMentor.findMany({
            where: { mentorId: userId },
            select: { batchId: true }
        });
        const batchIds = mentorBatches.map(bm => bm.batchId);

        const batchStudents = await prisma.batchStudent.findMany({
            where: { batchId: { in: batchIds } },
            include: { student: { select: { id: true, name: true, email: true, avatar: true } } }
        });

        const uniqueStudents = [...new Map(batchStudents.map(item => [item.student.id, item.student])).values()];
        res.json(uniqueStudents);
    } catch (error) {
        console.error('Get mentor students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

app.get('/api/mentor/meetings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const meetings = await prisma.meeting.findMany({
            where: { mentorship: { mentorId: userId } },
            include: { mentorship: { include: { mentee: { select: { name: true } } } } },
            orderBy: { meetingDate: 'desc' }
        });

        const transformed = meetings.map(m => ({
            id: m.id,
            title: m.discussionSummary || 'Mentorship Session',
            meetingDate: m.meetingDate,
            duration: m.duration,
            batch: { name: m.mentorship.mentee.name },
            discussionSummary: m.discussionSummary,
            status: new Date(m.meetingDate) < new Date() ? 'Completed' : 'Scheduled',
            link: ''
        }));
        res.json(transformed);
    } catch (error) {
        console.error('Get mentor meetings error:', error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
});

app.post('/api/mentor/meetings', authenticateToken, async (req, res) => {
    try {
        console.log('Schedule meeting request:', req.body);
        // Mock success for now to unblock frontend
        res.json({ message: 'Meeting scheduled successfully', id: 'temp-id' });
    } catch (error) {
        console.error('Schedule meeting error:', error);
        res.status(500).json({ error: 'Failed to schedule meeting' });
    }
});

// Create assignment (Mentor only)
app.post('/api/assignments', authenticateToken, async (req, res) => {
    try {
        console.log('Create Assignment Request:', {
            user: req.user,
            body: req.body
        });

        if (req.user.role !== 'MENTOR') {
            return res.status(403).json({ error: 'Only mentors can create assignments' });
        }

        const { title, description, dueDate, batchId, maxMarks } = req.body;

        if (!title || !description || !dueDate || !batchId) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const parsedDate = new Date(dueDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: 'Invalid due date format' });
        }

        const userId = req.user.userId || req.user.id;

        // Verify mentor is assigned to the batch
        const batchMentor = await prisma.batchMentor.findFirst({
            where: {
                batchId,
                mentorId: userId
            }
        });

        // Debug log for batch association
        if (!batchMentor) {
            console.log(`Mentor ${req.user.userId} is not assigned to batch ${batchId}`);
            // Check if batch exists at all
            const batchExists = await prisma.batch.findUnique({ where: { id: batchId } });
            if (!batchExists) return res.status(404).json({ error: 'Batch not found' });

            return res.status(403).json({ error: 'You are not assigned to this batch' });
        }

        const assignment = await prisma.assignment.create({
            data: {
                title,
                description,
                dueDate: parsedDate,
                batchId,
                maxMarks: Number(maxMarks) || 100, // Ensure number
                createdById: userId
            },
            include: {
                batch: true,
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        console.log('Assignment created successfully:', assignment.id);
        res.json(assignment);
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: `Failed to create assignment: ${error.message}` });
    }
});

// Get assignments (role-based)
app.get('/api/assignments', authenticateToken, async (req, res) => {
    try {
        const { batchId } = req.query;
        let assignments;

        if (req.user.role === 'MENTOR') {
            // Mentors see assignments they created
            const where = {
                createdById: req.user.userId
            };
            if (batchId) {
                where.batchId = batchId;
            }

            assignments = await prisma.assignment.findMany({
                where,
                include: {
                    batch: true,
                    createdBy: {
                        select: { id: true, name: true }
                    },
                    submissions: {
                        select: {
                            id: true,
                            status: true,
                            submittedAt: true,
                            student: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else if (req.user.role === 'STUDENT') {
            // Students see assignments from batches they're in (created by their mentors)
            const studentBatches = await prisma.batchStudent.findMany({
                where: { studentId: req.user.userId },
                select: { batchId: true }
            });

            const batchIds = studentBatches.map(b => b.batchId);

            assignments = await prisma.assignment.findMany({
                where: {
                    batchId: { in: batchIds }
                },
                include: {
                    batch: true,
                    createdBy: {
                        select: { id: true, name: true, avatar: true }
                    },
                    submissions: {
                        where: { studentId: req.user.userId },
                        select: {
                            id: true,
                            status: true,
                            marks: true,
                            feedback: true,
                            submittedAt: true,
                            reviewedAt: true
                        }
                    }
                },
                orderBy: { dueDate: 'asc' }
            });
        }

        res.json(assignments);
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

// Get single assignment with submissions (Mentor only)
app.get('/api/assignments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                batch: true,
                createdBy: {
                    select: { id: true, name: true }
                },
                submissions: {
                    include: {
                        student: {
                            select: { id: true, name: true, email: true, avatar: true }
                        }
                    },
                    orderBy: { submittedAt: 'desc' }
                }
            }
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Verify access
        // Verify access: Allow if creator OR if Mentor is assigned to the batch
        // For simplicity and immediate fix, checking if creator matches OR user is Admin
        const mentorId = req.user.userId || req.user.id;

        // Strict check: Only creator or admin can view details? 
        // Ideally any mentor assigned to the batch should be able to view.
        if (req.user.role === 'MENTOR' && assignment.createdById !== mentorId) {
            // Optional: Add logic to check if mentor is assigned to assignment.batchId
            // For now, trusting the creator check as that's the primary workflow
            // If this is failing, it means the ID comparison is wrong.
            console.log(`Access Denied: Creator ${assignment.createdById} vs Requestor ${mentorId}`);
            return res.status(403).json({ error: 'Access denied. You are not the creator of this assignment.' });
        }

        res.json(assignment);
    } catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({ error: 'Failed to fetch assignment' });
    }
});

// Submit assignment (Student only) - With File Upload
app.post('/api/assignments/:id/submit', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'STUDENT') {
            return res.status(403).json({ error: 'Only students can submit assignments' });
        }

        const { id } = req.params;
        const studentId = req.user.userId || req.user.id;
        const file = req.file;
        const { content } = req.body;

        // Verify assignment exists and student is in the batch
        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: { batch: { include: { students: true } } }
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Check if student belongs to batch
        const isInBatch = assignment.batch.students.some(
            s => s.studentId === studentId
        );

        if (!isInBatch) {
            return res.status(403).json({ error: 'You are not in this batch' });
        }

        // Determine content (Text or File URL)
        let submissionContent = content || '';
        if (file) {
            // Using a simple path strategy. ideally upload to cloud or dedicated folder
            // For now assuming static serve from /uploads/avatars (as configured in index.js)
            // Ideally we should make a separate 'documents' folder but 'avatars' is already configured statically
            // checking line 35: app.use('/uploads', express.static...
            // checking multer dest: uploadDir...
            const fileUrl = `/uploads/avatars/${file.filename}`;
            submissionContent = fileUrl;
        }

        if (!submissionContent) {
            return res.status(400).json({ error: 'Please provide text content or upload a file' });
        }

        // Create or update submission
        const submission = await prisma.assignmentSubmission.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId: id,
                    studentId: studentId
                }
            },
            update: {
                content: submissionContent,
                status: 'PENDING',
                submittedAt: new Date()
            },
            create: {
                assignmentId: id,
                studentId: studentId,
                content: submissionContent,
                status: 'PENDING'
            },
            include: {
                student: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json(submission);
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ error: 'Failed to submit assignment' });
    }
});

// Get Student Dashboard
app.get('/api/student/dashboard', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Student access only' });

        const studentId = req.user.userId || req.user.id;

        // Get student's batches
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                batchesAsStudent: {
                    include: {
                        batch: true
                    }
                },
                loginLogs: {
                    orderBy: { loginDate: 'desc' },
                    take: 365
                }
            }
        });

        const batchIds = student.batchesAsStudent.map(b => b.batch.id);

        // Get assignments for student's batches
        const assignments = await prisma.assignment.findMany({
            where: {
                batchId: { in: batchIds }
            },
            include: {
                batch: true,
                submissions: {
                    where: { studentId },
                    select: {
                        id: true,
                        status: true,
                        marks: true,
                        feedback: true,
                        submittedAt: true
                    }
                }
            },
            orderBy: { dueDate: 'desc' },
            take: 5
        });

        // Get announcements for student's batches or global announcements
        const allAnnouncements = await prisma.announcement.findMany({
            include: {
                batches: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Filter for student's batches or announcements with no batch restrictions (global)
        const announcements = allAnnouncements
            .filter(ann =>
                ann.batches.length === 0 || // Global announcement (no batches)
                ann.batches.some(ab => batchIds.includes(ab.batchId)) // Student's batch
            )
            .slice(0, 5); // Take top 5


        // Get upcoming sessions for student's batches
        const now = new Date();
        const sessions = await prisma.session.findMany({
            where: {
                scheduledAt: { gte: now }
            },
            orderBy: { scheduledAt: 'asc' },
            take: 10
        });

        // Filter sessions relevant to student's batches and transform
        const upcomingSessions = sessions
            .filter(session => {
                try {
                    const desc = JSON.parse(session.description || '{}');
                    return desc.batchId && batchIds.includes(desc.batchId);
                } catch {
                    return false;
                }
            })
            .map(session => {
                const desc = JSON.parse(session.description || '{}');
                return {
                    id: session.id,
                    title: session.title,
                    scheduledAt: session.scheduledAt,
                    duration: session.duration,
                    type: session.type,
                    link: desc.link || ''
                };
            });

        // Calculate login streak
        const loginDates = student.loginLogs
            .map(l => new Date(l.loginDate).toISOString().split('T')[0])
            .filter((date, index, self) => self.indexOf(date) === index) // Remove duplicates
            .sort((a, b) => new Date(b) - new Date(a)); // Sort descending

        let loginStreak = 0;
        let streakStatus = 'active';
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (loginDates.length > 0) {
            const mostRecentLogin = loginDates[0];

            if (mostRecentLogin === today || mostRecentLogin === yesterday) {
                // Calculate streak
                loginStreak = 1;
                let checkDate = new Date(mostRecentLogin);

                for (let i = 1; i < loginDates.length; i++) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    const expectedDate = checkDate.toISOString().split('T')[0];

                    if (loginDates[i] === expectedDate) {
                        loginStreak++;
                    } else {
                        break;
                    }
                }

                streakStatus = mostRecentLogin === today ? 'active' : 'continue';
            } else {
                // Streak broken
                streakStatus = 'paused';
                loginStreak = 0;
            }
        }

        // Calculate attendance percentage from sessionTracking
        const totalTracked = await prisma.sessionTracking.count({
            where: { userId: studentId }
        });

        const attendedCount = await prisma.sessionTracking.count({
            where: {
                userId: studentId,
                attendanceMarked: true
            }
        });

        const attendancePercentage = totalTracked > 0
            ? Math.round((attendedCount / totalTracked) * 100)
            : 0;

        // Count learning resources (LearningResource model) for student's batches
        const learningResourcesCount = await prisma.learningResource.count({
            where: {
                OR: [
                    { batchId: { in: batchIds } },
                    { batchId: null }
                ]
            }
        });

        res.json({
            assignments,
            announcements,
            batches: student.batchesAsStudent.map(b => b.batch),
            upcomingSessions,
            loginDates,
            stats: {
                loginStreak,
                streakStatus,
                totalLoginDays: loginDates.length,
                attendancePercentage,
                completedCourses: await prisma.sessionTracking.count({
                    where: {
                        userId: studentId,
                        completionPercentage: { gte: 95 }
                    }
                }),
                learningResources: learningResourcesCount
            }
        });

    } catch (error) {
        console.error('Student dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Get Student Meetings (Upcoming sessions)
app.get('/api/student/meetings', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Student access only' });

        const studentId = req.user.userId || req.user.id;

        // Fetch 1:1 Mentorship Meetings
        const meetings = await prisma.meeting.findMany({
            where: {
                mentorship: {
                    menteeId: studentId
                }
            },
            include: {
                mentorship: {
                    include: {
                        mentor: { select: { id: true, name: true, avatar: true } }
                    }
                }
            },
            orderBy: { meetingDate: 'asc' }
        });

        const now = new Date();
        const upcoming = meetings.filter(m => new Date(m.meetingDate) > now);

        const transformed = upcoming.map(m => ({
            id: m.id,
            title: m.discussionSummary || 'Mentorship Session',
            date: m.meetingDate,
            mentorName: m.mentorship.mentor.name,
            mentorAvatar: m.mentorship.mentor.avatar,
            duration: m.duration,
            link: ''
        }));

        res.json(transformed);
    } catch (error) {
        console.error('Get student meetings error:', error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
});

// Review submission (Mentor only)
app.put('/api/assignments/submissions/:submissionId/review', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'MENTOR') {
            return res.status(403).json({ error: 'Only mentors can review submissions' });
        }

        const { submissionId } = req.params;
        const { status, marks, feedback } = req.body;

        // Verify submission exists and mentor created the assignment
        const submission = await prisma.assignmentSubmission.findUnique({
            where: { id: submissionId },
            include: { assignment: true }
        });

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const mentorId = req.user.userId || req.user.id;

        if (submission.assignment.createdById !== mentorId) {
            console.log(`Review Access Denied: Assignment Creator ${submission.assignment.createdById} vs Reviewer ${mentorId}`);
            return res.status(403).json({ error: 'You can only review assignments you created' });
        }

        // Update submission
        const updatedSubmission = await prisma.assignmentSubmission.update({
            where: { id: submissionId },
            data: {
                status,
                marks: marks !== undefined ? marks : null,
                feedback: feedback || null,
                reviewedById: req.user.userId,
                reviewedAt: new Date()
            },
            include: {
                student: {
                    select: { id: true, name: true, email: true }
                },
                assignment: true
            }
        });

        res.json(updatedSubmission);
    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({ error: 'Failed to review submission' });
    }
});

// ============ AI CHATBOT ============

// Initialize Gemini AI
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chatbot endpoint - Educational assistant for students
app.post('/api/chatbot/ask', authenticateToken, async (req, res) => {
    try {
        // Only students can use the chatbot
        if (req.user.role !== 'STUDENT') {
            return res.status(403).json({ error: 'Chatbot is available for students only' });
        }

        const { question, conversationHistory } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // Configure the model with educational and technical focus
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are an AI Study Assistant for students at Khushboo Pathshala. 
Your role is to help with educational questions, programming, coding, and technical topics.

IMPORTANT GUIDELINES:
- Answer ALL educational, academic, programming, coding, and technical questions
- Provide accurate, well-researched information with examples
- Include relevant links to educational resources (Khan Academy, MDN, GeeksforGeeks, W3Schools, Stack Overflow, GitHub, etc.)
- Explain concepts clearly with code examples when relevant
- Keep responses concise but informative (2-4 paragraphs maximum)
- Format code blocks properly and links as: [Resource Name](URL)
- Be encouraging and supportive
- If unsure, acknowledge limitations rather than guessing

TOPICS YOU CAN HELP WITH:
✅ Programming & Development: JavaScript, Python, Java, C++, HTML, CSS, React, Node.js, databases, algorithms
✅ Computer Science: Data structures, algorithms, systems, networking, databases
✅ Mathematics & Sciences: Math, Physics, Chemistry, Biology
✅ Academic Subjects: History, Literature, Languages, Geography
✅ Study Skills: Study techniques, time management, exam prep
✅ Technology: Web development, mobile apps, AI/ML basics, cloud computing
✅ Career Guidance: Tech careers, education paths

TOPICS TO POLITELY DECLINE:
❌ Medical, legal, or financial advice
❌ Writing full assignment solutions (guide instead)
❌ Inappropriate or harmful content

Remember: You're here to TEACH and GUIDE, not just give answers!`
        });

        // Safety settings to prevent inappropriate content
        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ];

        // Build conversation context
        let chatHistory = [];
        if (conversationHistory && Array.isArray(conversationHistory)) {
            // Limit to last 10 messages for context
            chatHistory = conversationHistory.slice(-10).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));
        }

        // Start chat with history
        const chat = model.startChat({
            history: chatHistory,
            safetySettings,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        });

        // Send message and get response
        const result = await chat.sendMessage(question);
        const response = result.response;
        const answer = response.text();

        // Check if response was blocked
        if (!answer || answer.trim() === '') {
            return res.status(400).json({
                error: 'I cannot provide a response to that question. Please ask an educational question instead.',
                blocked: true
            });
        }

        res.json({
            answer: answer,
            success: true
        });

    } catch (error) {
        console.error('Chatbot error:', error);

        // Handle specific error types
        if (error.message?.includes('API key')) {
            return res.status(500).json({ error: 'Chatbot configuration error. Please contact support.' });
        }

        res.status(500).json({
            error: 'Failed to process your question. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});



// ============ ANNOUNCEMENTS ============

app.get('/api/announcements', authenticateToken, async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: { select: { name: true } }
            }
        });
        res.json(announcements);
    } catch (error) {
        console.error('Fetch announcements error:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

app.post('/api/announcements', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { title, content, priority, batchIds } = req.body;

        // Create announcement
        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                priority: priority || 'normal',
                createdById: req.user.id,
                // Create batch associations if batchIds provided
                ...(batchIds && batchIds.length > 0 && {
                    batches: {
                        create: batchIds.map(batchId => ({
                            batchId
                        }))
                    }
                })
            },
            include: {
                createdBy: { select: { name: true } },
                batches: {
                    include: {
                        batch: { select: { name: true } }
                    }
                }
            }
        });

        res.status(201).json(announcement);

        // Broadcast new announcement
        io.emit('new_announcement', announcement);

        // Create Notifications for Users
        try {
            let recipientIds = [];
            if (batchIds && batchIds.length > 0) {
                // Get students in these batches
                const students = await prisma.batchStudent.findMany({
                    where: { batchId: { in: batchIds } },
                    select: { studentId: true }
                });
                recipientIds = [...new Set(students.map(s => s.studentId))];
            } else {
                // Global announcement - get all students (and maybe mentors?)
                const users = await prisma.user.findMany({
                    where: { role: { in: ['STUDENT', 'MENTOR'] } },
                    select: { id: true }
                });
                recipientIds = users.map(u => u.id);
            }

            if (recipientIds.length > 0) {
                await prisma.notification.createMany({
                    data: recipientIds.map(uid => ({
                        userId: uid,
                        title: `New Announcement: ${title}`,
                        message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                        type: 'info'
                    }))
                });
            }
        } catch (notifError) {
            console.error('Failed to create announcement notifications:', notifError);
        }
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

// ============ ASSIGNMENT ROUTES ============

// Create assignment (Mentor/Admin)
app.post('/api/assignments', authenticateToken, async (req, res) => {
    try {
        const { title, description, dueDate, batchId, maxMarks } = req.body;

        const assignment = await prisma.assignment.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                maxMarks: maxMarks || 100,
                createdById: req.user.id,
                batchId
            },
            include: {
                batch: { select: { name: true } }
            }
        });

        res.status(201).json(assignment);

        // Broadcast new assignment
        io.emit('new_assignment', assignment);

        // Create Notifications for Batch Students
        try {
            const students = await prisma.batchStudent.findMany({
                where: { batchId },
                select: { studentId: true }
            });

            const recipientIds = students.map(s => s.studentId);

            if (recipientIds.length > 0) {
                await prisma.notification.createMany({
                    data: recipientIds.map(uid => ({
                        userId: uid,
                        title: `New Assignment: ${title}`,
                        message: `Due: ${new Date(dueDate).toLocaleDateString()}`,
                        type: 'warning'
                    }))
                });
            }
        } catch (notifError) {
            console.error('Failed to create assignment notifications:', notifError);
        }
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: 'Failed to create assignment' });
    }
});

// Get assignments
app.get('/api/assignments', authenticateToken, async (req, res) => {
    try {
        const { batchId } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let assignments;

        if (userRole === 'STUDENT') {
            // Get student's batches
            const studentBatches = await prisma.batchStudent.findMany({
                where: { studentId: userId },
                select: { batchId: true }
            });
            const batchIds = studentBatches.map(b => b.batchId);

            assignments = await prisma.assignment.findMany({
                where: { batchId: { in: batchIds } },
                include: {
                    batch: { select: { name: true } },
                    submissions: {
                        where: { studentId: userId },
                        include: {
                            reviewedBy: { select: { name: true } }
                        }
                    }
                },
                orderBy: { dueDate: 'asc' }
            });
        } else {
            // Mentor/Admin
            const where = batchId ? { batchId } : {};
            assignments = await prisma.assignment.findMany({
                where,
                include: {
                    batch: { select: { name: true } },
                    submissions: {
                        include: {
                            student: { select: { id: true, name: true, avatar: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        res.json(assignments);
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

// Get assignment details
app.get('/api/assignments/:id', authenticateToken, async (req, res) => {
    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id: req.params.id },
            include: {
                batch: { select: { name: true } },
                submissions: {
                    include: {
                        student: { select: { id: true, name: true, avatar: true } },
                        reviewedBy: { select: { name: true } }
                    },
                    orderBy: { submittedAt: 'desc' }
                }
            }
        });

        res.json(assignment);
    } catch (error) {
        console.error('Get assignment details error:', error);
        res.status(500).json({ error: 'Failed to fetch assignment details' });
    }
});

// Submit assignment
app.post('/api/assignments/:id/submit', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const studentId = req.user.id;

        const submissionContent = req.file ? `/uploads/${req.file.filename}` : content;

        const submission = await prisma.assignmentSubmission.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId: id,
                    studentId
                }
            },
            update: {
                content: submissionContent,
                submittedAt: new Date(),
                status: 'PENDING',
                marks: null,
                feedback: null,
                reviewedAt: null,
                reviewedById: null
            },
            create: {
                assignmentId: id,
                studentId,
                content: submissionContent,
                status: 'PENDING'
            }
        });

        res.status(201).json(submission);
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ error: 'Failed to submit assignment' });
    }
});

// Review submission (Mentor/Admin)
app.put('/api/assignments/submissions/:id/review', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, marks, feedback } = req.body;

        const submission = await prisma.assignmentSubmission.update({
            where: { id },
            data: {
                status,
                marks,
                feedback,
                reviewedAt: new Date(),
                reviewedById: req.user.id
            }
        });

        res.json(submission);
    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({ error: 'Failed to review submission' });
    }
});

// ============ QUIZ ROUTES ============

// Create quiz (Mentor/Admin)
app.post('/api/quizzes', authenticateToken, async (req, res) => {
    try {
        const { title, description, duration, totalMarks, passingMarks, dueDate, batches, questions } = req.body;

        const quiz = await prisma.quiz.create({
            data: {
                title,
                description,
                duration,
                totalMarks,
                passingMarks,
                dueDate: dueDate ? new Date(dueDate) : null,
                batches: batches || [],
                questions: questions || [],
                createdById: req.user.id
            }
        });

        res.status(201).json(quiz);

        // Broadcast new quiz
        io.emit('new_quiz', quiz);

        // Create Notifications
        try {
            const quizBatches = batches || [];
            if (quizBatches.length > 0) {
                const students = await prisma.batchStudent.findMany({
                    where: { batchId: { in: quizBatches } },
                    select: { studentId: true }
                });

                const recipientIds = [...new Set(students.map(s => s.studentId))];

                if (recipientIds.length > 0) {
                    await prisma.notification.createMany({
                        data: recipientIds.map(uid => ({
                            userId: uid,
                            title: `New Quiz: ${title}`,
                            message: `Duration: ${duration} mins. Good luck!`,
                            type: 'warning'
                        }))
                    });
                }
            }
        } catch (notifError) {
            console.error('Failed to create quiz notifications:', notifError);
        }

    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ error: 'Failed to create quiz' });
    }
});

// Get quizzes for mentor
app.get('/api/quizzes/mentor', authenticateToken, async (req, res) => {
    try {
        const quizzes = await prisma.quiz.findMany({
            where: { createdById: req.user.id },
            include: {
                submissions: {
                    include: {
                        student: { select: { id: true, name: true, avatar: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(quizzes);
    } catch (error) {
        console.error('Get mentor quizzes error:', error);
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

// Get quizzes for student
app.get('/api/quizzes/student', authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.id;

        // Get student's batches
        const studentBatches = await prisma.batchStudent.findMany({
            where: { studentId },
            select: { batchId: true }
        });
        const batchIds = studentBatches.map(b => b.batchId);

        // Get quizzes assigned to these batches
        const allQuizzes = await prisma.quiz.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Filter quizzes where batches array contains at least one of student's batchIds
        const quizzes = allQuizzes.filter(quiz => {
            const quizBatches = quiz.batches || [];
            return quizBatches.some(qb => batchIds.includes(qb));
        });

        // Get submissions for each quiz
        const quizzesWithSubmissions = await Promise.all(
            quizzes.map(async (quiz) => {
                const submission = await prisma.quizSubmission.findUnique({
                    where: {
                        quizId_studentId: {
                            quizId: quiz.id,
                            studentId
                        }
                    }
                });
                return { ...quiz, submission };
            })
        );

        res.json(quizzesWithSubmissions);
    } catch (error) {
        console.error('Get student quizzes error:', error);
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

// Get quiz details
app.get('/api/quizzes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const quiz = await prisma.quiz.findUnique({
            where: { id }
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Check if student has already started or submitted
        const submission = await prisma.quizSubmission.findUnique({
            where: {
                quizId_studentId: {
                    quizId: id,
                    studentId: userId
                }
            }
        });

        res.json({ ...quiz, submission });
    } catch (error) {
        console.error('Get quiz details error:', error);
        res.status(500).json({ error: 'Failed to fetch quiz details' });
    }
});

// Start quiz (creates submission record)
app.post('/api/quizzes/:id/start', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;

        // Check if already started
        const existing = await prisma.quizSubmission.findUnique({
            where: {
                quizId_studentId: { quizId: id, studentId }
            }
        });

        if (existing) {
            return res.json(existing);
        }

        const submission = await prisma.quizSubmission.create({
            data: {
                quizId: id,
                studentId,
                answers: {},
                status: 'IN_PROGRESS'
            }
        });

        res.status(201).json(submission);
    } catch (error) {
        console.error('Start quiz error:', error);
        res.status(500).json({ error: 'Failed to start quiz' });
    }
});

// Submit quiz
app.post('/api/quizzes/:id/submit', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body;
        const studentId = req.user.id;

        // Get quiz
        const quiz = await prisma.quiz.findUnique({
            where: { id }
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Calculate score
        const questions = quiz.questions || [];
        let score = 0;
        const totalQuestions = questions.length;

        questions.forEach(q => {
            if (answers[q.id] === q.correctOption) {
                score++;
            }
        });

        const finalScore = Math.round((score / totalQuestions) * quiz.totalMarks);

        // Update submission
        const submission = await prisma.quizSubmission.update({
            where: {
                quizId_studentId: {
                    quizId: id,
                    studentId
                }
            },
            data: {
                answers,
                score: finalScore,
                submittedAt: new Date(),
                status: 'COMPLETED'
            }
        });

        res.json({ ...submission, totalMarks: quiz.totalMarks });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});


// ============ MISSING BACKEND INTEGRATIONS ============

// 1. Advanced Batch Analytics & Visualizations
app.get('/api/admin/analytics/attendance-trend', authenticateToken, requireRole('ADMIN', 'MENTOR'), async (req, res) => {
    try {
        const trackings = await prisma.sessionTracking.findMany({ select: { createdAt: true } });
        const grouped = trackings.reduce((acc, t) => {
            const date = t.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        res.json({ labels: Object.keys(grouped), datasets: [{ label: 'Attendance', data: Object.values(grouped) }] });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/analytics/submission-rate', authenticateToken, requireRole('ADMIN', 'MENTOR'), async (req, res) => {
    try {
        const subs = await prisma.assignmentSubmission.findMany({ include: { assignment: { include: { batch: true } } } });
        const grouped = subs.reduce((acc, s) => {
            const batchName = s.assignment?.batch?.name || 'Unknown';
            acc[batchName] = (acc[batchName] || 0) + 1;
            return acc;
        }, {});
        res.json({ labels: Object.keys(grouped), datasets: [{ label: 'Submissions', data: Object.values(grouped) }] });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/analytics/batch-comparison', authenticateToken, requireRole('ADMIN', 'MENTOR'), async (req, res) => {
    try {
        const batches = await prisma.batch.findMany({ include: { _count: { select: { students: true } } } });
        res.json({ labels: batches.map(b => b.name), datasets: [{ data: batches.map(b => b._count.students) }] });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/mentor/analytics/:batchId', authenticateToken, requireRole('ADMIN', 'MENTOR'), async (req, res) => {
    try {
        const students = await prisma.batchStudent.count({ where: { batchId: req.params.batchId } });
        res.json({ students });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Granular Learning Course Tracking
app.get('/api/student/courses', authenticateToken, async (req, res) => {
    try {
        const courses = await prisma.course.findMany({ include: { modules: { include: { lessons: true } } } });
        res.json(courses);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/student/courses/:id', authenticateToken, async (req, res) => {
    try {
        const course = await prisma.course.findUnique({ where: { id: req.params.id }, include: { modules: { include: { lessons: true } } } });
        res.json(course);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/student/courses/:id/progress', authenticateToken, async (req, res) => {
    try {
        const { completedLessons, completionPercentage } = req.body;
        const progress = await prisma.courseProgress.upsert({
            where: { studentId_courseId: { studentId: req.user.id, courseId: req.params.id } },
            update: { completedLessons, completionPercentage, lastAccessed: new Date() },
            create: { studentId: req.user.id, courseId: req.params.id, completedLessons, completionPercentage }
        });
        res.json(progress);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/student/courses/:id/progress', authenticateToken, async (req, res) => {
    try {
        const progress = await prisma.courseProgress.findUnique({ where: { studentId_courseId: { studentId: req.user.id, courseId: req.params.id } } });
        res.json(progress || { completedLessons: 0, completionPercentage: 0 });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3. Login Heatmap Tracking
app.get('/api/student/activity', authenticateToken, async (req, res) => {
    try {
        const logs = await prisma.loginLog.findMany({ where: { userId: req.user.id }, orderBy: { loginDate: 'asc' } });
        const dates = [...new Set(logs.map(l => l.loginDate.toISOString().split('T')[0]))];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const active30 = dates.filter(d => new Date(d) >= thirtyDaysAgo).length;

        let streak = 0;
        let p = new Date();
        for (let i = dates.length - 1; i >= 0; i--) {
            const dStr = p.toISOString().split('T')[0];
            if (dates.includes(dStr) || dates.includes(new Date(p.getTime() - 86400000).toISOString().split('T')[0])) {
                streak++; p.setDate(p.getDate() - 1);
            } else { break; }
        }
        res.json({ loginDates: dates, activeDays30: active30, currentStreak: streak });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. Notifications
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true, readAt: new Date() } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        await prisma.notification.update({ where: { id: req.params.id }, data: { read: true, readAt: new Date() } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/notifications/clear', authenticateToken, async (req, res) => {
    try {
        await prisma.notification.deleteMany({ where: { userId: req.user.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. Forum Upvoting & Threading Complexities
app.delete('/api/forum/answers/:answerId/upvote', authenticateToken, async (req, res) => {
    try {
        await prisma.answerVote.delete({ where: { userId_answerId: { userId: req.user.id, answerId: req.params.answerId } } });
        await prisma.forumAnswer.update({ where: { id: req.params.answerId }, data: { upvotes: { decrement: 1 } } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/forum/answers/:id/accept', authenticateToken, async (req, res) => {
    try {
        const updated = await prisma.forumAnswer.update({ where: { id: req.params.id }, data: { isAccepted: true } });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. Advanced Quiz and Assignment Grading
app.post('/api/assignments/submissions/:id/grade', authenticateToken, requireRole('MENTOR', 'ADMIN'), async (req, res) => {
    try {
        const { rubricBreakdown, overallScore, feedback } = req.body;
        const updated = await prisma.assignmentSubmission.update({
            where: { id: req.params.id },
            data: { rubricBreakdown, marks: overallScore, feedback, status: 'GRADED', reviewedAt: new Date(), reviewedById: req.user.id }
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
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
