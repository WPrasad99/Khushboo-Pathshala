const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
    console.log('--- Resetting Passwords ---');
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Reset for all main test accounts
    const emails = ['admin@cybage.com', 'prasad@example.com', 'prasadwadkar18@gmail.com'];

    for (const email of emails) {
        try {
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
            console.log(`✅ Password for ${email} reset to: ${password}`);
        } catch (e) {
            console.log(`⚠️ User ${email} not found or error: ${e.message}`);
        }
    }
}

resetPassword()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
