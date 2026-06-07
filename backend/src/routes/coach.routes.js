const express = require('express');
const router = express.Router();
const CoachController = require('../controllers/coach.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get('/roadmap', authenticateToken, CoachController.getRoadmap);
router.post('/interview-prep', authenticateToken, CoachController.getInterviewQuestions);
router.get('/interview-prep/saved', authenticateToken, CoachController.getSavedQuestions);
router.put('/interview-prep/:id/notes', authenticateToken, CoachController.updateQuestionNotes);
router.post('/skill-gap', authenticateToken, CoachController.analyzeSkillGap);
router.post('/match-jd', authenticateToken, CoachController.matchJobDescription);
router.post('/cover-letter', authenticateToken, CoachController.generateCoverLetter);
router.get('/cover-letters', authenticateToken, CoachController.getCoverLetters);
router.get('/recommendations', authenticateToken, CoachController.getRecommendations);

module.exports = router;
