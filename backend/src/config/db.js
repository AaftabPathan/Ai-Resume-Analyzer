const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbType = process.env.USE_SQLITE === 'true' ? 'sqlite' : 'mysql';
let mysqlPool = null;
let sqliteDb = null;

// Unified database interface
const db = {
  type: dbType,
  query: null,
  execute: null,
  init: null
};

// Initialize SQLite
function initSqlite() {
  const dbPath = path.resolve(__dirname, '../../resume_analyzer.db');
  console.log(`Connecting to SQLite database at: ${dbPath}`);

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to open SQLite database:', err.message);
    }
  });

  db.query = (sql, params = []) => {
    // Convert MySQL style placeholders (?) to SQLite (if any differences, though standard ? works for both)
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  };

  db.execute = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({
          insertId: this.lastID,
          affectedRows: this.changes
        });
      });
    });
  };
}

// Initialize MySQL
async function initMysql() {
  console.log('Connecting to MySQL database...');
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_resume_analyzer',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Test connection
  try {
    const conn = await mysqlPool.getConnection();
    console.log('Successfully connected to MySQL database.');
    conn.release();

    db.query = async (sql, params = []) => {
      const [rows] = await mysqlPool.execute(sql, params);
      return rows;
    };

    db.execute = async (sql, params = []) => {
      const [result] = await mysqlPool.execute(sql, params);
      return {
        insertId: result.insertId,
        affectedRows: result.affectedRows
      };
    };
  } catch (err) {
    console.warn(`MySQL connection failed: ${err.message}. Falling back to SQLite...`);
    dbType = 'sqlite';
    db.type = 'sqlite';
    initSqlite();
  }
}

// Automated schema setup queries
const schemaQueries = [
  // users
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_verified INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // resumes
  `CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255),
    file_path TEXT,
    extracted_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // resume_versions
  `CREATE TABLE IF NOT EXISTS resume_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    resume_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // skills
  `CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    confidence_score INTEGER DEFAULT 100
  )`,

  // projects
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    technologies_used TEXT,
    url VARCHAR(255)
  )`,

  // certifications
  `CREATE TABLE IF NOT EXISTS certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    issuing_authority VARCHAR(255),
    issue_date VARCHAR(50),
    expiry_date VARCHAR(50)
  )`,

  // job_descriptions
  `CREATE TABLE IF NOT EXISTS job_descriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    description_text TEXT NOT NULL,
    required_skills TEXT,
    salary_range VARCHAR(100),
    location VARCHAR(255),
    type VARCHAR(50) DEFAULT 'remote'
  )`,

  // job_matches
  `CREATE TABLE IF NOT EXISTS job_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    match_score INTEGER DEFAULT 0,
    matching_details_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // ats_reports
  `CREATE TABLE IF NOT EXISTS ats_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    overall_score INTEGER DEFAULT 0,
    formatting_score INTEGER DEFAULT 0,
    skill_score INTEGER DEFAULT 0,
    keyword_score INTEGER DEFAULT 0,
    experience_score INTEGER DEFAULT 0,
    education_score INTEGER DEFAULT 0,
    project_score INTEGER DEFAULT 0,
    breakdown_json TEXT,
    weaknesses_json TEXT,
    missing_keywords_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // interview_questions
  `CREATE TABLE IF NOT EXISTS interview_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resume_id INTEGER,
    role VARCHAR(255),
    question_type VARCHAR(50),
    question TEXT NOT NULL,
    suggested_answer TEXT,
    user_notes TEXT,
    difficulty VARCHAR(50) DEFAULT 'Medium'
  )`,

  // cover_letters
  `CREATE TABLE IF NOT EXISTS cover_letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resume_id INTEGER,
    recipient_company VARCHAR(255),
    recipient_role VARCHAR(255),
    letter_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // recommendations
  `CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    link TEXT,
    match_percentage INTEGER DEFAULT 0,
    meta_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // interview_sessions
  `CREATE TABLE IF NOT EXISTS interview_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resume_id INTEGER,
    role VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    overall_score INTEGER DEFAULT 0,
    communication_score INTEGER DEFAULT 0,
    confidence_score INTEGER DEFAULT 0,
    technical_score INTEGER DEFAULT 0,
    feedback_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // interview_answers
  `CREATE TABLE IF NOT EXISTS interview_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    user_answer TEXT,
    suggested_answer TEXT,
    category VARCHAR(50) DEFAULT 'Technical',
    feedback TEXT,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // chatbot_conversations
  `CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // chatbot_messages
  `CREATE TABLE IF NOT EXISTS chatbot_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // career_recommendations
  `CREATE TABLE IF NOT EXISTS career_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    link TEXT,
    meta_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // analytics
  `CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_type VARCHAR(100) NOT NULL,
    event_details_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

// Clean MySQL-specific auto-increment and datatypes if running in SQLite
const cleanForSqlite = (query) => {
  return query;
};

// Clean SQLite-specific elements if running in MySQL
const cleanForMysql = (query) => {
  return query
    .replace('AUTOINCREMENT', 'AUTO_INCREMENT')
    .replace(/INTEGER PRIMARY KEY/g, 'INT PRIMARY KEY')
    .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    .replace(/TEXT/g, 'LONGTEXT'); // Avoid limit issues
};

db.init = async () => {
  if (dbType === 'mysql') {
    // Ensure database exists or create it
    try {
      const tempPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '3306', 10)
      });
      await tempPool.query(
        `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'ai_resume_analyzer'}\``
      );
      await tempPool.end();
    } catch (e) {
      console.warn('Could not auto-create database schema:', e.message);
    }

    await initMysql();
  } else {
    initSqlite();
  }

  // Run migrations
  console.log('Running database table initialization...');
  for (let query of schemaQueries) {
    try {
      const formattedQuery = dbType === 'sqlite' ? cleanForSqlite(query) : cleanForMysql(query);
      await db.execute(formattedQuery);
    } catch (err) {
      console.error(`Error initializing schema: ${err.message}`);
      console.error('Failed Query:', query);
    }
  }
  console.log('Database schema is fully initialized.');
};

module.exports = db;
