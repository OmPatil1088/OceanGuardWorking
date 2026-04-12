/**
 * Database Configuration - MongoDB with Mongoose
 */

const mongoose = require('mongoose');
const logger = require('./middleware/logger');

class Database {
  constructor() {
    this.connection = null;
    this.isInitialized = false;
  }

  /**
   * Initialize MongoDB connection
   */
  async initialize() {
    try {
      const mongoUri = process.env.MONGO_URI;
      
      if (!mongoUri) {
        throw new Error('MONGO_URI environment variable not set');
      }

      // Connect to MongoDB
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
      });

      this.connection = mongoose.connection;
      this.isInitialized = true;

      logger.info('✅ MongoDB connected successfully!', {
        database: 'MongoDB Atlas'
      });

      return this.connection;
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (this.connection) {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
    }
  }

  /**
   * Not used for MongoDB (keep for compatibility)
   */
  /**
   * Not used for MongoDB (keep for compatibility)
   */
  async query(sql, params = []) {
    throw new Error('Use MongoDB models instead of raw queries');
  }

  /**
   * Not used for MongoDB
   */
  async transaction(callback) {
    throw new Error('Use Mongoose transactions instead');
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      connected: this.isInitialized,
      database: 'MongoDB Atlas'
    };
  }
}

module.exports = new Database();
