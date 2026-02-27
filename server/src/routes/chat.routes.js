const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

router.get('/groups', chatController.getGroups);
router.post('/groups/direct', chatController.createDirectMessage);
router.get('/groups/:groupId/messages', chatController.getMessages);
router.post('/groups/:groupId/messages', chatController.sendMessage);
router.get('/contacts', chatController.getContacts);

module.exports = router;
