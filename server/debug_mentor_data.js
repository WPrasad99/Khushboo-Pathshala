const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mentors = await prisma.user.findMany({
        where: { role: 'MENTOR' },
        include: {
            batchesAsMentor: {
                include: { batch: true }
            },
            mentorships: {
                include: { mentee: true }
            },
            createdAssignments: true,
            createdQuizzes: true
        }
    });
    const batches = await prisma.batch.findMany({
        include: {
            mentors: { include: { mentor: { select: { id: true, name: true, email: true } } } },
            students: { include: { student: { select: { id: true, name: true, email: true } } } }
        }
    });
    const students = await prisma.user.findMany({ where: { role: 'STUDENT' } });

    console.log('Mentors:', JSON.stringify(mentors.map(m => ({ id: m.id, name: m.name, email: m.email })), null, 2));
    console.log('Batches:', JSON.stringify(batches, null, 2));
    console.log('Total Students:', students.length);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
