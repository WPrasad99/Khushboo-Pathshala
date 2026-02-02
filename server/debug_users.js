const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- User Roles Debug ---');
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true }
    });
    console.table(users);
    console.log('------------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
