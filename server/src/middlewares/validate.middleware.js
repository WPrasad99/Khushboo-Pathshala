const { ZodError } = require('zod');

const validate = (schema) => async (req, res, next) => {
    try {
        const validatedData = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        // Optionally overwrite req variables with coerced generic zod data (e.g. string to number)
        if (validatedData.body) req.body = validatedData.body;
        if (validatedData.query) req.query = validatedData.query;
        if (validatedData.params) req.params = validatedData.params;

        return next();
    } catch (error) {
        if (error instanceof ZodError) {
            // Pick out the very first human-readable validation error string
            const firstError = error.errors[0];
            const field = firstError.path.join('.');
            const msg = firstError.message;
            return res.status(400).json({
                success: false,
                data: null,
                error: {
                    code: 'VALIDATION_FAILED',
                    message: `${field ? field + ': ' : ''}${msg}`
                }
            });
        }
        next(error);
    }
};

module.exports = validate;
