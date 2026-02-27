const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

class MentorService {
    /**
     * Helper to verify mentor ownership safely.
     * Prevents Privilege Escalation.
     */
    async verifyBatchOwnership(mentorId, batchId, userRole) {
        if (userRole === 'ADMIN') return true;
        const exists = await prisma.batchMentor.findUnique({
            where: { batchId_mentorId: { batchId, mentorId } }
        });
        if (!exists) {
            throw new AppError('You are not authorized to manage this batch.', 403, 'FORBIDDEN');
        }
        return true;
    }

    /**
     * Get batches assigned to a mentor
     */
    async getBatches(mentorId) {
        const batches = await prisma.batchMentor.findMany({
            where: { mentorId },
            include: {
                batch: {
                    include: {
                        _count: { select: { students: true, resources: true, assignments: true } }
                    }
                }
            }
        });

        return batches.map(b => ({
            id: b.batch.id,
            name: b.batch.name,
            description: b.batch.description,
            status: b.batch.status,
            assignedAt: b.assignedAt,
            studentsCount: b.batch._count.students,
            resourcesCount: b.batch._count.resources,
            assignmentsCount: b.batch._count.assignments
        }));
    }

    /**
     * Get unique assigned students
     * Optimized: Aggregated map directly instead of joined arrays.
     */
    async getStudents(mentorId, { batchId, search }) {
        let batchIdList = [];

        // Verify bounds
        if (batchId) {
            await this.verifyBatchOwnership(mentorId, batchId, 'MENTOR');
            batchIdList = [batchId];
        } else {
            const assignedBatches = await prisma.batchMentor.findMany({
                where: { mentorId },
                select: { batchId: true }
            });
            batchIdList = assignedBatches.map(b => b.batchId);
            if (batchIdList.length === 0) return []; // No students if no batches
        }

        const whereClause = { batchId: { in: batchIdList } };

        if (search) {
            whereClause.student = {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } }
                ]
            };
        }

        const batchStudents = await prisma.batchStudent.findMany({
            where: whereClause,
            select: {
                student: {
                    select: {
                        id: true, name: true, email: true, avatar: true,
                        phone: true, educationLevel: true,
                        loginLogs: { orderBy: { loginDate: 'desc' }, take: 1 },
                        sessionTrackings: { select: { completionPercentage: true } }
                    }
                }
            }
        });

        // Deduplicate cross-batch students safely.
        const uniqueStudentsMap = new Map();
        batchStudents.forEach(item => {
            const student = item.student;
            if (!uniqueStudentsMap.has(student.id)) {
                const tracks = student.sessionTrackings || [];
                const avgCompletion = tracks.length > 0
                    ? tracks.reduce((acc, curr) => acc + curr.completionPercentage, 0) / tracks.length
                    : 0;

                uniqueStudentsMap.set(student.id, {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    avatar: student.avatar,
                    phone: student.phone,
                    educationLevel: student.educationLevel,
                    attendanceAvg: Math.round(avgCompletion),
                    lastActive: student.loginLogs?.[0]?.loginDate || null
                });
            }
        });

        return Array.from(uniqueStudentsMap.values());
    }

    /**
     * Get mentor scheduled meetings efficiently.
     */
    async getMeetings(mentorId, { page, limit, filter }) {
        const skip = (page - 1) * limit;

        const whereClause = {
            mentorship: { mentorId },
            deletedAt: null
        };

        if (filter === 'upcoming') {
            whereClause.meetingDate = { gte: new Date() };
        } else if (filter === 'past') {
            whereClause.meetingDate = { lt: new Date() };
        }

        const [meetings, total] = await Promise.all([
            prisma.meeting.findMany({
                where: whereClause,
                select: { // Projections
                    id: true, meetingDate: true, duration: true,
                    discussionSummary: true, remarks: true, status: true, createdAt: true,
                    mentorship: { select: { mentee: { select: { id: true, name: true, avatar: true } } } }
                },
                orderBy: { meetingDate: filter === 'upcoming' ? 'asc' : 'desc' },
                skip,
                take: limit
            }),
            prisma.meeting.count({ where: whereClause })
        ]);

        const items = meetings.map(m => ({
            id: m.id,
            title: m.discussionSummary?.split('\n')[0] || 'Mentorship Meeting',
            meetingDate: m.meetingDate,
            duration: m.duration,
            discussionSummary: m.discussionSummary,
            remarks: m.remarks,
            status: m.status,
            mentee: m.mentorship.mentee,
            createdAt: m.createdAt
        }));

        return { items, page, limit, total, hasMore: (skip + meetings.length) < total };
    }

    /**
     * Optimized batch meeting scheduling safely mapping relationships globally
     */
    async scheduleMeeting(mentorId, data) {
        const { title, date, duration, link, batchId, discussionSummary, remarks } = data;

        await this.verifyBatchOwnership(mentorId, batchId, 'MENTOR');

        const batchStudents = await prisma.batchStudent.findMany({
            where: { batchId },
            select: { studentId: true, student: { select: { email: true } } }
        });

        if (batchStudents.length === 0) {
            throw new AppError('No students found in this batch.', 400, 'BAD_REQUEST');
        }

        const meetingDate = new Date(date);
        const meetingDuration = duration;
        const summary = discussionSummary || title || 'Mentorship Meeting';
        const meetingRemarks = remarks || link || '';

        const createdMeetings = [];
        const studentIds = batchStudents.map(bs => bs.studentId);

        // Fetch existing mentorship links for these students to prevent N+1 duplicate inserts.
        const existingMentorships = await prisma.mentorship.findMany({
            where: { mentorId, menteeId: { in: studentIds } },
            select: { id: true, menteeId: true }
        });

        let existingMap = new Map(existingMentorships.map(m => [m.menteeId, m.id]));

        // Transaction for atomic insertions
        await prisma.$transaction(async (tx) => {
            // Find mentees missing mentorship links. Insert them.
            const missingMentorshipLinks = studentIds.filter(id => !existingMap.has(id));
            if (missingMentorshipLinks.length > 0) {
                // Must do sequential upsert mapped since SQLite doesn't return `createManyAndReturn`.
                for (const mId of missingMentorshipLinks) {
                    const created = await tx.mentorship.create({
                        data: { mentorId, menteeId: mId, status: 'ACTIVE' }
                    });
                    existingMap.set(mId, created.id);
                }
            }

            // Create meetings bulk.
            const meetingsToCreate = studentIds.map(stId => ({
                mentorshipId: existingMap.get(stId),
                meetingDate,
                duration: meetingDuration,
                discussionSummary: summary,
                remarks: meetingRemarks,
                status: 'SCHEDULED'
            }));

            // SQlite supports createMany natively without returning models, but we don't strictly require returning models besides count.
            await tx.meeting.createMany({ data: meetingsToCreate });

            // Create notifications.
            const notifications = studentIds.map(stId => ({
                userId: stId,
                title: `📅 New Meeting: ${title || 'Mentorship Meeting'}`,
                message: `Meeting scheduled for ${meetingDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. Duration: ${meetingDuration} mins.${link ? ' Link: ' + link : ''}`,
                type: 'info'
            }));
            await tx.notification.createMany({ data: notifications });
        });

        return { scheduledFor: studentIds.length, date: meetingDate };
    }

    /**
     * RBAC bound attendance logging.
     * Prevents modifying activities of unauthorised users.
     */
    async getAttendance(userRole, mentorId, batchId) {
        await this.verifyBatchOwnership(mentorId, batchId, userRole);

        return await prisma.activity.findMany({
            where: {
                type: { in: ['ATTENDANCE_PRESENT', 'ATTENDANCE_ABSENT'] },
                user: { batchesAsStudent: { some: { batchId } } }
            },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200 // Prevent boundless query payload crash
        });
    }

    /**
     * Optimal bulk insert logic mapping user emails directly 
     * without N+1 loops, ensuring relationships safely.
     */
    async markAttendance(mentorId, userRole, batchId, date, records) {
        await this.verifyBatchOwnership(mentorId, batchId, userRole);

        const activityDate = date ? new Date(date) : new Date();

        // 1. Fetch exactly the students that belong to the batch to verify records.
        const validStudents = await prisma.batchStudent.findMany({
            where: { batchId },
            select: { student: { select: { id: true, email: true } } }
        });
        const validEmailsMap = new Map();
        validStudents.forEach(bs => validEmailsMap.set(bs.student.email, bs.student.id));

        const activitiesToInsert = [];
        let successCount = 0;
        let failedCount = 0;

        for (const record of records) {
            const studentId = validEmailsMap.get(record.email);
            if (studentId && record.status) {
                activitiesToInsert.push({
                    userId: studentId,
                    type: record.status === 'Present' ? 'ATTENDANCE_PRESENT' : 'ATTENDANCE_ABSENT',
                    title: `Attendance: ${activityDate.toLocaleDateString()}`,
                    description: `Marked as ${record.status} by Mentor`,
                    createdAt: activityDate
                });
                successCount++;
            } else {
                failedCount++;
            }
        }

        if (activitiesToInsert.length > 0) {
            await prisma.activity.createMany({ data: activitiesToInsert });
        }

        return { success: successCount, failed: failedCount, total: records.length };
    }

    /**
     * Validate upload bounds carefully.
     */
    async uploadResource(mentorId, userRole, data, file) {
        const { title, description, batchId, category, type, videoUrl } = data;
        await this.verifyBatchOwnership(mentorId, batchId, userRole);

        const resourceUrl = file ? `/uploads/${file.filename}` : videoUrl;

        const resource = await prisma.learningResource.create({
            data: {
                title: title.trim(),
                description: description || '',
                videoUrl: resourceUrl || '',
                duration: 0, // Ensure schema compliance
                type: type || 'RESOURCE',
                batchId,
                category: category || 'GENERAL',
                uploadedById: mentorId
            }
        });

        return resource;
    }

    /**
     * Get soft-paginated uploads assigned strictly.
     */
    async getUploads(mentorId, typeFilter, page = 1) {
        const limit = 20;
        const skip = (page - 1) * limit;

        const whereClause = { uploadedById: mentorId, deletedAt: null };
        if (typeFilter) whereClause.type = typeFilter;

        return await prisma.learningResource.findMany({
            where: whereClause,
            include: { batch: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip
        });
    }

    /**
     * Hardens delete constraints to purely soft-delete pattern to avoid orphan triggers completely.
     */
    async deleteUpload(mentorId, userRole, uploadId) {
        const resource = await prisma.learningResource.findUnique({
            where: { id: uploadId },
            select: { uploadedById: true }
        });

        if (!resource) {
            throw new AppError('Resource not found.', 404, 'NOT_FOUND');
        }

        if (resource.uploadedById !== mentorId && userRole !== 'ADMIN') {
            throw new AppError('You are only authorized to delete your own records.', 403, 'FORBIDDEN');
        }

        await prisma.learningResource.update({
            where: { id: uploadId },
            data: { deletedAt: new Date() }
        });

        return { id: uploadId, deleted: true };
    }
}

module.exports = new MentorService();
