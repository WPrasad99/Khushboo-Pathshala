const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'prasadwadkar18@gmail.com';
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('User not found, creating user...');
        const bcrypt = require('bcryptjs');
        user = await prisma.user.create({
            data: {
                email,
                name: 'Prasad Wadkar',
                password: await bcrypt.hash('randompass123', 10),
                role: 'STUDENT',
                profileCompleted: true,
                avatar: 'https://lh3.googleusercontent.com/a/ACg8ocL...' // Placeholder
            }
        });
        console.log('✅ User created');
    }

    console.log(`seeding data for ${user.name} (${user.id})...`);

    // 1. Assign Achievements (Badges)
    await prisma.achievement.createMany({
        data: [
            { userId: user.id, type: 'BADGE', title: 'Quick Learner', description: 'Completed 5 courses in one month' },
            { userId: user.id, type: 'BADGE', title: 'Perfect Attendance', description: 'Maintained 100% attendance for a month' },
            { userId: user.id, type: 'BADGE', title: 'Rising Star', description: 'Top performer in technical assessments' }
        ]
    });
    console.log('✅ Achievements added');

    // 2. Track Courses (Enroll & Progress)
    const resources = await prisma.learningResource.findMany({ take: 3 });
    if (resources.length > 0) {
        // Course 1: Completed
        await prisma.sessionTracking.create({
            data: {
                userId: user.id,
                resourceId: resources[0].id,
                watchDuration: resources[0].duration * 60, // full duration
                totalDuration: resources[0].duration * 60,
                dropOffPoint: resources[0].duration * 60,
                completionPercentage: 100,
                attendanceMarked: true
            }
        });

        // Course 2: In Progress
        if (resources.length > 1) {
            await prisma.sessionTracking.create({
                data: {
                    userId: user.id,
                    resourceId: resources[1].id,
                    watchDuration: (resources[1].duration * 60) * 0.5,
                    totalDuration: resources[1].duration * 60,
                    dropOffPoint: (resources[1].duration * 60) * 0.5,
                    completionPercentage: 50,
                    attendanceMarked: false
                }
            });
        }

        // Course 3: Just Started
        if (resources.length > 2) {
            await prisma.sessionTracking.create({
                data: {
                    userId: user.id,
                    resourceId: resources[2].id,
                    watchDuration: 60,
                    totalDuration: resources[2].duration * 60,
                    dropOffPoint: 60,
                    completionPercentage: 5,
                    attendanceMarked: false
                }
            });
        }
    }
    console.log('✅ Course progress added');

    // 3. Create Activities
    await prisma.activity.createMany({
        data: [
            { userId: user.id, type: 'watched', title: 'Watched: ' + resources[0].title, description: 'Completed course' },
            { userId: user.id, type: 'completed', title: 'Completed: Initialization', description: 'Setup profile successfully' }
        ]
    });
    console.log('✅ Activities added');

    // 4. Assign Mentor (Create Mentorship if not exists)
    // Find a mentor
    const mentor = await prisma.user.findFirst({ where: { role: 'MENTOR' } });
    if (mentor) {
        const exists = await prisma.mentorship.findFirst({
            where: { menteeId: user.id }
        });

        if (!exists) {
            await prisma.mentorship.create({
                data: {
                    mentorId: mentor.id,
                    menteeId: user.id
                }
            });
            console.log('✅ Mentor assigned');
        }
    }

    console.log('🎉 Done! User dashboard should now be populated.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
