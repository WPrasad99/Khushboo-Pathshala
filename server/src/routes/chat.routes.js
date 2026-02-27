const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '../../uploads') });

router.get('/groups', chatController.getGroups);
router.post('/groups', chatController.createGroup);
router.post('/groups/batch', chatController.createBatchGroup);
router.post('/groups/direct', chatController.createDirectMessage);
router.get('/groups/:groupId/messages', chatController.getMessages);
router.post('/groups/:groupId/messages', chatController.sendMessage);

router.get('/invites', chatController.getInvites);
router.put('/invites/:id', chatController.respondToInvite);

router.post('/upload', upload.array('files'), chatController.uploadFiles);
router.get('/users', chatController.getUsers);
router.get('/contacts', chatController.getContacts);

module.exports = router;
