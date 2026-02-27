const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const passport = require('passport');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    authController.googleCallback
);

module.exports = router;
