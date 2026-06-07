const db = require('../config/db');

const AdminController = {
  /**
   * Get global system stats for the Admin dashboard
   */
  async getSystemStats(req, res) {
    try {
      const userCount = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
      const recruiterCount = await db.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'recruiter'"
      );
      const adminCount = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
      const resumeCount = await db.query('SELECT COUNT(*) as count FROM resumes');
      const atsReportCount = await db.query('SELECT COUNT(*) as count FROM ats_reports');

      const avgATS = await db.query('SELECT AVG(overall_score) as avgScore FROM ats_reports');
      const avgScore = avgATS[0].avgScore ? Math.round(avgATS[0].avgScore) : 78; // Default mock average if empty

      // AI Request Monitor: Count analytics entries related to AI events
      const aiRequestCount = await db.query(
        "SELECT COUNT(*) as count FROM analytics WHERE event_type IN ('ATS_EVALUATION', 'RESUME_UPLOAD')"
      );

      // Latest uploads list
      const latestUploads = await db.query(
        `SELECT r.id, r.title, r.created_at, u.name as user_name, u.email as user_email
         FROM resumes r
         JOIN users u ON r.user_id = u.id
         ORDER BY r.created_at DESC
         LIMIT 5`
      );

      return res.json({
        stats: {
          users: userCount[0].count,
          recruiters: recruiterCount[0].count,
          admins: adminCount[0].count,
          resumes: resumeCount[0].count,
          reports: atsReportCount[0].count,
          averageAtsScore: avgScore,
          aiRequests: aiRequestCount[0].count
        },
        latestUploads
      });
    } catch (err) {
      console.error('Admin stats error:', err);
      return res.status(500).json({ error: 'Failed to retrieve system statistics.' });
    }
  },

  /**
   * List all users
   */
  async listUsers(req, res) {
    try {
      const users = await db.query(
        `SELECT id, name, email, role, is_verified, created_at, avatar_url 
         FROM users 
         ORDER BY id ASC`
      );
      return res.json({ users });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve users.' });
    }
  },

  /**
   * Update role of a specific user
   */
  async updateUserRole(req, res) {
    const userId = req.params.id;
    const { role } = req.body;

    if (!role || !['user', 'recruiter', 'admin'].includes(role.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid role assignment.' });
    }

    try {
      // Prevent removing the last admin
      if (role.toLowerCase() !== 'admin') {
        const adminCheck = await db.query(
          "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
        );
        const targetUser = await db.query('SELECT role FROM users WHERE id = ?', [userId]);

        if (targetUser.length > 0 && targetUser[0].role === 'admin' && adminCheck[0].count <= 1) {
          return res.status(400).json({ error: 'Cannot demote the last system administrator.' });
        }
      }

      await db.execute('UPDATE users SET role = ? WHERE id = ?', [role.toLowerCase(), userId]);

      return res.json({ message: 'User role updated successfully.' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update user role.' });
    }
  },

  /**
   * Delete a user profile (Admin execution)
   */
  async deleteUser(req, res) {
    const userId = req.params.id;

    try {
      // Check admin count if target user is admin
      const targetUser = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
      if (targetUser.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (targetUser[0].role === 'admin') {
        const adminCheck = await db.query(
          "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
        );
        if (adminCheck[0].count <= 1) {
          return res.status(400).json({ error: 'Cannot delete the last system administrator.' });
        }
      }

      // Find user resumes
      const userResumes = await db.query('SELECT id, file_path FROM resumes WHERE user_id = ?', [
        userId
      ]);

      // Delete associated resumes, versions, matching data
      for (const res of userResumes) {
        await db.execute('DELETE FROM resume_versions WHERE resume_id = ?', [res.id]);
        await db.execute('DELETE FROM projects WHERE resume_id = ?', [res.id]);
        await db.execute('DELETE FROM certifications WHERE resume_id = ?', [res.id]);
        await db.execute('DELETE FROM ats_reports WHERE resume_id = ?', [res.id]);
        await db.execute('DELETE FROM job_matches WHERE resume_id = ?', [res.id]);
        await db.execute('DELETE FROM resumes WHERE id = ?', [res.id]);
      }

      await db.execute('DELETE FROM skills WHERE user_id = ?', [userId]);
      await db.execute('DELETE FROM interview_questions WHERE user_id = ?', [userId]);
      await db.execute('DELETE FROM cover_letters WHERE user_id = ?', [userId]);
      await db.execute('DELETE FROM recommendations WHERE user_id = ?', [userId]);
      await db.execute('DELETE FROM analytics WHERE user_id = ?', [userId]);
      await db.execute('DELETE FROM users WHERE id = ?', [userId]);

      return res.json({ message: 'User and all related assets have been pruned from the system.' });
    } catch (err) {
      console.error('Delete user error:', err);
      return res.status(500).json({ error: 'Failed to delete user.' });
    }
  }
};

module.exports = AdminController;
