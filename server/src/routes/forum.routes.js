const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forum.controller');

router.get('/posts', forumController.getPosts);
router.get('/posts/:id', forumController.getPost);
router.post('/posts', forumController.createPost);
router.post('/posts/:postId/answers', forumController.createAnswer);
router.post('/answers/:answerId/upvote', forumController.upvoteAnswer);
router.patch('/answers/:id/accept', forumController.acceptAnswer);

module.exports = router;
