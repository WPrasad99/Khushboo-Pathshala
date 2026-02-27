const { z } = require('zod');

const scheduleMeetingSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(100),
        date: z.string().datetime({ message: 'Invalid datetime format' }),
        duration: z.number().int().positive().max(480).default(60),
        mode: z.string().optional(),
        link: z.string().url().optional().or(z.literal('')),
        description: z.string().optional(),
        batchId: z.string().uuid('Invalid batch ID'),
        discussionSummary: z.string().optional(),
        remarks: z.string().optional(),
    }),
});

const getMeetingsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
        filter: z.enum(['all', 'upcoming', 'past']).optional().default('all'),
    }),
});

const getStudentsSchema = z.object({
    query: z.object({
        batchId: z.string().uuid().optional(),
        search: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    }),
});

module.exports = {
    scheduleMeetingSchema,
    getMeetingsSchema,
    getStudentsSchema,
};
