const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userCount = await prisma.user.count();
    const resourceCount = await prisma.learningResource.count();
    const sessionCount = await prisma.session.count();
    const activityCount = await prisma.activity.count();
    const trackingCount = await prisma.sessionTracking.count();

    console.log(`Users: ${userCount}`);
    console.log(`Resources: ${resourceCount}`);
    console.log(`Sessions: ${sessionCount}`);
    console.log(`Activities: ${activityCount}`);
    console.log(`Trackings: ${trackingCount}`);

    if (userCount > 0) {
        const users = await prisma.user.findMany({ select: { email: true } });
        console.log('Existing users:', users.map(u => u.email));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
