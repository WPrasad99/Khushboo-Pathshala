const prisma = require('../config/prisma');

exports.getPosts = async (req, res, next) => {
    try {
        const { batchId } = req.query;
        const where = batchId ? { author: { batchesAsStudent: { some: { batchId } } } } : {};

        const posts = await prisma.forumPost.findMany({
            where,
            include: {
                author: { select: { id: true, name: true, avatar: true } },
                _count: { select: { answers: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: posts });
    } catch (error) {
        next(error);
    }
};

exports.getPost = async (req, res, next) => {
    try {
        const post = await prisma.forumPost.findUnique({
            where: { id: req.params.id },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
                answers: {
                    include: {
                        author: { select: { id: true, name: true, avatar: true } },
                        votes: { where: { userId: req.user.id } }
                    },
                    orderBy: [{ isAccepted: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }]
                }
            }
        });
        if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });
        res.json({ success: true, data: post });
    } catch (error) {
        next(error);
    }
};

/**
 * ISSUE #22 FIX: Input validation for forum post creation.
 */
exports.createPost = async (req, res, next) => {
    try {
        const { title, content } = req.body;

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Title is required.' });
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Content is required.' });
        }

        const post = await prisma.forumPost.create({
            data: { title: title.trim(), content: content.trim(), authorId: req.user.id },
            include: { author: { select: { id: true, name: true, avatar: true } } }
        });
        res.status(201).json({ success: true, data: post });
    } catch (error) {
        next(error);
    }
};

exports.createAnswer = async (req, res, next) => {
    try {
        const { content } = req.body;
        const { postId } = req.params;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Answer content is required.' });
        }

        // Verify post exists
        const post = await prisma.forumPost.findUnique({ where: { id: postId } });
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found.' });
        }

        const answer = await prisma.$transaction(async (tx) => {
            const a = await tx.forumAnswer.create({
                data: { content: content.trim(), postId, authorId: req.user.id },
                include: { author: { select: { id: true, name: true, avatar: true } } }
            });
            await tx.forumPost.update({
                where: { id: postId },
                data: { answersCount: { increment: 1 } }
            });
            return a;
        });

        res.status(201).json({ success: true, data: answer });
    } catch (error) {
        next(error);
    }
};

exports.upvoteAnswer = async (req, res, next) => {
    try {
        const { answerId } = req.params;
        const userId = req.user.id;

        // Verify answer exists
        const answer = await prisma.forumAnswer.findUnique({ where: { id: answerId } });
        if (!answer) {
            return res.status(404).json({ success: false, error: 'Answer not found.' });
        }

        const existing = await prisma.answerVote.findUnique({
            where: { userId_answerId: { userId, answerId } }
        });

        if (existing) {
            await prisma.$transaction([
                prisma.answerVote.delete({ where: { id: existing.id } }),
                prisma.forumAnswer.update({ where: { id: answerId }, data: { upvotes: { decrement: 1 } } })
            ]);
            return res.json({ success: true, message: 'Upvote removed.', data: { voted: false } });
        }

        await prisma.$transaction([
            prisma.answerVote.create({ data: { userId, answerId } }),
            prisma.forumAnswer.update({ where: { id: answerId }, data: { upvotes: { increment: 1 } } })
        ]);

        res.json({ success: true, message: 'Upvoted successfully.', data: { voted: true } });
    } catch (error) {
        next(error);
    }
};

exports.acceptAnswer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const answer = await prisma.forumAnswer.findUnique({
            where: { id },
            include: { post: true }
        });

        if (!answer) return res.status(404).json({ success: false, error: 'Answer not found.' });
        if (answer.post.authorId !== userId) {
            return res.status(403).json({ success: false, error: 'Only the post author can accept answers.' });
        }

        await prisma.$transaction([
            prisma.forumAnswer.updateMany({ where: { postId: answer.postId }, data: { isAccepted: false } }),
            prisma.forumAnswer.update({ where: { id }, data: { isAccepted: true } })
        ]);

        res.json({ success: true, message: 'Answer accepted.' });
    } catch (error) {
        next(error);
    }
};
