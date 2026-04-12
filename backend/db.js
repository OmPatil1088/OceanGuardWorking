/**
 * Database Configuration and Initialization
 * PostgreSQL connection pool management with migrations
 */

const { Pool } = require('pg');
const logger = require('./middleware/logger');
const fs = require('fs');
const path = require('path');

class Database {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'oceanguard',
        user: process.env.DB_USER || 'oceanguard',
        password: process.env.DB_PASSWORD || 'password',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_POOL_MAX || 100),
        min: parseInt(process.env.DB_POOL_MIN || 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        application_name: 'oceanguard-api'
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isInitialized = true;
      logger.info('Database pool initialized successfully', {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME
      });
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute query
   */
  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    try {
      const result = await this.pool.query(sql, params);
      return result;
    } catch (error) {
      logger.error('Database query failed:', {
        sql: sql.substring(0, 100),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute transaction
   */
  async transaction(callback) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    try {
      const migrationsDir = path.join(__dirname, 'migrations');

      if (!fs.existsSync(migrationsDir)) {
        logger.info('No migrations directory found');
        return;
      }

      // Create migrations table if not exists
      await this.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get list of executed migrations
      const result = await this.query('SELECT name FROM schema_migrations ORDER BY name');
      const executedMigrations = result.rows.map(row => row.name);

      // Get list of migration files
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      let migrationsRun = 0;

      // Execute pending migrations
      for (const file of migrationFiles) {
        if (executedMigrations.includes(file)) {
          logger.debug(`Migration already executed: ${file}`);
          continue;
        }

        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        try {
          await this.transaction(async (client) => {
            await client.query(sql);
            await client.query(
              'INSERT INTO schema_migrations (name) VALUES ($1)',
              [file]
            );
          });

          logger.info(`Migration executed: ${file}`);
          migrationsRun++;
        } catch (error) {
          logger.error(`Migration failed: ${file}`, error);
          throw error;
        }
      }

      if (migrationsRun === 0) {
        logger.info('All migrations already executed');
      } else {
        logger.info(`${migrationsRun} migrations executed successfully`);
      }
    } catch (error) {
      logger.error('Migration process failed:', error);
      throw error;
    }
  }

  /**
   * Get connection from pool
   */
  async getConnection() {
    return await this.pool.connect();
  }

  /**
   * Close database connection pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isInitialized = false;
      logger.info('Database connection pool closed');
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingRequests: this.pool.waitingCount
    };
  }
}

module.exports = new Database();
