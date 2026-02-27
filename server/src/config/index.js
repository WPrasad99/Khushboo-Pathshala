/**
 * Centralized configuration.
 * All environment-dependent values MUST be read from here.
 * No hardcoded secrets or magic numbers anywhere else.
 */
const config = {
    port: parseInt(process.env.PORT, 10) || 5001,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
    },

    session: {
        secret: process.env.SESSION_SECRET,
    },

    google: {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
    },

    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
    },

    bcrypt: {
        saltRounds: 12,
    },

    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 2000,
    },

    upload: {
        maxFileSize: 10 * 1024 * 1024,   // 10MB
        jsonLimit: '5mb',
        allowedTypes: /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/,
    },
};

// Validate critical env vars at startup
const required = ['JWT_SECRET', 'SESSION_SECRET'];
for (const key of required) {
    if (!process.env[key]) {
        console.error(`❌ FATAL: Missing required environment variable: ${key}`);
        process.exit(1);
    }
}

module.exports = config;
