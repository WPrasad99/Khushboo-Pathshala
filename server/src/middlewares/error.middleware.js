/**
 * Centralized error handler.
 * Maps Prisma/Express errors to safe, consistent API responses.
 * Never leaks stack traces or internal error codes to clients.
 */
const errorMiddleware = (err, req, res, next) => {
    // Structured logging
    console.error('API Error:', {
        message: err.message,
        code: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        userId: req.user?.id || 'anonymous',
    });

    // Prisma unique constraint violation
    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            error: { code: 'CONFLICT', message: 'A record with this data already exists.' }
        });
    }

    // Prisma record not found
    if (err.code === 'P2025') {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'The requested record was not found.' }
        });
    }

    // Malformed JSON body
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_JSON', message: 'Malformed JSON in request body.' }
        });
    }

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            error: { code: 'FILE_TOO_LARGE', message: 'File exceeds maximum allowed size.' }
        });
    }

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            data: null,
            error: { code: err.code, message: err.message }
        });
    }

    // Default: mask internal errors in production
    const statusCode = err.statusCode || err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred.'
        : err.message || 'An unexpected error occurred.';

    res.status(statusCode).json({
        success: false,
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message }
    });
};

module.exports = errorMiddleware;
