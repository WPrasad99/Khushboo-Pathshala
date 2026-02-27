// Centralized Error Middleware
const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.name}: ${err.message}`);

    // Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            error: err.errors
        });
    }

    // Prisma generic errors
    if (err.code && err.code.startsWith('P')) {
        return res.status(400).json({
            success: false,
            message: 'Database operation failed',
            error: process.env.NODE_ENV === 'development' ? (err.meta || err.message) : undefined
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
