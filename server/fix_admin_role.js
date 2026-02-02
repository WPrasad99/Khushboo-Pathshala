const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Updating User Roles ---');

    // Update Prasad's accounts to ADMIN to solve 403 error for logged in user
    const emailsToPromote = ['prasadwadkar18@gmail.com', 'prasad@example.com'];

    for (const email of emailsToPromote) {
        try {
            const user = await prisma.user.update({
                where: { email },
                data: { role: 'ADMIN' }
            });
            console.log(`✅ Promoted ${email} to ADMIN`);
        } catch (error) {
            console.log(`⚠️ Could not update ${email} (might not exist): ${error.message.split('\n')[0]}`);
        }
    }

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true, role: true } });
    console.log('--- Current Admins ---');
    console.table(admins);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
