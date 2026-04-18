/**
 * Database Migration Reset Script
 * Drops all tables and re-runs migrations from scratch
 * Usage: npm run migrate:reset
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

async function resetDatabase() {
  const client = await pool.connect();

  try {
    console.log('⚠️  WARNING: This will drop all tables and reset the database!\n');
    console.log('🔄 Resetting database...\n');

    // Drop all existing tables (in reverse order of dependencies)
    const dropSql = `
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS system_config CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS push_tokens CASCADE;
      DROP TABLE IF EXISTS geographic_hierarchy CASCADE;
      DROP TABLE IF EXISTS incident_verification CASCADE;
      DROP TABLE IF EXISTS responses CASCADE;
      DROP TABLE IF EXISTS resources CASCADE;
      DROP TABLE IF EXISTS alerts CASCADE;
      DROP TABLE IF EXISTS incidents CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `;

    console.log('🗑️  Dropping existing tables...');
    await client.query(dropSql);
    console.log('✅ All tables dropped\n');

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📚 Re-running ${files.length} migrations...\n`);

    // Execute each migration
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        console.log(`▶️  Running: ${file}`);
        await client.query(sql);
        console.log(`✅ Completed: ${file}\n`);
      } catch (error) {
        console.error(`❌ Failed: ${file}`);
        console.error(`   Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('✅ Database reset and migrations completed successfully!');
    console.log('📋 Database is ready for fresh start.');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

resetDatabase();
