const db = require('../config/db');
const AIService = require('../services/ai.service');

const ATSController = {
  /**
   * Evaluate a resume (against optional job description)
   */
  async evaluate(req, res) {
    const { resumeId, jobDescriptionText } = req.body;
    const userId = req.user.id;

    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID is required for ATS evaluation.' });
    }

    try {
      // Security Check: verify owner
      const resumes = await db.query('SELECT * FROM resumes WHERE id = ?', [resumeId]);
      if (resumes.length === 0) {
        return res.status(404).json({ error: 'Resume not found.' });
      }
      if (resumes[0].user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to access this resume.' });
      }

      // Get latest resume version
      const versions = await db.query(
        'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1',
        [resumeId]
      );
      if (versions.length === 0) {
        return res.status(404).json({ error: 'No version data found for this resume.' });
      }

      const resumeJson = JSON.parse(versions[0].resume_json);

      // Invoke AI analyzer
      console.log(`Analyzing ATS score for resume ID: ${resumeId}`);
      const evaluation = await AIService.evaluateATS(resumeJson, jobDescriptionText || '');

      // Store in database
      const reportResult = await db.execute(
        `INSERT INTO ats_reports (
          resume_id, overall_score, formatting_score, skill_score, 
          keyword_score, experience_score, education_score, project_score, 
          breakdown_json, weaknesses_json, missing_keywords_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resumeId,
          evaluation.overallScore,
          evaluation.formattingScore,
          evaluation.skillScore,
          evaluation.keywordScore,
          evaluation.experienceScore,
          evaluation.educationScore,
          evaluation.projectScore,
          JSON.stringify(evaluation.breakdown),
          JSON.stringify(evaluation.weaknesses),
          JSON.stringify(evaluation.missingKeywords)
        ]
      );

      // Log event
      await db.execute(
        'INSERT INTO analytics (user_id, event_type, event_details_json) VALUES (?, ?, ?)',
        [
          userId,
          'ATS_EVALUATION',
          JSON.stringify({
            resumeId,
            reportId: reportResult.insertId,
            score: evaluation.overallScore
          })
        ]
      );

      return res.json({
        message: 'ATS report generated successfully.',
        reportId: reportResult.insertId,
        evaluation
      });
    } catch (err) {
      console.error('ATS evaluation error:', err);
      return res.status(500).json({ error: `ATS scoring failed: ${err.message}` });
    }
  },

  /**
   * Get all ATS reports generated for a specific resume
   */
  async getReportsForResume(req, res) {
    const resumeId = req.params.resumeId;
    const userId = req.user.id;

    try {
      const resumes = await db.query('SELECT * FROM resumes WHERE id = ?', [resumeId]);
      if (resumes.length === 0) {
        return res.status(404).json({ error: 'Resume not found.' });
      }
      if (resumes[0].user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized.' });
      }

      const reports = await db.query(
        'SELECT * FROM ats_reports WHERE resume_id = ? ORDER BY created_at DESC',
        [resumeId]
      );

      // Map details from text representation to parsed JSON
      const formattedReports = reports.map((r) => ({
        id: r.id,
        resumeId: r.resume_id,
        overallScore: r.overall_score,
        formattingScore: r.formatting_score,
        skillScore: r.skill_score,
        keywordScore: r.keyword_score,
        experienceScore: r.experience_score,
        educationScore: r.education_score,
        projectScore: r.project_score,
        breakdown: JSON.parse(r.breakdown_json || '{}'),
        weaknesses: JSON.parse(r.weaknesses_json || '[]'),
        missingKeywords: JSON.parse(r.missing_keywords_json || '[]'),
        createdAt: r.created_at
      }));

      return res.json({ reports: formattedReports });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve reports.' });
    }
  },

  /**
   * Get AI suggestions for rewriting weak bullet points
   */
  async getSuggestions(req, res) {
    const resumeId = req.params.resumeId;
    const userId = req.user.id;

    try {
      const resumes = await db.query('SELECT * FROM resumes WHERE id = ?', [resumeId]);
      if (resumes.length === 0) {
        return res.status(404).json({ error: 'Resume not found.' });
      }
      if (resumes[0].user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized.' });
      }

      const versions = await db.query(
        'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1',
        [resumeId]
      );
      if (versions.length === 0) {
        return res.status(404).json({ error: 'No version data found.' });
      }

      const resumeJson = JSON.parse(versions[0].resume_json);
      const suggestions = await AIService.suggestImprovements(resumeJson);

      return res.json({ suggestions });
    } catch (err) {
      console.error('Improvement suggestions error:', err);
      return res.status(500).json({ error: 'Failed to generate improvement suggestions.' });
    }
  }
};

module.exports = ATSController;
