const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/chatbot.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get('/conversations', authenticateToken, ChatbotController.getConversations);
router.post('/conversations', authenticateToken, ChatbotController.createConversation);
router.get('/messages/:conversationId', authenticateToken, ChatbotController.getMessages);
router.post('/message', authenticateToken, ChatbotController.sendMessage);
router.post('/roadmap', authenticateToken, ChatbotController.generateRoadmap);

module.exports = router;
