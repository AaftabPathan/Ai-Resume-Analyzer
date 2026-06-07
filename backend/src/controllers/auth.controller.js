const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_resume_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_12345';

// Helper to generate JWT tokens
function generateTokens(user) {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

const AuthController = {
  /**
   * Register a new user
   */
  async register(req, res) {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password.' });
    }

    // Role validation
    const userRole =
      role && ['user', 'recruiter', 'admin'].includes(role.toLowerCase())
        ? role.toLowerCase()
        : 'user';

    try {
      // Check if user already exists
      const existing = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert user
      const result = await db.execute(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, passwordHash, userRole]
      );

      const userId = result.insertId;

      // Log an analytics event
      await db.execute(
        'INSERT INTO analytics (user_id, event_type, event_details_json) VALUES (?, ?, ?)',
        [userId, 'USER_REGISTER', JSON.stringify({ email, role: userRole })]
      );

      const user = { id: userId, name, email, role: userRole };
      const tokens = generateTokens(user);

      return res.status(201).json({
        message: 'Registration successful.',
        user,
        ...tokens
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Database error occurred during registration.' });
    }
  },

  /**
   * Login user
   */
  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
      const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = users[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Generate tokens
      const tokens = generateTokens(user);

      // Log analytics event
      await db.execute(
        'INSERT INTO analytics (user_id, event_type, event_details_json) VALUES (?, ?, ?)',
        [user.id, 'USER_LOGIN', JSON.stringify({ email: user.email, role: user.role })]
      );

      return res.json({
        message: 'Login successful.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatar_url
        },
        ...tokens
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Database error occurred during login.' });
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    try {
      jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: 'Invalid or expired refresh token.' });
        }

        const user = {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role
        };

        const tokens = generateTokens(user);
        return res.json({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        });
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to refresh token.' });
    }
  },

  /**
   * Forgot password flow
   */
  async forgotPassword(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    try {
      const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        // Return success message to prevent user enumeration
        return res.json({
          message: 'If this email exists in our records, a reset link will be sent shortly.'
        });
      }

      // Simulated mail token
      return res.json({
        message: 'If this email exists in our records, a reset link will be sent shortly.',
        devToken: 'mock-reset-token-12345' // Included for developer ease in testing
      });
    } catch (err) {
      return res.status(500).json({ error: 'Error processing password reset request.' });
    }
  },

  /**
   * Mock OAuth Logins (Google, GitHub, LinkedIn)
   */
  async oauthLogin(req, res) {
    const { provider, email, name, avatarUrl } = req.body;

    if (!provider || !email || !name) {
      return res.status(400).json({ error: 'OAuth login requires provider, email, and name.' });
    }

    try {
      // Find or create user
      let users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      let user;

      if (users.length === 0) {
        // Create user with randomized password hash (user won't log in via password)
        const dummyPass = await bcrypt.hash(Math.random().toString(36), 10);
        const result = await db.execute(
          'INSERT INTO users (name, email, password_hash, role, avatar_url, is_verified) VALUES (?, ?, ?, ?, ?, 1)',
          [name, email, dummyPass, 'user', avatarUrl || null]
        );
        user = {
          id: result.insertId,
          name,
          email,
          role: 'user',
          avatar_url: avatarUrl || null
        };
      } else {
        user = users[0];
      }

      const tokens = generateTokens(user);

      // Log event
      await db.execute(
        'INSERT INTO analytics (user_id, event_type, event_details_json) VALUES (?, ?, ?)',
        [user.id, `OAUTH_LOGIN_${provider.toUpperCase()}`, JSON.stringify({ email: user.email })]
      );

      return res.json({
        message: `Successfully authenticated via ${provider}`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatar_url
        },
        ...tokens
      });
    } catch (err) {
      console.error('OAuth login error:', err);
      return res.status(500).json({ error: 'Failed to process OAuth login.' });
    }
  }
};

module.exports = AuthController;
