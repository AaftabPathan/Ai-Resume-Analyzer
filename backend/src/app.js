const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Route Imports
const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');
const atsRoutes = require('./routes/ats.routes');
const coachRoutes = require('./routes/coach.routes');
const adminRoutes = require('./routes/admin.routes');
const voiceRoutes = require('./routes/voice.routes');
const chatbotRoutes = require('./routes/chatbot.routes');

const app = express();

// Middlewares
app.use(helmet()); // Secure HTTP headers
app.use(
  cors({
    origin: '*', // Allow connections from any origin for API testing/showcase
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Dev request logger

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});
app.use('/api', limiter);

// Serve static uploaded files in safe mode (mock resumes or parsed ones)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/chat', chatbotRoutes);

// Root Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date(), version: '1.0.0' });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error occurred.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

module.exports = app;
