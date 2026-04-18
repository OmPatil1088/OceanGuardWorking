/**
 * Database Connection Test Script
 * Verifies database connectivity and basic operations
 * Usage: npm run db:test
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'oceanguard',
  user: process.env.DB_USER || 'oceanguard',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function testDatabase() {
  try {
    console.log('🔍 Testing Database Connection...\n');

    console.log('📋 Configuration:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   Database: ${process.env.DB_NAME || 'oceanguard'}`);
    console.log(`   User: ${process.env.DB_USER || 'oceanguard'}`);
    console.log(`   SSL: ${process.env.DB_SSL === 'true' ? 'Yes' : 'No'}\n`);

    // Test connection
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!\n');

    // Test basic query
    console.log('⚙️  Running test query...');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query successful!');
    console.log(`   Server Time: ${result.rows[0].now}\n`);

    // Check tables
    console.log('📊 Checking tables:');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tables.rows.length === 0) {
      console.log('   ⚠️  No tables found (run migrate first)');
    } else {
      console.log(`   Found ${tables.rows.length} tables:`);
      tables.rows.forEach(row => {
        console.log(`     • ${row.table_name}`);
      });
    }

    console.log(`\n   Count of users: `);
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`     ${userCount.rows[0].count} user(s)\n`);

    client.release();

    console.log('✅ All database tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Database test failed!');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}\n`);

    if (error.code === '28P01') {
      console.error('   💡 Hint: Password authentication failed');
      console.error('      Check DB_PASSWORD in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Hint: Cannot connect to database');
      console.error('      Make sure PostgreSQL is running (docker-compose up -d)');
    }

    process.exit(1);
  }
}

testDatabase();
