const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_resume_key_12345';

/**
 * Authenticate incoming requests with JWT
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ error: 'Session expired or invalid token. Please log in again.' });
    }
    req.user = user;
    next();
  });
}

/**
 * Restrict access to specific roles
 */
function requireRole(allowedRoles = []) {
  // Normalize single role to array
  const roles = typeof allowedRoles === 'string' ? [allowedRoles] : allowedRoles;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated. Access denied.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Unauthorized. Required role: [${roles.join(', ')}]. Current role: ${req.user.role}`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
