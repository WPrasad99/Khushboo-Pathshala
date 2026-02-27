/**
 * Standardized error response format for all API responses.
 * Never leak stack traces in production.
 */
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Send standardized error response
 * @param {Object} res - Express response
 * @param {number} status - HTTP status code
 * @param {string} code - Machine-readable error code
 * @param {string} message - Human-readable message
 * @param {Object} [details] - Optional extra details (never sensitive in prod)
 */
function sendError(res, status = 500, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred', details = {}) {
    const payload = {
        success: false,
        error: {
            code,
            message,
            ...(Object.keys(details).length ? { details } : {})
        }
    };
    if (isDev && details.stack) {
        payload.error.details = { ...payload.error.details, stack: details.stack };
    }
    return res.status(status).json(payload);
}

/**
 * Extract user-friendly message from error
 */
function getErrorMessage(err) {
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    return 'An unexpected error occurred';
}

module.exports = { sendError, getErrorMessage, isDev };
