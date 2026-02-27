const prisma = require('../config/prisma');

class MentorshipService {
    async getMentorship(studentId) {
        const mentorships = await prisma.mentorship.findMany({
            where: { menteeId: studentId },
            include: { mentor: { select: { id: true, name: true, avatar: true, email: true } } }
        });
        return mentorships[0] || null;
    }

    async getMeetings(studentId, filter) {
        const where = {
            mentorship: { menteeId: studentId },
            deletedAt: null
        };
        if (filter === 'upcoming') where.meetingDate = { gte: new Date() };

        return await prisma.meeting.findMany({
            where,
            include: { mentorship: { include: { mentor: { select: { name: true } } } } },
            orderBy: { meetingDate: 'asc' }
        });
    }

    async getBatches(studentId) {
        const batches = await prisma.batchStudent.findMany({
            where: { studentId },
            include: {
                batch: {
                    include: {
                        mentors: { include: { mentor: { select: { name: true, avatar: true } } } },
                        _count: { select: { resources: true, assignments: true } }
                    }
                }
            }
        });
        return batches.map(b => b.batch);
    }
}

module.exports = new MentorshipService();
