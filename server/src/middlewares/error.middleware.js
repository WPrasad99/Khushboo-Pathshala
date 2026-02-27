const errorMiddleware = (err, req, res, next) => {
    console.error('API Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    const status = err.status || 500;
    const message = err.message || 'An unexpected error occurred';
    const code = err.code || 'INTERNAL_SERVER_ERROR';

    res.status(status).json({
        success: false,
        data: null,
        error: {
            code,
            message
        }
    });
};

module.exports = errorMiddleware;
