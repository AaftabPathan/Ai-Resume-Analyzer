const express = require('express');
const router = express.Router();
const ATSController = require('../controllers/ats.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.post('/evaluate', authenticateToken, ATSController.evaluate);
router.get('/resume/:resumeId', authenticateToken, ATSController.getReportsForResume);
router.get('/suggestions/:resumeId', authenticateToken, ATSController.getSuggestions);

module.exports = router;
