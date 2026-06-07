const app = require('./app');
const db = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Initialize database pool and create tables if they do not exist
    await db.init();

    // Start Express listener
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  Career Intelligence Server Running on Port ${PORT} `);
      console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Database Adapter: ${db.type.toUpperCase()}`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Fatal: Server bootstrap failed to execute:', err);
    process.exit(1);
  }
}

bootstrap();
