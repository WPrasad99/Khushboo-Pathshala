require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Initialize Prisma
const prisma = new PrismaClient();

// Import middleware
const { authenticateToken, JWT_SECRET } = require('./middleware/auth.middleware');
const { requireRole } = require('./middleware/role.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const resourcesRoutes = require('./routes/resources.routes');
const sessionsRoutes = require('./routes/sessions.routes');
const mentorshipRoutes = require('./routes/mentorship.routes');
const forumRoutes = require('./routes/forum.routes');
const adminRoutes = require('./routes/admin.routes');
const chatRoutes = require('./routes/chat.routes');

const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

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
            let user = await prisma.user.findUnique({
                where: { email: profile.emails[0].value }
            });

            if (user) {
                return done(null, user);
            }

            user = await prisma.user.create({
                data: {
                    email: profile.emails[0].value,
                    name: profile.displayName,
                    password: await bcrypt.hash(Math.random().toString(36), 10),
                    role: 'STUDENT',
                    avatar: profile.photos[0].value,
                    profileCompleted: false
                }
            });
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    }
));

// ============ ROUTES ============

// Mount route modules
app.use('/api/auth', authRoutes(prisma, JWT_SECRET));
app.use('/api/users', usersRoutes(prisma, authenticateToken));
app.use('/api/resources', resourcesRoutes(prisma, authenticateToken, requireRole));
app.use('/api/sessions', sessionsRoutes(prisma, authenticateToken));
app.use('/api/mentorship', mentorshipRoutes(prisma, authenticateToken));
app.use('/api/forum', forumRoutes(prisma, authenticateToken));
app.use('/api/admin', adminRoutes(prisma, authenticateToken, requireRole));
app.use('/api/chat', chatRoutes(prisma, authenticateToken, requireRole, io));

// ============ NOTIFICATIONS ============

app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

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

// ============ ANNOUNCEMENTS ============

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

// ============ SEED YOUTUBE COURSES ============

app.post('/api/seed-youtube-courses', async (req, res) => {
    try {
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
                description: 'Complete Python programming tutorial for beginners.',
                category: 'TECHNICAL_SKILLS',
                videoUrl: 'PLsyeobzWxl7oa1WO9n4cP3OY9nOtUcZIg',
                duration: 600,
                thumbnailUrl: 'https://i.ytimg.com/vi/QXeEoD0pB3E/maxresdefault.jpg',
                lessonsCount: playlistData['Python']?.length || 30,
                lessons: playlistData['Python'] || []
            },
            {
                title: 'Java Programming Course',
                description: 'Master Java programming from basics to advanced.',
                category: 'TECHNICAL_SKILLS',
                videoUrl: 'PLsyeobzWxl7qbKoSgR5ub6jolI8-ocxCF',
                duration: 480,
                thumbnailUrl: 'https://i.ytimg.com/vi/eIrMbAQSU34/maxresdefault.jpg',
                lessonsCount: playlistData['Java']?.length || 25,
                lessons: playlistData['Java'] || []
            },
            {
                title: 'Web Development Bootcamp',
                description: 'Full web development course covering HTML, CSS, JavaScript.',
                category: 'TECHNICAL_SKILLS',
                videoUrl: 'PLsyeobzWxl7r566kReuTnjnINHqaRuRFn',
                duration: 720,
                thumbnailUrl: 'https://i.ytimg.com/vi/PlxWf493en4/maxresdefault.jpg',
                lessonsCount: playlistData['WebDev']?.length || 40,
                lessons: playlistData['WebDev'] || []
            },
            {
                title: 'Data Structures & Algorithms',
                description: 'Master DSA concepts with practical implementation.',
                category: 'TECHNICAL_SKILLS',
                videoUrl: 'PLfqMhTWNBTe3LtFWcvwpqTkUSlB32kJop',
                duration: 900,
                thumbnailUrl: 'https://i.ytimg.com/vi/8hly31xKli0/maxresdefault.jpg',
                lessonsCount: playlistData['DSA']?.length || 50,
                lessons: playlistData['DSA'] || []
            },
            {
                title: 'Soft Skills Mastery',
                description: 'Develop essential soft skills for career success.',
                category: 'SOFT_SKILLS',
                videoUrl: 'PL6ZdH9C1KeueFazoYwshjYuao2pL9ihqY',
                duration: 300,
                thumbnailUrl: 'https://i.ytimg.com/vi/0FFLFcB9xfQ/maxresdefault.jpg',
                lessonsCount: playlistData['SoftSkills']?.length || 20,
                lessons: playlistData['SoftSkills'] || []
            },
            {
                title: 'Career Guidance & Interview Prep',
                description: 'Complete career guidance with interview preparation.',
                category: 'CAREER_GUIDANCE',
                videoUrl: 'PLOaeOd121eBEEWP14TYgSnFsvaTIjPD22',
                duration: 360,
                thumbnailUrl: 'https://i.ytimg.com/vi/WfdtKbAJOmE/maxresdefault.jpg',
                lessonsCount: playlistData['Career']?.length || 15,
                lessons: playlistData['Career'] || []
            }
        ];

        await prisma.sessionTracking.deleteMany({});
        await prisma.learningResource.deleteMany({});

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

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Khushboo Pathshala API is running!' });
});

// ============ SOCKET.IO EVENTS ============

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_user', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined personal room`);
    });

    socket.on('join_group', (groupId) => {
        socket.join(`group_${groupId}`);
        console.log(`Socket joined group ${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
        socket.leave(`group_${groupId}`);
    });

    socket.on('typing', ({ groupId, userName }) => {
        socket.to(`group_${groupId}`).emit('user_typing', { userName });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// ============ START SERVER ============

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Khushboo Scholar Learning & Engagement Dashboard API`);
    console.log(`💬 Real-time chat enabled with Socket.IO`);
    console.log(`📁 Using modular route structure`);
});
