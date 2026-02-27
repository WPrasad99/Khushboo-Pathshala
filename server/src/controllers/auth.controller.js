const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * POST /api/auth/register
 * ISSUE #12 FIX: Added input validation
 * ISSUE #13 FIX: Role is ALWAYS 'STUDENT' on public registration — no escalation
 */
exports.register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        // Input validation
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, error: 'Email, password, and name are required.' });
        }
        if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, error: 'Invalid email format.' });
        }
        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
        }
        if (typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();

        const exists = await prisma.user.findUnique({ where: { email: trimmedEmail } });
        if (exists) {
            return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
        const user = await prisma.user.create({
            data: {
                email: trimmedEmail,
                password: hashedPassword,
                name: trimmedName,
                role: 'STUDENT',   // ALWAYS student on public registration
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedName.replace(/\s/g, '')}`
            }
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // Don't send password hash back to client
        const { password: _, ...safeUser } = user;
        res.status(201).json({ success: true, data: { token, user: safeUser } });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/login
 * ISSUE #12 FIX: Added input validation
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required.' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: trimmedEmail } });

        // Generic message prevents user enumeration
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        // Google-only accounts can't login with password
        if (user.password.startsWith('GOOGLE_OAUTH_')) {
            return res.status(401).json({ success: false, error: 'This account uses Google Sign-In. Please login with Google.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        // Log successful login
        await prisma.loginLog.create({ data: { userId: user.id } });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        const { password: _, ...safeUser } = user;
        res.json({ success: true, data: { token, user: safeUser } });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/google/callback
 */
exports.googleCallback = (req, res) => {
    try {
        const token = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role, name: req.user.name },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );
        res.redirect(`${config.clientUrl}/login?token=${token}`);
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${config.clientUrl}/login?error=auth_failed`);
    }
};
