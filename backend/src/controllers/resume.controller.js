const db = require('../config/db');
const ParserService = require('../services/parser.service');
const AIService = require('../services/ai.service');
const fs = require('fs');

const ResumeController = {
  /**
   * Upload and AI-parse a resume (PDF/DOCX)
   */
  async uploadAndParse(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a resume file (PDF or DOCX).' });
    }

    const userId = req.user.id;
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;

    try {
      console.log(`Extracting text from uploaded file: ${originalName}`);
      const rawText = await ParserService.parseFile(filePath, mimeType);

      console.log('Sending extracted text to AI service for structured parsing...');
      const parsedData = await AIService.parseResume(rawText);

      // Save to database
      const title = parsedData.personalInfo?.name
        ? `${parsedData.personalInfo.name}'s Resume`
        : `Resume - ${new Date().toLocaleDateString()}`;

      const resumeResult = await db.execute(
        'INSERT INTO resumes (user_id, title, original_file_name, file_path, extracted_text) VALUES (?, ?, ?, ?, ?)',
        [userId, title, originalName, filePath, rawText]
      );

      const resumeId = resumeResult.insertId;

      // Save initial version (Version 1)
      await db.execute(
        'INSERT INTO resume_versions (resume_id, version_number, resume_json) VALUES (?, ?, ?)',
        [resumeId, 1, JSON.stringify(parsedData)]
      );

      // Save individual components for fast relational querying
      // Save skills
      if (parsedData.skills) {
        const categories = ['technical', 'soft', 'tools'];
        for (const cat of categories) {
          const skillsList = parsedData.skills[cat] || [];
          for (const s of skillsList) {
            await db.execute(
              'INSERT INTO skills (user_id, skill_name, category, confidence_score) VALUES (?, ?, ?, ?)',
              [userId, s, cat, 100]
            );
          }
        }
      }

      // Save projects
      if (parsedData.experience) {
        // Look for items with projects, or save experiences themselves
        for (const exp of parsedData.experience) {
          await db.execute(
            'INSERT INTO projects (resume_id, title, description, technologies_used) VALUES (?, ?, ?, ?)',
            [
              resumeId,
              `${exp.position} at ${exp.company}`,
              exp.responsibilities?.join('\n') || '',
              ''
            ]
          );
        }
      }

      // Save certifications
      if (parsedData.certifications) {
        for (const cert of parsedData.certifications) {
          await db.execute(
            'INSERT INTO certifications (resume_id, name, issuing_authority) VALUES (?, ?, ?)',
            [resumeId, cert, '']
          );
        }
      }

      // Log analytics event
      await db.execute(
        'INSERT INTO analytics (user_id, event_type, event_details_json) VALUES (?, ?, ?)',
        [userId, 'RESUME_UPLOAD', JSON.stringify({ resumeId, originalName, size: req.file.size })]
      );

      return res.status(201).json({
        message: 'Resume uploaded and parsed successfully.',
        resumeId,
        title,
        parsedData
      });
    } catch (err) {
      console.error('Error during resume processing:', err);
      // Clean up uploaded file if parsing fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(500).json({ error: `Failed to process resume: ${err.message}` });
    }
  },

  /**
   * Get all resumes belonging to user
   */
  async getResumes(req, res) {
    const userId = req.user.id;
    try {
      const resumes = await db.query(
        `SELECT r.id, r.title, r.original_file_name, r.created_at, 
         (SELECT MAX(rv.version_number) FROM resume_versions rv WHERE rv.resume_id = r.id) as current_version 
         FROM resumes r WHERE r.user_id = ? ORDER BY r.updated_at DESC`,
        [userId]
      );

      return res.json({ resumes });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve resumes.' });
    }
  },

  /**
   * Get specific resume and its latest (or target) version structure
   */
  async getResume(req, res) {
    const resumeId = req.params.id;
    const userId = req.user.id;
    const targetVersion = req.query.version; // optional version query param

    try {
      // Security Check: confirm resume belongs to requesting user OR requesting user is admin/recruiter
      const resumes = await db.query('SELECT * FROM resumes WHERE id = ?', [resumeId]);
      if (resumes.length === 0) {
        return res.status(404).json({ error: 'Resume not found.' });
      }

      const resume = resumes[0];
      if (resume.user_id !== userId && req.user.role !== 'admin' && req.user.role !== 'recruiter') {
        return res.status(403).json({ error: 'Unauthorized to view this resume.' });
      }

      let versionQuery =
        'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1';
      let params = [resumeId];

      if (targetVersion) {
        versionQuery = 'SELECT * FROM resume_versions WHERE resume_id = ? AND version_number = ?';
        params = [resumeId, parseInt(targetVersion, 10)];
      }

      const versions = await db.query(versionQuery, params);
      if (versions.length === 0) {
        return res.status(404).json({ error: 'Resume version data not found.' });
      }

      const activeVersion = versions[0];
      const parsedJson = JSON.parse(activeVersion.resume_json);

      // Get version list
      const versionList = await db.query(
        'SELECT id, version_number, created_at FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC',
        [resumeId]
      );

      return res.json({
        resume: {
          id: resume.id,
          userId: resume.user_id,
          title: resume.title,
          originalFileName: resume.original_file_name,
          filePath: resume.file_path,
          createdAt: resume.created_at,
          updatedAt: resume.updated_at
        },
        versionDetails: {
          id: activeVersion.id,
          versionNumber: activeVersion.version_number,
          createdAt: activeVersion.created_at
        },
        versions: versionList,
        data: parsedJson
      });
    } catch (err) {
      console.error('Error fetching resume details:', err);
      return res.status(500).json({ error: 'Failed to retrieve resume details.' });
    }
  },

  /**
   * Update the structured JSON of a resume (creates a new version)
   */
  async updateResume(req, res) {
    const resumeId = req.params.id;
    const userId = req.user.id;
    const updatedData = req.body; // New JSON structure

    try {
      const resumes = await db.query('SELECT * FROM resumes WHERE id = ?', [resumeId]);
      if (resumes.length === 0) {
        return res.status(404).json({ error: 'Resume not found.' });
      }

      const resume = resumes[0];
      if (resume.user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to update this resume.' });
      }

      // Find highest version number
      const versions = await db.query(
        'SELECT MAX(version_number) as max_v FROM resume_versions WHERE resume_id = ?',
        [resumeId]
      );
      const nextVersionNum = (versions[0].max_v || 0) + 1;

      // Insert new version
      await db.execute(
        'INSERT INTO resume_versions (resume_id, version_number, resume_json) VALUES (?, ?, ?)',
        [resumeId, nextVersionNum, JSON.stringify(updatedData)]
      );

      // Update parent updated_at timestamp
      await db.execute('UPDATE resumes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        resumeId
      ]);

      // Log event
      await db.execute(
        'INSERT INTO analytics (user_id, event_type, event_details_json) VALUES (?, ?, ?)',
        [userId, 'RESUME_UPDATE', JSON.stringify({ resumeId, versionNumber: nextVersionNum })]
      );

      return res.json({
        message: `Version ${nextVersionNum} saved successfully.`,
        versionNumber: nextVersionNum
      });
    } catch (err) {
      console.error('Error updating resume:', err);
      return res.status(500).json({ error: 'Failed to update resume.' });
    }
  },

  /**
   * Save a newly created resume from the resume builder
   */
  async saveBuilderResume(req, res) {
    const userId = req.user.id;
    const { title, resumeData } = req.body;

    if (!title || !resumeData) {
      return res.status(400).json({ error: 'Title and resume data are required.' });
    }

    try {
      // Save primary row (simulate empty file paths as it was generated directly)
      const resumeResult = await db.execute(
        'INSERT INTO resumes (user_id, title, original_file_name, file_path, extracted_text) VALUES (?, ?, ?, ?, ?)',
        [userId, title, 'builder-export.json', 'builder', JSON.stringify(resumeData)]
      );

      const resumeId = resumeResult.insertId;

      // Save version 1
      await db.execute(
        'INSERT INTO resume_versions (resume_id, version_number, resume_json) VALUES (?, ?, ?)',
        [resumeId, 1, JSON.stringify(resumeData)]
      );

      return res.status(201).json({
        message: 'Resume saved from editor successfully.',
        resumeId
      });
    } catch (err) {
      console.error('Error saving builder resume:', err);
      return res.status(500).json({ error: 'Failed to save builder resume.' });
    }
  },

  /**
   * Delete resume record
   */
  async deleteResume(req, res) {
    const resumeId = req.params.id;
    const userId = req.user.id;

    try {
      const resumes = await db.query('SELECT * FROM resumes WHERE id = ?', [resumeId]);
      if (resumes.length === 0) {
        return res.status(404).json({ error: 'Resume not found.' });
      }

      const resume = resumes[0];
      if (resume.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to delete this resume.' });
      }

      // Delete child associations
      await db.execute('DELETE FROM resume_versions WHERE resume_id = ?', [resumeId]);
      await db.execute('DELETE FROM projects WHERE resume_id = ?', [resumeId]);
      await db.execute('DELETE FROM certifications WHERE resume_id = ?', [resumeId]);
      await db.execute('DELETE FROM ats_reports WHERE resume_id = ?', [resumeId]);
      await db.execute('DELETE FROM job_matches WHERE resume_id = ?', [resumeId]);
      await db.execute('DELETE FROM resumes WHERE id = ?', [resumeId]);

      // Remove local file if it exists
      if (resume.file_path && fs.existsSync(resume.file_path)) {
        fs.unlinkSync(resume.file_path);
      }

      return res.json({ message: 'Resume and all associated records deleted successfully.' });
    } catch (err) {
      console.error('Error deleting resume:', err);
      return res.status(500).json({ error: 'Failed to delete resume.' });
    }
  },

  /**
   * Get all resumes across all candidates (Recruiter/Admin only)
   */
  async getAllResumes(req, res) {
    try {
      const resumes = await db.query(
        `SELECT r.id, r.title, r.original_file_name, r.created_at, u.name as user_name, u.email as user_email,
         (SELECT MAX(rv.version_number) FROM resume_versions rv WHERE rv.resume_id = r.id) as current_version
         FROM resumes r
         JOIN users u ON r.user_id = u.id
         ORDER BY r.updated_at DESC`
      );
      return res.json({ resumes });
    } catch (err) {
      console.error('Error fetching all resumes:', err);
      return res.status(500).json({ error: 'Failed to retrieve resumes database records.' });
    }
  }
};

module.exports = ResumeController;
