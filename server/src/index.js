require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

// Centralized singletons
const config = require('./config');
const prisma = require('./config/prisma');
const { authenticateToken, requireRole } = require('./middlewares/auth.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: config.clientUrl,
        methods: ['GET', 'POST']
    }
});

// Make io accessible to controllers via req.app.get('io')
app.set('io', io);

// ── Security Middlewares ──────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(xss());
app.use(rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } }
}));

app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: config.upload.jsonLimit }));

// ── Static Files & Uploads ─────────────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ── Session & Passport ─────────────────────────────────
app.use(session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// ISSUE #1 & #2 FIX: Google OAuth — no longer uses non-existent googleId field,
// and provides a dummy password placeholder for schema compliance.
if (config.google.clientID && config.google.clientSecret) {
    passport.use(new GoogleStrategy({
        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL,
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('No email provided by Google'), null);

            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                // Create user with a non-loginable password (Google-only accounts)
                user = await prisma.user.create({
                    data: {
                        email,
                        name: profile.displayName || email.split('@')[0],
                        password: `GOOGLE_OAUTH_${Date.now()}`,   // non-empty, non-loginable
                        role: 'STUDENT',
                        avatar: profile.photos?.[0]?.value || null,
                    }
                });
            }
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    }));
}

// ── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() }));

// ── Modular Routes ─────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', authenticateToken, require('./routes/user.routes'));
app.use('/api/student', authenticateToken, require('./routes/student.routes'));
app.use('/api/mentorship', authenticateToken, require('./routes/mentorship.routes'));
app.use('/api/admin', authenticateToken, requireRole('ADMIN'), require('./routes/admin.routes'));
app.use('/api/mentor', authenticateToken, requireRole('MENTOR', 'ADMIN'), require('./routes/mentor.routes'));
app.use('/api/resources', authenticateToken, require('./routes/resource.routes'));
app.use('/api/announcements', authenticateToken, require('./routes/announcement.routes'));
app.use('/api/forum', authenticateToken, require('./routes/forum.routes'));
app.use('/api/quizzes', authenticateToken, require('./routes/quiz.routes'));
app.use('/api/chat', authenticateToken, require('./routes/chat.routes'));
app.use('/api/assignments', authenticateToken, require('./routes/assignment.routes'));
app.use('/api/chatbot', authenticateToken, require('./routes/chatbot.routes'));
app.use('/api/notifications', authenticateToken, require('./routes/notification.routes'));
app.use('/api/sessions', authenticateToken, require('./routes/session.routes'));

// ── Socket.IO Events ──────────────────────────────────
io.on('connection', (socket) => {
    socket.on('join_user', (userId) => socket.join(`user_${userId}`));
    socket.on('join_group', (groupId) => socket.join(`group_${groupId}`));
    socket.on('leave_group', (groupId) => socket.leave(`group_${groupId}`));
    socket.on('typing', ({ groupId, userName }) => {
        socket.to(`group_${groupId}`).emit('user_typing', { userName });
    });
});

// ── Error Handling ────────────────────────────────────
app.use(errorMiddleware);

// ── Graceful Startup & Shutdown ───────────────────────
server.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
});

const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        await prisma.$disconnect();
        console.log('Database disconnected. Goodbye.');
        process.exit(0);
    });
    setTimeout(() => { console.error('Forced shutdown.'); process.exit(1); }, 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
