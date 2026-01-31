const express = require('express');
const router = express.Router();

module.exports = (prisma, authenticateToken) => {
    // Get all forum posts
    router.get('/posts', authenticateToken, async (req, res) => {
        try {
            const posts = await prisma.forumPost.findMany({
                include: {
                    author: { select: { name: true, avatar: true } },
                    answers: {
                        include: {
                            author: { select: { name: true, avatar: true } }
                        },
                        orderBy: { upvotes: 'desc' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(posts);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch forum posts' });
        }
    });

    // Create post
    router.post('/posts', authenticateToken, async (req, res) => {
        try {
            const { title, content } = req.body;

            const post = await prisma.forumPost.create({
                data: {
                    title,
                    content,
                    authorId: req.user.id
                },
                include: {
                    author: { select: { name: true, avatar: true } }
                }
            });

            res.status(201).json(post);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create post' });
        }
    });

    // Create answer
    router.post('/posts/:id/answers', authenticateToken, async (req, res) => {
        try {
            const { content } = req.body;
            const postId = req.params.id;

            const answer = await prisma.forumAnswer.create({
                data: {
                    postId,
                    content,
                    authorId: req.user.id
                },
                include: {
                    author: { select: { name: true, avatar: true } }
                }
            });

            await prisma.forumPost.update({
                where: { id: postId },
                data: { answersCount: { increment: 1 } }
            });

            res.status(201).json(answer);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create answer' });
        }
    });

    // Upvote answer
    router.post('/answers/:id/upvote', authenticateToken, async (req, res) => {
        try {
            const answer = await prisma.forumAnswer.update({
                where: { id: req.params.id },
                data: { upvotes: { increment: 1 } }
            });
            res.json(answer);
        } catch (error) {
            res.status(500).json({ error: 'Failed to upvote answer' });
        }
    });

    return router;
};
