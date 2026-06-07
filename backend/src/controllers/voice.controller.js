const db = require('../config/db');
const AIService = require('../services/ai.service');

const VoiceController = {
  /**
   * Start an interview session and generate questions
   */
  async startSession(req, res) {
    const { resumeId, role } = req.body;
    const userId = req.user.id;

    if (!role) {
      return res.status(400).json({ error: 'Selected interview role is required.' });
    }

    try {
      let resumeJson = null;
      if (resumeId) {
        const versions = await db.query(
          'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1',
          [resumeId]
        );
        if (versions.length > 0) {
          resumeJson = JSON.parse(versions[0].resume_json);
        }
      }

      console.log(`Generating AI Voice Interview questions for role: ${role}`);
      const questions = await AIService.generateVoiceQuestions(resumeJson, role);

      // Save session
      const sessionResult = await db.execute(
        `INSERT INTO interview_sessions (user_id, resume_id, role, status) 
         VALUES (?, ?, ?, 'in_progress')`,
        [userId, resumeId || null, role]
      );

      const sessionId = sessionResult.insertId;

      // Save questions in interview_answers block
      const savedQuestions = [];
      for (const q of questions) {
        const questionResult = await db.execute(
          `INSERT INTO interview_answers (session_id, question, category, suggested_answer) 
           VALUES (?, ?, ?, ?)`,
          [sessionId, q.question, q.category, q.suggestedAnswer]
        );
        savedQuestions.push({
          id: questionResult.insertId,
          question: q.question,
          category: q.category
        });
      }

      // Log event
      await db.execute(
        'INSERT INTO analytics (user_id, event_type, event_details_json) VALUES (?, ?, ?)',
        [userId, 'INTERVIEW_START', JSON.stringify({ sessionId, role })]
      );

      return res.status(201).json({
        message: 'Voice interview session started.',
        sessionId,
        role,
        questions: savedQuestions
      });
    } catch (err) {
      console.error('Start interview session error:', err);
      return res.status(500).json({ error: 'Failed to start interview session.' });
    }
  },

  /**
   * Submit and AI-evaluate a single question response
   */
  async submitAnswer(req, res) {
    const { sessionId, questionId, answer } = req.body;
    const userId = req.user.id;

    if (!sessionId || !questionId || !answer) {
      return res.status(400).json({ error: 'Session ID, Question ID, and Answer are required.' });
    }

    try {
      // Validate session belongs to user
      const sessions = await db.query('SELECT * FROM interview_sessions WHERE id = ?', [sessionId]);
      if (sessions.length === 0 || sessions[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized session access.' });
      }

      const session = sessions[0];

      // Fetch the question
      const answers = await db.query(
        'SELECT * FROM interview_answers WHERE id = ? AND session_id = ?',
        [questionId, sessionId]
      );
      if (answers.length === 0) {
        return res.status(404).json({ error: 'Question not found in this session.' });
      }

      const qRow = answers[0];

      console.log(`Evaluating answer to question: "${qRow.question}"`);
      const evalResult = await AIService.evaluateVoiceAnswer(qRow.question, answer, session.role);

      // Update question answer log
      await db.execute(
        `UPDATE interview_answers 
         SET user_answer = ?, feedback = ?, score = ?, suggested_answer = ? 
         WHERE id = ?`,
        [
          answer,
          evalResult.feedback,
          evalResult.score,
          evalResult.sampleAnswer || qRow.suggested_answer,
          questionId
        ]
      );

      return res.json({
        message: 'Answer evaluated successfully.',
        evaluation: {
          score: evalResult.score,
          communicationScore: evalResult.communicationScore,
          confidenceScore: evalResult.confidenceScore,
          technicalScore: evalResult.technicalScore,
          feedback: evalResult.feedback,
          strengths: evalResult.strengths,
          weaknesses: evalResult.weaknesses,
          sampleAnswer: evalResult.sampleAnswer
        }
      });
    } catch (err) {
      console.error('Submit answer evaluation error:', err);
      return res.status(500).json({ error: 'Failed to evaluate answer.' });
    }
  },

  /**
   * Complete the session and aggregate overall scores and feedback
   */
  async completeSession(req, res) {
    const sessionId = req.params.id;
    const userId = req.user.id;

    try {
      const sessions = await db.query('SELECT * FROM interview_sessions WHERE id = ?', [sessionId]);
      if (sessions.length === 0 || sessions[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized session.' });
      }

      // Fetch all evaluated answers for the session
      const answers = await db.query('SELECT * FROM interview_answers WHERE session_id = ?', [
        sessionId
      ]);

      let totalScore = 0;
      let count = 0;
      const strengths = new Set();
      const weaknesses = new Set();

      for (const ans of answers) {
        if (ans.user_answer) {
          totalScore += ans.score;
          count++;
          // Parse feedback or details (mock/simulated evaluations extract)
          if (ans.score >= 80) {
            strengths.add(`Strong response in ${ans.category}`);
          } else {
            weaknesses.add(`Focus on detail structuring in ${ans.category}`);
          }
        }
      }

      const overallScore = count > 0 ? Math.round(totalScore / count) : 70;

      // Calculate split components
      const commScore = Math.max(
        50,
        Math.min(98, overallScore - 2 + Math.round(Math.random() * 5))
      );
      const confScore = Math.max(
        50,
        Math.min(98, overallScore + 1 + Math.round(Math.random() * 3))
      );
      const techScore = Math.max(
        50,
        Math.min(98, overallScore - 1 + Math.round(Math.random() * 4))
      );

      const summaryFeedback = {
        overallDescription: `The interview session for ${sessions[0].role} was completed with an index score of ${overallScore}%. Delivery represents good fluency with opportunities for stronger keyword integration.`,
        strengths:
          Array.from(strengths).length > 0
            ? Array.from(strengths)
            : ['Direct answers', 'Fluency in descriptions'],
        weaknesses:
          Array.from(weaknesses).length > 0
            ? Array.from(weaknesses)
            : ['Lacks technical metrics', 'Structure elaboration'],
        recommendations: [
          'Incorporate exact framework keywords in technical questions.',
          'Adopt the STAR method for behavioral answers.',
          'Practice voice pacing to boost clarity indexes.'
        ]
      };

      // Update session row
      await db.execute(
        `UPDATE interview_sessions 
         SET status = 'completed', overall_score = ?, communication_score = ?, confidence_score = ?, technical_score = ?, feedback_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [overallScore, commScore, confScore, techScore, JSON.stringify(summaryFeedback), sessionId]
      );

      // Log event
      await db.execute(
        'INSERT INTO analytics (user_id, event_type, event_details_json) VALUES (?, ?, ?)',
        [userId, 'INTERVIEW_COMPLETE', JSON.stringify({ sessionId, score: overallScore })]
      );

      return res.json({
        message: 'Session completed.',
        report: {
          sessionId,
          role: sessions[0].role,
          overallScore,
          communicationScore: commScore,
          confidenceScore: confScore,
          technicalScore: techScore,
          summary: summaryFeedback,
          answers
        }
      });
    } catch (err) {
      console.error('Complete session error:', err);
      return res.status(500).json({ error: 'Failed to complete session.' });
    }
  },

  /**
   * Get all user interview sessions
   */
  async getSessions(req, res) {
    const userId = req.user.id;
    try {
      const sessions = await db.query(
        `SELECT id, role, status, overall_score, created_at 
         FROM interview_sessions 
         WHERE user_id = ? AND status = 'completed'
         ORDER BY created_at DESC`,
        [userId]
      );
      return res.json({ sessions });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve sessions.' });
    }
  },

  /**
   * Get specific session details for report downloads
   */
  async getSessionDetails(req, res) {
    const sessionId = req.params.id;
    const userId = req.user.id;

    try {
      const sessions = await db.query('SELECT * FROM interview_sessions WHERE id = ?', [sessionId]);
      if (sessions.length === 0 || (sessions[0].user_id !== userId && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'Unauthorized.' });
      }

      const answers = await db.query('SELECT * FROM interview_answers WHERE session_id = ?', [
        sessionId
      ]);

      return res.json({
        session: {
          id: sessions[0].id,
          role: sessions[0].role,
          status: sessions[0].status,
          overallScore: sessions[0].overall_score,
          communicationScore: sessions[0].communication_score,
          confidenceScore: sessions[0].confidence_score,
          technicalScore: sessions[0].technical_score,
          feedback: JSON.parse(sessions[0].feedback_json || '{}'),
          createdAt: sessions[0].created_at
        },
        answers
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load report details.' });
    }
  },

  /**
   * Get analytics dashboard stats
   */
  async getStats(req, res) {
    const userId = req.user.id;
    try {
      const sessions = await db.query(
        `SELECT overall_score, created_at 
         FROM interview_sessions 
         WHERE user_id = ? AND status = 'completed'
         ORDER BY created_at ASC`,
        [userId]
      );

      const total = sessions.length;
      const average =
        total > 0 ? Math.round(sessions.reduce((a, b) => a + b.overall_score, 0) / total) : 0;
      const best = total > 0 ? Math.max(...sessions.map((s) => s.overall_score)) : 0;

      // Group timeline data
      const timeline = sessions.map((s) => ({
        score: s.overall_score,
        date: new Date(s.created_at).toLocaleDateString()
      }));

      return res.json({
        stats: {
          totalInterviews: total,
          avgScore: average,
          bestScore: best,
          progress: timeline
        }
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve stats.' });
    }
  }
};

module.exports = VoiceController;
