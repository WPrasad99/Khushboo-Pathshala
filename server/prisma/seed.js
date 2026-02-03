const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data in proper order (respecting foreign keys)
    await prisma.activity.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.forumAnswer.deleteMany();
    await prisma.forumPost.deleteMany();
    await prisma.meeting.deleteMany();
    await prisma.mentorship.deleteMany();
    await prisma.sessionTracking.deleteMany();
    await prisma.session.deleteMany();
    await prisma.learningResource.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.loginLog.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.chatGroup.deleteMany();
    // Clear students first (they reference batches)
    await prisma.user.updateMany({
        where: { role: 'STUDENT' },
        data: { batchId: null }
    });
    await prisma.batch.deleteMany();
    await prisma.user.deleteMany();

    // Create password hash
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Admin first (needed for batch creation)
    const admin = await prisma.user.create({
        data: {
            email: 'admin@cybage.com',
            password: passwordHash,
            name: 'Admin User',
            role: 'ADMIN',
            phone: '+91 9876543210',
            gender: 'male',
            educationLevel: 'Masters',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        }
    });

    // Create 5 Mentors
    const mentor1 = await prisma.user.create({
        data: {
            email: 'rakesh.sinha@cybage.com',
            password: passwordHash,
            name: 'Rakesh Sinha',
            role: 'MENTOR',
            phone: '+91 9876543211',
            gender: 'male',
            educationLevel: 'Masters',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rakesh'
        }
    });

    const mentor2 = await prisma.user.create({
        data: {
            email: 'priya.sharma@cybage.com',
            password: passwordHash,
            name: 'Priya Sharma',
            role: 'MENTOR',
            phone: '+91 9876543212',
            gender: 'female',
            educationLevel: 'Masters',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya'
        }
    });

    const mentor3 = await prisma.user.create({
        data: {
            email: 'amit.kumar@cybage.com',
            password: passwordHash,
            name: 'Amit Kumar',
            role: 'MENTOR',
            phone: '+91 9876543220',
            gender: 'male',
            educationLevel: 'PhD',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amit'
        }
    });

    const mentor4 = await prisma.user.create({
        data: {
            email: 'sunita.desai@cybage.com',
            password: passwordHash,
            name: 'Sunita Desai',
            role: 'MENTOR',
            phone: '+91 9876543221',
            gender: 'female',
            educationLevel: 'Masters',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunita'
        }
    });

    const mentor5 = await prisma.user.create({
        data: {
            email: 'vikram.joshi@cybage.com',
            password: passwordHash,
            name: 'Vikram Joshi',
            role: 'MENTOR',
            phone: '+91 9876543222',
            gender: 'male',
            educationLevel: 'Masters',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram'
        }
    });

    console.log('✅ Admin and 5 Mentors created');

    // Create Batches (after mentors exist)
    const batch1 = await prisma.batch.create({
        data: {
            name: 'Khushboo Batch 2024 – Phase 1',
            description: 'Engineering students batch for technical skill development - Phase 1',
            mentorId: mentor1.id,
            createdById: admin.id,
            isActive: true
        }
    });

    const batch2 = await prisma.batch.create({
        data: {
            name: 'Khushboo Batch 2024 – Phase 2',
            description: 'Career development focused batch with soft skills training',
            mentorId: mentor2.id,
            createdById: admin.id,
            isActive: true
        }
    });

    const batch3 = await prisma.batch.create({
        data: {
            name: 'Khushboo Batch 2024 – Phase 3',
            description: 'Advanced technical training batch',
            mentorId: mentor3.id,
            createdById: admin.id,
            isActive: true
        }
    });

    console.log('✅ 3 Batches created');

    // Create 5 Students (assigned to batches)
    const student1 = await prisma.user.create({
        data: {
            email: 'prasad@example.com',
            password: passwordHash,
            name: 'Prasad Wadkar',
            role: 'STUDENT',
            phone: '+91 9876543213',
            gender: 'male',
            dateOfBirth: new Date('2000-05-15'),
            educationLevel: 'B.Tech',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=prasad',
            batchId: batch1.id
        }
    });

    const student2 = await prisma.user.create({
        data: {
            email: 'anita.sharma@example.com',
            password: passwordHash,
            name: 'Anita Sharma',
            role: 'STUDENT',
            phone: '+91 9876543214',
            gender: 'female',
            dateOfBirth: new Date('2001-08-20'),
            educationLevel: 'B.E.',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anita',
            batchId: batch1.id
        }
    });

    const student3 = await prisma.user.create({
        data: {
            email: 'vishal.patel@example.com',
            password: passwordHash,
            name: 'Vishal Patel',
            role: 'STUDENT',
            phone: '+91 9876543215',
            gender: 'male',
            dateOfBirth: new Date('2000-12-10'),
            educationLevel: 'B.Tech',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vishal',
            batchId: batch2.id
        }
    });

    const student4 = await prisma.user.create({
        data: {
            email: 'neha.gupta@example.com',
            password: passwordHash,
            name: 'Neha Gupta',
            role: 'STUDENT',
            phone: '+91 9876543230',
            gender: 'female',
            dateOfBirth: new Date('2001-03-25'),
            educationLevel: 'B.Tech',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neha',
            batchId: batch2.id
        }
    });

    const student5 = await prisma.user.create({
        data: {
            email: 'rohit.singh@example.com',
            password: passwordHash,
            name: 'Rohit Singh',
            role: 'STUDENT',
            phone: '+91 9876543231',
            gender: 'male',
            dateOfBirth: new Date('2000-07-18'),
            educationLevel: 'B.E.',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rohit',
            batchId: batch3.id
        }
    });

    // Create demo users for quick login
    const demoStudent = await prisma.user.create({
        data: {
            email: 'student@demo.com',
            password: passwordHash,
            name: 'Demo Student',
            role: 'STUDENT',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
            batchId: batch1.id
        }
    });

    await prisma.user.create({
        data: {
            email: 'mentor@demo.com',
            password: passwordHash,
            name: 'Demo Mentor',
            role: 'MENTOR',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mentor'
        }
    });

    await prisma.user.create({
        data: {
            email: 'admin@demo.com',
            password: passwordHash,
            name: 'Demo Admin',
            role: 'ADMIN',
            profileCompleted: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demoadmin'
        }
    });

    console.log('✅ 5 Students and Demo Users created');

    // Create Learning Resources with YouTube videos
    const resources = await Promise.all([
        prisma.learningResource.create({
            data: {
                title: 'Web Development Essentials',
                description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
                category: 'TECHNICAL_SKILLS',
                videoUrl: 'https://www.youtube.com/embed/UB1O30fR-EE',
                duration: 60,
                lessonsCount: 30,
                isHot: true,
                thumbnailUrl: 'https://img.youtube.com/vi/UB1O30fR-EE/maxresdefault.jpg',
                uploadedById: mentor1.id
            }
        }),
        prisma.learningResource.create({
            data: {
                title: 'Data Science Fundamentals',
                description: 'Introduction to data science concepts, Python, and machine learning basics.',
                category: 'TECHNICAL_SKILLS',
                videoUrl: 'https://www.youtube.com/embed/ua-CiDNNj30',
                duration: 45,
                lessonsCount: 40,
                isHot: true,
                thumbnailUrl: 'https://img.youtube.com/vi/ua-CiDNNj30/maxresdefault.jpg',
                uploadedById: mentor1.id
            }
        }),
        prisma.learningResource.create({
            data: {
                title: 'Effective Communication',
                description: 'Master the art of professional communication and presentation skills.',
                category: 'SOFT_SKILLS',
                videoUrl: 'https://www.youtube.com/embed/eIho2S0ZahI',
                duration: 30,
                lessonsCount: 30,
                isHot: false,
                thumbnailUrl: 'https://img.youtube.com/vi/eIho2S0ZahI/maxresdefault.jpg',
                uploadedById: mentor2.id
            }
        }),
        prisma.learningResource.create({
            data: {
                title: 'Resume Writing Tips',
                description: 'How to create an impressive resume that gets you noticed by recruiters.',
                category: 'CAREER_GUIDANCE',
                videoUrl: 'https://www.youtube.com/embed/Tt08KmFfIYQ',
                duration: 20,
                lessonsCount: 40,
                isHot: false,
                thumbnailUrl: 'https://img.youtube.com/vi/Tt08KmFfIYQ/maxresdefault.jpg',
                uploadedById: mentor2.id
            }
        }),
        prisma.learningResource.create({
            data: {
                title: 'Python Basics',
                description: 'Complete Python programming course for beginners.',
                category: 'TECHNICAL_SKILLS',
                videoUrl: 'https://www.youtube.com/embed/kqtD5dpn9C8',
                duration: 60,
                lessonsCount: 50,
                isHot: true,
                thumbnailUrl: 'https://img.youtube.com/vi/kqtD5dpn9C8/maxresdefault.jpg',
                uploadedById: mentor1.id
            }
        }),
        prisma.learningResource.create({
            data: {
                title: 'Interview Preparation',
                description: 'Complete guide to cracking technical interviews at top companies.',
                category: 'CAREER_GUIDANCE',
                videoUrl: 'https://www.youtube.com/embed/II5Mja9U7iI',
                duration: 45,
                lessonsCount: 25,
                isHot: true,
                thumbnailUrl: 'https://img.youtube.com/vi/II5Mja9U7iI/maxresdefault.jpg',
                uploadedById: mentor2.id
            }
        })
    ]);

    console.log('✅ Learning resources created');

    // Create Session Trackings for students
    await Promise.all([
        prisma.sessionTracking.create({
            data: {
                userId: student1.id,
                resourceId: resources[0].id,
                watchDuration: 3200,
                totalDuration: 3600,
                dropOffPoint: 3200,
                completionPercentage: 89,
                attendanceMarked: true
            }
        }),
        prisma.sessionTracking.create({
            data: {
                userId: student1.id,
                resourceId: resources[1].id,
                watchDuration: 2400,
                totalDuration: 2700,
                dropOffPoint: 2400,
                completionPercentage: 89,
                attendanceMarked: true
            }
        }),
        prisma.sessionTracking.create({
            data: {
                userId: student1.id,
                resourceId: resources[2].id,
                watchDuration: 1500,
                totalDuration: 1800,
                dropOffPoint: 1500,
                completionPercentage: 83,
                attendanceMarked: true
            }
        }),
        prisma.sessionTracking.create({
            data: {
                userId: student2.id,
                resourceId: resources[0].id,
                watchDuration: 2880,
                totalDuration: 3600,
                dropOffPoint: 2880,
                completionPercentage: 80,
                attendanceMarked: true
            }
        }),
        prisma.sessionTracking.create({
            data: {
                userId: student3.id,
                resourceId: resources[4].id,
                watchDuration: 2700,
                totalDuration: 3600,
                dropOffPoint: 2700,
                completionPercentage: 75,
                attendanceMarked: false
            }
        })
    ]);

    console.log('✅ Session trackings created');

    // Create Mentorships
    const mentorship1 = await prisma.mentorship.create({
        data: {
            mentorId: mentor1.id,
            menteeId: student1.id
        }
    });

    const mentorship2 = await prisma.mentorship.create({
        data: {
            mentorId: mentor1.id,
            menteeId: student2.id
        }
    });

    const mentorship3 = await prisma.mentorship.create({
        data: {
            mentorId: mentor2.id,
            menteeId: student3.id
        }
    });

    console.log('✅ Mentorships created');

    // Create Meetings
    await Promise.all([
        prisma.meeting.create({
            data: {
                mentorshipId: mentorship1.id,
                meetingDate: new Date('2026-01-23'),
                duration: 30,
                discussionSummary: 'Discussion on career planning',
                feedback: 'Good progress, keep up the great work.',
                remarks: 'Discussed future goals and learning path'
            }
        }),
        prisma.meeting.create({
            data: {
                mentorshipId: mentorship1.id,
                meetingDate: new Date('2026-01-15'),
                duration: 45,
                discussionSummary: 'Code review and project guidance',
                feedback: 'Excellent coding practices. Need to focus on testing.',
                remarks: 'Reviewed portfolio project'
            }
        }),
        prisma.meeting.create({
            data: {
                mentorshipId: mentorship2.id,
                meetingDate: new Date('2026-01-20'),
                duration: 30,
                discussionSummary: 'Resume review session',
                feedback: 'Resume is well-structured. Add more quantifiable achievements.',
                remarks: 'Scheduled next session for mock interview'
            }
        })
    ]);

    console.log('✅ Meetings created');

    // Create Forum Posts
    const post1 = await prisma.forumPost.create({
        data: {
            title: 'How to prepare for technical interviews?',
            content: 'I have an upcoming interview at a product company. What topics should I focus on? Any tips from those who have cracked similar interviews?',
            authorId: student1.id,
            answersCount: 2
        }
    });

    const post2 = await prisma.forumPost.create({
        data: {
            title: 'Issue with Python installation',
            content: 'I am getting an error while installing Python on my Windows machine. The PATH settings are not working correctly. Has anyone faced this issue?',
            authorId: student3.id,
            answersCount: 1
        }
    });

    console.log('✅ Forum posts created');

    // Create Forum Answers
    await Promise.all([
        prisma.forumAnswer.create({
            data: {
                postId: post1.id,
                content: 'Focus on Data Structures and Algorithms. Practice coding problems on LeetCode and review common algorithm patterns.',
                authorId: mentor1.id,
                upvotes: 15
            }
        }),
        prisma.forumAnswer.create({
            data: {
                postId: post1.id,
                content: 'Practice coding problems on LeetCode and review common patterns. System design is also important for senior roles.',
                authorId: student2.id,
                upvotes: 8
            }
        }),
        prisma.forumAnswer.create({
            data: {
                postId: post2.id,
                content: 'Check the PATH settings and reinstall if needed. Make sure to check the "Add Python to PATH" option during installation.',
                authorId: mentor2.id,
                upvotes: 5
            }
        })
    ]);

    console.log('✅ Forum answers created');

    // Create Announcements
    await Promise.all([
        prisma.announcement.create({
            data: {
                title: 'Career Guidance Seminar this Friday',
                content: 'Join us for an interactive career guidance seminar featuring industry experts from top tech companies. Learn about career paths, industry trends, and get your questions answered!',
                priority: 'high',
                createdById: admin.id
            }
        }),
        prisma.announcement.create({
            data: {
                title: 'New Python Course Available',
                content: 'We have added a comprehensive Python programming course to our learning resources. Start learning today!',
                priority: 'normal',
                createdById: admin.id
            }
        }),
        prisma.announcement.create({
            data: {
                title: 'Placement Drive - Infosys',
                content: 'Infosys is conducting a placement drive next month. Eligible students should prepare for aptitude and technical rounds.',
                priority: 'high',
                createdById: admin.id
            }
        })
    ]);

    console.log('✅ Announcements created');

    // Create Achievements
    await Promise.all([
        prisma.achievement.create({
            data: {
                userId: student1.id,
                type: 'BADGE',
                title: 'Quick Learner',
                description: 'Completed 5 courses in one month'
            }
        }),
        prisma.achievement.create({
            data: {
                userId: student1.id,
                type: 'BADGE',
                title: 'Perfect Attendance',
                description: 'Maintained 100% attendance for a month'
            }
        }),
        prisma.achievement.create({
            data: {
                userId: student1.id,
                type: 'BADGE',
                title: 'Rising Star',
                description: 'Top performer in technical assessments'
            }
        }),
        prisma.achievement.create({
            data: {
                userId: student1.id,
                type: 'PLACEMENT',
                title: 'Interview Scheduled',
                description: 'Infosys - Interview scheduled for Feb 2026'
            }
        }),
        prisma.achievement.create({
            data: {
                userId: student2.id,
                type: 'BADGE',
                title: 'Active Participant',
                description: 'Contributed to 10+ forum discussions'
            }
        })
    ]);

    console.log('✅ Achievements created');

    // Create Activities
    await Promise.all([
        prisma.activity.create({
            data: {
                userId: student1.id,
                type: 'watched',
                title: 'Watched: Python Basics',
                description: 'Completed Python Basics course'
            }
        }),
        prisma.activity.create({
            data: {
                userId: student1.id,
                type: 'completed',
                title: 'Completed: Soft Skills Workshop',
                description: 'Successfully completed the workshop'
            }
        }),
        prisma.activity.create({
            data: {
                userId: student1.id,
                type: 'placement',
                title: 'Placement Update: Interview with Infosys',
                description: 'Selected for technical interview round'
            }
        })
    ]);

    console.log('✅ Activities created');

    // Create Upcoming Sessions
    await Promise.all([
        prisma.session.create({
            data: {
                title: 'Advanced Java',
                description: 'Deep dive into Java programming concepts',
                scheduledAt: new Date('2026-01-30T15:00:00'),
                duration: 90,
                type: 'online'
            }
        }),
        prisma.session.create({
            data: {
                title: 'Career Guidance Seminar',
                description: 'Industry experts sharing career insights',
                scheduledAt: new Date('2026-01-31T14:00:00'),
                duration: 120,
                type: 'offline'
            }
        }),
        prisma.session.create({
            data: {
                title: 'Mock Interview Session',
                description: 'Practice technical interviews with mentors',
                scheduledAt: new Date('2026-02-05T10:00:00'),
                duration: 60,
                type: 'online'
            }
        })
    ]);

    console.log('✅ Sessions created');

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
