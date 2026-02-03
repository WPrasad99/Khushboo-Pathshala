const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const router = express.Router();

module.exports = (prisma, JWT_SECRET) => {
    // Register
    router.post('/register', async (req, res) => {
        try {
            const { email, password, name, role } = req.body;

            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Email, password, and name are required' });
            }

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
    router.get('/google',
        passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
    );

    router.get('/google/callback',
        passport.authenticate('google', { failureRedirect: '/login' }),
        (req, res) => {
            const token = jwt.sign(
                { id: req.user.id, email: req.user.email, role: req.user.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?token=${token}`);
        }
    );

    // Login
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    batch: {
                        select: { id: true, name: true, isActive: true }
                    }
                }
            });
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // BATCH CHECK: Students must belong to an active batch
            if (user.role === 'STUDENT') {
                if (!user.batchId) {
                    return res.status(403).json({
                        error: 'Access denied. You are not assigned to any batch. Please contact your administrator.',
                        code: 'NO_BATCH_ASSIGNED'
                    });
                }
                if (!user.batch.isActive) {
                    return res.status(403).json({
                        error: 'Access denied. Your batch is currently inactive. Please contact your administrator.',
                        code: 'BATCH_INACTIVE'
                    });
                }
            }

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

            // Record login for heatmap
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
                    profileCompleted: user.profileCompleted,
                    batch: user.batch // Include batch info in response
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Failed to login' });
        }
    });

    return router;
};
