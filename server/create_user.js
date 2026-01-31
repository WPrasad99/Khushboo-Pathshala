const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'prasadwadkar18@gmail.com';
    const name = 'Prasad Wadkar';

    // Check if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log(`User ${email} already exists.`);
        return;
    }

    // Create
    const password = await bcrypt.hash('password123', 10);
    await prisma.user.create({
        data: {
            email,
            name,
            password,
            role: 'STUDENT',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`,
            profileCompleted: true
        }
    });
    console.log(`User ${email} created successfully.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
