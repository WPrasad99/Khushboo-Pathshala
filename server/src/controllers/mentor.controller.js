const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getBatches = async (req, res, next) => {
    try {
        const mentorId = req.user.id;
        const batches = await prisma.batchMentor.findMany({
            where: { mentorId },
            include: {
                batch: {
                    include: {
                        _count: {
                            select: { students: true, resources: true, assignments: true }
                        }
                    }
                }
            }
        });

        const formattedBatches = batches.map(b => ({
            id: b.batch.id,
            name: b.batch.name,
            description: b.batch.description,
            status: b.batch.status,
            assignedAt: b.assignedAt,
            studentsCount: b.batch._count.students,
            resourcesCount: b.batch._count.resources,
            assignmentsCount: b.batch._count.assignments
        }));

        res.json({
            success: true,
            data: formattedBatches,
            message: 'Batches fetched successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.getStudents = async (req, res, next) => {
    try {
        const mentorId = req.user.id;
        const { batchId, search, status } = req.query;

        // Fetch students part of mentors batches
        const whereClause = {
            batch: {
                mentors: { some: { mentorId } }
            }
        };

        if (batchId) {
            whereClause.batchId = batchId;
        }

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
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        phone: true,
                        educationLevel: true,
                        loginLogs: {
                            orderBy: { loginDate: 'desc' },
                            take: 1
                        },
                        sessionTrackings: {
                            select: { completionPercentage: true }
                        }
                    }
                }
            }
        });

        const uniqueStudentsMap = new Map();
        batchStudents.forEach(item => {
            const student = item.student;
            if (!uniqueStudentsMap.has(student.id)) {
                // Calculate average completion
                const tracks = student.sessionTrackings || [];
                const avgCompletion = tracks.length > 0
                    ? tracks.reduce((acc, curr) => acc + curr.completionPercentage, 0) / tracks.length
                    : 0;

                const lastActive = student.loginLogs?.length > 0 ? student.loginLogs[0].loginDate : null;

                uniqueStudentsMap.set(student.id, {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    avatar: student.avatar,
                    phone: student.phone,
                    educationLevel: student.educationLevel,
                    attendanceAvg: Math.round(avgCompletion),
                    lastActive
                });
            }
        });

        res.json({
            success: true,
            data: Array.from(uniqueStudentsMap.values()),
            message: 'Students fetched successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.getMeetings = async (req, res, next) => {
    try {
        const mentorId = req.user.id;
        let { page, limit, filter } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 20;
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
                include: {
                    mentorship: {
                        include: { mentee: { select: { id: true, name: true, avatar: true } } }
                    }
                },
                orderBy: { meetingDate: filter === 'upcoming' ? 'asc' : 'desc' },
                skip,
                take: limit
            }),
            prisma.meeting.count({ where: whereClause })
        ]);

        const formatted = meetings.map(m => ({
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

        res.json({
            success: true,
            data: {
                items: formatted,
                page,
                limit,
                total,
                hasMore: (page * limit) < total
            },
            message: 'Meetings fetched successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.scheduleMeeting = async (req, res, next) => {
    try {
        const mentorId = req.user.id;
        const { title, date, duration, link, batchId, discussionSummary, remarks } = req.body;

        const batchStudents = await prisma.batchStudent.findMany({
            where: {
                batchId,
                batch: {
                    mentors: { some: { mentorId } }
                }
            },
            select: { studentId: true }
        });

        if (batchStudents.length === 0) {
            return res.status(400).json({ success: false, message: 'No students found in this batch' });
        }

        const meetingDate = new Date(date);
        const meetingDuration = parseInt(duration, 10);
        const summary = discussionSummary || title;
        const meetingRemarks = remarks || link || '';

        const createdMeetings = [];
        const studentNotifications = [];

        // Transaction for strong consistency
        await prisma.$transaction(async (tx) => {
            for (const bs of batchStudents) {
                let mentorship = await tx.mentorship.findFirst({
                    where: { mentorId, menteeId: bs.studentId }
                });

                if (!mentorship) {
                    mentorship = await tx.mentorship.create({
                        data: { mentorId, menteeId: bs.studentId, status: 'ACTIVE' }
                    });
                }

                const meeting = await tx.meeting.create({
                    data: {
                        mentorshipId: mentorship.id,
                        meetingDate,
                        duration: meetingDuration,
                        discussionSummary: summary,
                        remarks: meetingRemarks,
                        status: 'SCHEDULED'
                    }
                });

                createdMeetings.push(meeting);

                const formattedDate = meetingDate.toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                studentNotifications.push({
                    userId: bs.studentId,
                    title: `📅 New Meeting: ${title}`,
                    message: `Meeting scheduled for ${formattedDate}. Duration: ${duration} mins.${link ? ' Link: ' + link : ''}`,
                    type: 'info'
                });
            }

            // Bulk create notifications within transaction
            if (studentNotifications.length > 0) {
                await tx.notification.createMany({ data: studentNotifications });
            }
        });

        res.status(201).json({
            success: true,
            data: createdMeetings,
            message: `Meeting scheduled for ${createdMeetings.length} students`
        });
    } catch (error) {
        next(error);
    }
};
