/**
 * Database Migration Script
 * Executes all SQL migration files in order
 * Usage: npm run migrate
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'oceanguard',
  user: process.env.DB_USER || 'oceanguard',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('📚 Starting database migrations...\n');

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.warn('⚠️  No SQL migration files found');
      return;
    }

    console.log(`Found ${files.length} migration files:\n`);

    // Execute each migration
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        console.log(`▶️  Running: ${file}`);
        await client.query(sql);
        console.log(`✅ Completed: ${file}\n`);
      } catch (error) {
        // Check if error is about already existing (common for CREATE TABLE IF NOT EXISTS)
        if (error.code === '42P07' || error.message.includes('already exists')) {
          console.log(`ℹ️  Already exists: ${file} (skipped)\n`);
        } else {
          console.error(`❌ Failed: ${file}`);
          console.error(`   Error: ${error.message}\n`);
          throw error;
        }
      }
    }

    console.log('✅ All migrations completed successfully!');
    console.log('\n📋 Database is ready for use.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

runMigrations();
