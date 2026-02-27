const { z } = require('zod');

const scheduleMeetingSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(100),
        date: z.string().datetime({ message: 'Invalid datetime format' }),
        duration: z.coerce.number().int().positive().max(480).default(60),
        link: z.string().url('Invalid URL format').optional().or(z.literal('')),
        description: z.string().max(500).optional(),
        batchId: z.string().uuid('Invalid batch ID format'),
        discussionSummary: z.string().max(1000).optional(),
        remarks: z.string().max(500).optional(),
    }),
});

const getMeetingsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        filter: z.enum(['all', 'upcoming', 'past']).optional().default('all'),
    }),
});

const getStudentsSchema = z.object({
    query: z.object({
        batchId: z.string().uuid('Invalid batch ID format').optional().or(z.literal('')),
        search: z.string().max(100).optional().or(z.literal('')),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    }),
});

const uploadResourceSchema = z.object({
    body: z.object({
        title: z.string().min(3, 'Title requires at least 3 characters').max(150),
        description: z.string().max(1000).optional(),
        batchId: z.string().uuid('Invalid batch ID format'),
        category: z.string().max(50).optional().default('GENERAL'),
        type: z.enum(['SESSION', 'RESOURCE']).optional().default('RESOURCE'),
        videoUrl: z.string().url('Invalid video URL').optional().or(z.literal(''))
    })
});

const markAttendanceSchema = z.object({
    body: z.object({
        batchId: z.string().uuid('Invalid batch ID format'),
        date: z.string().datetime({ message: 'Invalid datetime format' }).optional(),
        records: z.array(z.object({
            email: z.string().email('Invalid email address'),
            status: z.enum(['Present', 'Absent', 'Late'])
        })).min(1, 'At least one attendance record is required')
    })
});

module.exports = {
    scheduleMeetingSchema,
    getMeetingsSchema,
    getStudentsSchema,
    uploadResourceSchema,
    markAttendanceSchema,
};
