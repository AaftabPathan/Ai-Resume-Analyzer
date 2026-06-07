const db = require('../config/db');
const AIService = require('../services/ai.service');

const CoachController = {
  /**
   * Get custom roadmap for career tracks
   */
  async getRoadmap(req, res) {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({ error: 'Role name is required for career coaching.' });
    }

    try {
      console.log(`Generating career roadmap for role: ${role}`);
      const roadmap = await AIService.generateCareerRoadmap(role);
      return res.json({ roadmap });
    } catch (err) {
      console.error('Roadmap error:', err);
      return res.status(500).json({ error: 'Failed to generate career roadmap.' });
    }
  },

  /**
   * Generate mock interview questions based on resume and target role
   */
  async getInterviewQuestions(req, res) {
    const { resumeId, role } = req.body;
    const userId = req.user.id;

    if (!resumeId || !role) {
      return res.status(400).json({ error: 'Resume ID and target role are required.' });
    }

    try {
      // Load latest resume data
      const versions = await db.query(
        'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1',
        [resumeId]
      );
      if (versions.length === 0) {
        return res.status(404).json({ error: 'Resume not found.' });
      }

      const resumeJson = JSON.parse(versions[0].resume_json);
      console.log(`Generating interview prep for role: ${role}`);
      const questions = await AIService.generateInterviewPrep(resumeJson, role);

      // Save questions in database for user tracking
      const savedQuestions = [];
      for (const q of questions) {
        const result = await db.execute(
          `INSERT INTO interview_questions (user_id, resume_id, role, question_type, question, suggested_answer, difficulty) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, resumeId, role, q.type, q.question, q.suggestedAnswer, q.difficulty || 'Medium']
        );
        savedQuestions.push({
          id: result.insertId,
          question: q.question,
          type: q.type,
          suggestedAnswer: q.suggestedAnswer,
          difficulty: q.difficulty || 'Medium',
          userNotes: ''
        });
      }

      return res.json({ questions: savedQuestions });
    } catch (err) {
      console.error('Interview prep generation error:', err);
      return res.status(500).json({ error: 'Failed to generate interview prep questions.' });
    }
  },

  /**
   * Save user notes/mock answer for a generated question
   */
  async updateQuestionNotes(req, res) {
    const questionId = req.params.id;
    const { userNotes } = req.body;
    const userId = req.user.id;

    try {
      const questions = await db.query('SELECT * FROM interview_questions WHERE id = ?', [
        questionId
      ]);
      if (questions.length === 0) {
        return res.status(404).json({ error: 'Question record not found.' });
      }

      if (questions[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to modify this response.' });
      }

      await db.execute('UPDATE interview_questions SET user_notes = ? WHERE id = ?', [
        userNotes || '',
        questionId
      ]);

      return res.json({ message: 'Response notes saved successfully.' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save notes.' });
    }
  },

  /**
   * Retrieve saved interview questions for the user
   */
  async getSavedQuestions(req, res) {
    const userId = req.user.id;
    try {
      const questions = await db.query(
        'SELECT * FROM interview_questions WHERE user_id = ? ORDER BY id DESC',
        [userId]
      );

      const formatted = questions.map((q) => ({
        id: q.id,
        resumeId: q.resume_id,
        role: q.role,
        type: q.question_type,
        question: q.question,
        suggestedAnswer: q.suggested_answer,
        userNotes: q.user_notes || '',
        difficulty: q.difficulty
      }));

      return res.json({ questions: formatted });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve saved questions.' });
    }
  },

  /**
   * Compare user resume skills vs target industry requirements (Skill Gap Analysis)
   */
  async analyzeSkillGap(req, res) {
    const { resumeId, targetRole } = req.body;
    const userId = req.user.id;

    if (!resumeId || !targetRole) {
      return res.status(400).json({ error: 'Resume ID and target role are required.' });
    }

    try {
      const versions = await db.query(
        'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1',
        [resumeId]
      );
      if (versions.length === 0) {
        return res.status(404).json({ error: 'Resume version data not found.' });
      }

      const resumeJson = JSON.parse(versions[0].resume_json);
      const userSkills = [
        ...(resumeJson.skills?.technical || []),
        ...(resumeJson.skills?.tools || [])
      ];

      // Request recommendations from career coach roadmap
      const benchmark = await AIService.generateCareerRoadmap(targetRole);
      const essentialBenchmark = benchmark.skills?.essential || [];
      const intermediateBenchmark = benchmark.skills?.intermediate || [];
      const advancedBenchmark = benchmark.skills?.advanced || [];
      const allBenchmark = [...essentialBenchmark, ...intermediateBenchmark, ...advancedBenchmark];

      // Identify missing skills
      const missingSkills = allBenchmark.filter(
        (skill) => !userSkills.some((us) => us.toLowerCase() === skill.toLowerCase())
      );

      const matchRate =
        allBenchmark.length > 0
          ? Math.round(((allBenchmark.length - missingSkills.length) / allBenchmark.length) * 100)
          : 70;

      // Suggest specific learning items based on missing skills
      const recommendedCourses = missingSkills.slice(0, 3).map((skill) => ({
        title: `${skill} Mastery Course`,
        platform: 'Udemy / Coursera',
        duration: '12-20 Hours',
        difficulty: 'Intermediate'
      }));

      const recommendedProjects = [
        {
          title: `Build a scalable application with ${missingSkills[0] || 'Cloud API integration'}`,
          description: `Create a deployment demonstrating containerized structures, monitoring, and state tracking.`,
          difficulty: 'Hard'
        }
      ];

      return res.json({
        targetRole,
        matchRate,
        currentSkillsCount: userSkills.length,
        benchmarkSkillsCount: allBenchmark.length,
        essential: essentialBenchmark,
        missing: missingSkills,
        courses: recommendedCourses,
        projects: recommendedProjects
      });
    } catch (err) {
      console.error('Skill gap error:', err);
      return res.status(500).json({ error: 'Failed to analyze skill gaps.' });
    }
  },

  /**
   * Match user resume against specific job description
   */
  async matchJobDescription(req, res) {
    const { resumeId, jobDescription } = req.body;
    const userId = req.user.id;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({ error: 'Resume ID and Job Description text are required.' });
    }

    try {
      const versions = await db.query(
        'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1',
        [resumeId]
      );
      if (versions.length === 0) {
        return res.status(404).json({ error: 'Resume not found.' });
      }

      const resumeJson = JSON.parse(versions[0].resume_json);
      const evalReport = await AIService.evaluateATS(resumeJson, jobDescription);

      // Save match logs
      // Generate job entry first
      const jobDescResult = await db.execute(
        `INSERT INTO job_descriptions (user_id, title, company_name, description_text) 
         VALUES (?, ?, ?, ?)`,
        [userId, 'Custom Upload Analysis', 'Target Company', jobDescription]
      );
      const jobId = jobDescResult.insertId;

      await db.execute(
        `INSERT INTO job_matches (resume_id, job_id, match_score, matching_details_json) 
         VALUES (?, ?, ?, ?)`,
        [resumeId, jobId, evalReport.overallScore, JSON.stringify(evalReport.breakdown)]
      );

      return res.json({
        matchPercentage: evalReport.overallScore,
        breakdown: evalReport.breakdown,
        missingKeywords: evalReport.missingKeywords,
        missingSkills: evalReport.missingSkills,
        weaknesses: evalReport.weaknesses,
        improvementPlan: [
          'Incorporate keywords from the JD (especially: ' +
            (evalReport.missingKeywords.slice(0, 3).join(', ') || 'missing items') +
            ').',
          'Rewrite project descriptions to reflect bullet metrics matching the target role.',
          'Verify font size and section names for standard layout formatting.'
        ]
      });
    } catch (err) {
      console.error('Job match error:', err);
      return res.status(500).json({ error: 'Failed to match job description.' });
    }
  },

  /**
   * Generate dynamic cover letters
   */
  async generateCoverLetter(req, res) {
    const { resumeId, jobDescription, companyName, role } = req.body;
    const userId = req.user.id;

    if (!resumeId || !jobDescription) {
      return res
        .status(400)
        .json({ error: 'Resume ID and Job Description are required for cover letters.' });
    }

    const company = companyName || 'Target Company';
    const targetRole = role || 'Target Role';

    try {
      const versions = await db.query(
        'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1',
        [resumeId]
      );
      if (versions.length === 0) {
        return res.status(404).json({ error: 'Resume data not found.' });
      }

      const resumeJson = JSON.parse(versions[0].resume_json);
      const result = await AIService.generateCoverLetter(
        resumeJson,
        jobDescription,
        company,
        targetRole
      );

      // Save record in database
      const letterResult = await db.execute(
        `INSERT INTO cover_letters (user_id, resume_id, recipient_company, recipient_role, letter_text) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, resumeId, company, targetRole, result.letterText]
      );

      return res.status(201).json({
        message: 'Cover letter generated successfully.',
        letterId: letterResult.insertId,
        letterText: result.letterText
      });
    } catch (err) {
      console.error('Cover letter generation error:', err);
      return res.status(500).json({ error: 'Failed to generate cover letter.' });
    }
  },

  /**
   * Get all generated cover letters for a user
   */
  async getCoverLetters(req, res) {
    const userId = req.user.id;
    try {
      const letters = await db.query(
        'SELECT * FROM cover_letters WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return res.json({ letters });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve cover letters.' });
    }
  },

  /**
   * Recommend jobs and learning pathways based on resume skills
   */
  async getRecommendations(req, res) {
    const userId = req.user.id;
    const { resumeId } = req.query;

    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID is required for recommendation engines.' });
    }

    try {
      const versions = await db.query(
        'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1',
        [resumeId]
      );
      if (versions.length === 0) {
        return res.status(404).json({ error: 'Resume not found.' });
      }

      const resumeJson = JSON.parse(versions[0].resume_json);
      const skills = [...(resumeJson.skills?.technical || []), ...(resumeJson.skills?.tools || [])];

      // Simulated Job Recommendations matching skills
      const jobs = [
        {
          id: 101,
          title: 'Full Stack Engineer',
          company: 'Nexus Tech Systems',
          location: 'San Francisco, CA (Hybrid)',
          salary: '$110,000 - $140,000',
          matchPercentage: 92,
          skillsRequired: ['TypeScript', 'Angular', 'Node.js', 'SQL'],
          type: 'full-time'
        },
        {
          id: 102,
          title: 'Software Developer (Remote)',
          company: 'Aura Cloud Services',
          location: 'Remote (US/Canada)',
          salary: '$95,000 - $120,000',
          matchPercentage: 86,
          skillsRequired: ['JavaScript', 'HTML5', 'CSS3', 'Git'],
          type: 'full-time'
        },
        {
          id: 103,
          title: 'DevOps Engineer Intern',
          company: 'Stellar Networks',
          location: 'Austin, TX (On-site)',
          salary: '$40 - $55 / Hour',
          matchPercentage: 78,
          skillsRequired: ['Docker', 'Linux', 'Git', 'Bash'],
          type: 'internship'
        }
      ];

      // Filter based on user's matched profile words if any
      const matchingJobs = jobs.map((job) => {
        let matches = 0;
        job.skillsRequired.forEach((reqSkill) => {
          if (skills.some((us) => us.toLowerCase().includes(reqSkill.toLowerCase()))) {
            matches++;
          }
        });
        const dynamicScore = Math.max(
          60,
          Math.min(98, 60 + Math.round((matches / job.skillsRequired.length) * 38))
        );
        return {
          ...job,
          matchPercentage: dynamicScore
        };
      });

      return res.json({
        jobs: matchingJobs,
        certifications: [
          {
            name: 'AWS Certified Developer - Associate',
            provider: 'Amazon Web Services',
            difficulty: 'Medium'
          },
          {
            name: 'Google Cloud Associate Cloud Engineer',
            provider: 'Google Cloud',
            difficulty: 'Medium'
          }
        ],
        courses: [
          { name: 'Angular Advanced Topics & Architecture', platform: 'Pluralsight', rating: 4.8 },
          { name: 'Docker & Kubernetes: The Practical Guide', platform: 'Udemy', rating: 4.7 }
        ]
      });
    } catch (err) {
      console.error('Recommendations error:', err);
      return res.status(500).json({ error: 'Failed to retrieve recommendations.' });
    }
  }
};

module.exports = CoachController;
