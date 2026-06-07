const db = require('../config/db');
const AIService = require('../services/ai.service');

const ChatbotController = {
  /**
   * List all conversation threads for user
   */
  async getConversations(req, res) {
    const userId = req.user.id;
    try {
      const conversations = await db.query(
        'SELECT * FROM chatbot_conversations WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return res.json({ conversations });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve chat conversations.' });
    }
  },

  /**
   * Create a new conversation thread
   */
  async createConversation(req, res) {
    const userId = req.user.id;
    const { title } = req.body;
    const chatTitle = title || `Career Session - ${new Date().toLocaleDateString()}`;

    try {
      const result = await db.execute(
        'INSERT INTO chatbot_conversations (user_id, title) VALUES (?, ?)',
        [userId, chatTitle]
      );
      return res.status(201).json({
        message: 'Chat thread created.',
        conversationId: result.insertId,
        title: chatTitle
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create chat thread.' });
    }
  },

  /**
   * Get messages inside a thread
   */
  async getMessages(req, res) {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;

    try {
      // Validate owner
      const thread = await db.query('SELECT * FROM chatbot_conversations WHERE id = ?', [
        conversationId
      ]);
      if (thread.length === 0 || thread[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized.' });
      }

      const messages = await db.query(
        'SELECT * FROM chatbot_messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );

      return res.json({ messages });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve messages.' });
    }
  },

  /**
   * Send user message and get resume-aware AI feedback
   */
  async sendMessage(req, res) {
    const { conversationId, message, resumeId } = req.body;
    const userId = req.user.id;

    if (!conversationId || !message) {
      return res.status(400).json({ error: 'Conversation ID and Message are required.' });
    }

    try {
      // Validate owner
      const thread = await db.query('SELECT * FROM chatbot_conversations WHERE id = ?', [
        conversationId
      ]);
      if (thread.length === 0 || thread[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized.' });
      }

      // 1. Fetch resume context if provided
      let resumeJson = null;
      let atsReport = null;

      let targetResumeId = resumeId;
      if (!targetResumeId) {
        // Fallback to latest resume uploaded by user
        const latestResume = await db.query(
          'SELECT id FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
          [userId]
        );
        if (latestResume.length > 0) {
          targetResumeId = latestResume[0].id;
        }
      }

      if (targetResumeId) {
        const versions = await db.query(
          'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1',
          [targetResumeId]
        );
        if (versions.length > 0) {
          resumeJson = JSON.parse(versions[0].resume_json);
        }

        const reports = await db.query(
          'SELECT * FROM ats_reports WHERE resume_id = ? ORDER BY created_at DESC LIMIT 1',
          [targetResumeId]
        );
        if (reports.length > 0) {
          atsReport = {
            score: reports[0].overall_score,
            weaknesses: JSON.parse(reports[0].weaknesses_json || '[]'),
            missingKeywords: JSON.parse(reports[0].missing_keywords_json || '[]')
          };
        }
      }

      // 2. Fetch history (limit last 10 messages to save context token budget)
      const historyRows = await db.query(
        `SELECT sender, message_text 
         FROM chatbot_messages 
         WHERE conversation_id = ? 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [conversationId]
      );

      const history = historyRows.reverse().map((h) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        text: h.message_text
      }));

      // 3. Save User Message
      await db.execute(
        "INSERT INTO chatbot_messages (conversation_id, sender, message_text) VALUES (?, 'user', ?)",
        [conversationId, message]
      );

      // 4. Generate AI reply
      console.log(`Querying AI Career Mentor for thread ID: ${conversationId}`);
      const chatResponse = await AIService.generateChatResponse(
        history,
        message,
        resumeJson,
        atsReport
      );
      const aiReply = chatResponse.replyText;

      // 5. Save AI Message
      await db.execute(
        "INSERT INTO chatbot_messages (conversation_id, sender, message_text) VALUES (?, 'ai', ?)",
        [conversationId, aiReply]
      );

      // Log event
      await db.execute(
        'INSERT INTO analytics (user_id, event_type, event_details_json) VALUES (?, ?, ?)',
        [userId, 'CHAT_MESSAGE', JSON.stringify({ conversationId })]
      );

      return res.json({
        sender: 'ai',
        messageText: aiReply
      });
    } catch (err) {
      console.error('SendMessage error:', err);
      return res.status(500).json({ error: 'Failed to generate chatbot response.' });
    }
  },

  /**
   * Generate 30/60/90 learning roadmap
   */
  async generateRoadmap(req, res) {
    const { resumeId, targetRole, span } = req.body;
    const userId = req.user.id;

    if (!targetRole || !span) {
      return res.status(400).json({ error: 'Target role and span (30/60/90) are required.' });
    }

    try {
      let resumeJson = null;
      let targetResumeId = resumeId;
      if (!targetResumeId) {
        // Fallback to latest resume uploaded by user
        const latestResume = await db.query(
          'SELECT id FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
          [userId]
        );
        if (latestResume.length > 0) {
          targetResumeId = latestResume[0].id;
        }
      }

      if (targetResumeId) {
        const versions = await db.query(
          'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1',
          [targetResumeId]
        );
        if (versions.length > 0) {
          resumeJson = JSON.parse(versions[0].resume_json);
        }
      }

      console.log(`Generating AI Roadmap for target role: ${targetRole}, span: ${span} days`);
      const roadmap = await AIService.generateCustomRoadmap(resumeJson, targetRole, span);

      // Save recommendation in database (career_recommendations table)
      await db.execute(
        `INSERT INTO career_recommendations (user_id, type, title, description, meta_json) 
         VALUES (?, 'roadmap', ?, ?, ?)`,
        [
          userId,
          `${span}-Day Roadmap for ${targetRole}`,
          roadmap.description || '',
          JSON.stringify(roadmap)
        ]
      );

      return res.json({ roadmap });
    } catch (err) {
      console.error('Generate roadmap error:', err);
      return res.status(500).json({ error: 'Failed to generate custom learning roadmap.' });
    }
  }
};

module.exports = ChatbotController;
