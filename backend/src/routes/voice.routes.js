const express = require('express');
const router = express.Router();
const VoiceController = require('../controllers/voice.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.post('/session', authenticateToken, VoiceController.startSession);
router.post('/submit-answer', authenticateToken, VoiceController.submitAnswer);
router.post('/session/:id/complete', authenticateToken, VoiceController.completeSession);
router.get('/sessions', authenticateToken, VoiceController.getSessions);
router.get('/session/:id/report', authenticateToken, VoiceController.getSessionDetails);
router.get('/stats', authenticateToken, VoiceController.getStats);

module.exports = router;
