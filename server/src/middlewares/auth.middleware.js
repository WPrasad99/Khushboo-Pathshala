const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Verifies JWT token from Authorization header.
 * Attaches decoded payload { id, email, role } to req.user.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            data: null,
            error: { code: 'NO_TOKEN', message: 'Access denied. No token provided.' }
        });
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
        next();
    } catch (error) {
        const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        return res.status(401).json({
            success: false,
            data: null,
            error: { code, message: 'Invalid or expired token.' }
        });
    }
};

/**
 * Role-based access control middleware.
 * Must be used AFTER authenticateToken.
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                data: null,
                error: { code: 'FORBIDDEN', message: 'Access denied. Insufficient permissions.' }
            });
        }
        next();
    };
};

module.exports = { authenticateToken, requireRole };
