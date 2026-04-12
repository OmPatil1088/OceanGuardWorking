/**
 * Database Configuration - SQLite 
 * Local embedded database, no cloud required
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('./middleware/logger');

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Create or connect to SQLite database
      const dbPath = path.join(dataDir, 'oceanguard.db');
      this.db = new Database(dbPath);

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Create users table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          firstName TEXT NOT NULL,
          lastName TEXT,
          fullName TEXT,
          phone TEXT,
          role TEXT DEFAULT 'user',
          isActive INTEGER DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          lastLogin DATETIME,
          profilePicture TEXT
        )
      `);

      this.isInitialized = true;
      logger.info('✅ SQLite database ready:', dbPath);
      return this.db;
    } catch (error) {
      logger.error('❌ SQLite initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Get database instance
   */
  getInstance() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Close database
   */
  close() {
    if (this.db) {
      this.db.close();
      logger.info('SQLite closed');
    }
  }

  getStats() {
    return {
      connected: this.isInitialized,
      database: 'SQLite'
    };
  }
}

module.exports = new DatabaseConnection();
