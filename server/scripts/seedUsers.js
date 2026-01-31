require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 10);

    const users = [
        {
            email: 'student@demo.com',
            name: 'Demo Student',
            role: 'STUDENT',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student'
        },
        {
            email: 'mentor@demo.com',
            name: 'Demo Mentor',
            role: 'MENTOR',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mentor'
        },
        {
            email: 'admin@demo.com',
            name: 'Demo Admin',
            role: 'ADMIN',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        }
    ];

    console.log('🌱 Seeding users...');

    for (const user of users) {
        const upsertUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {
                password: password, // Reset password to known value
                role: user.role,
                name: user.name
            },
            create: {
                email: user.email,
                name: user.name,
                password: password,
                role: user.role,
                avatar: user.avatar,
                profileCompleted: true
            },
        });
        console.log(`Created/Updated user: ${user.email} (${user.role})`);
    }

    console.log('✅ Seeding complete');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
