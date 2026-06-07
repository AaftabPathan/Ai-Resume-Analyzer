const express = require('express');
const router = express.Router();
const ResumeController = require('../controllers/resume.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.post('/upload', authenticateToken, upload.single('resume'), ResumeController.uploadAndParse);
router.post('/builder', authenticateToken, ResumeController.saveBuilderResume);
router.get('/', authenticateToken, ResumeController.getResumes);
router.get(
  '/all',
  authenticateToken,
  requireRole(['recruiter', 'admin']),
  ResumeController.getAllResumes
);
router.get('/:id', authenticateToken, ResumeController.getResume);
router.put('/:id', authenticateToken, ResumeController.updateResume);
router.delete('/:id', authenticateToken, ResumeController.deleteResume);

module.exports = router;
