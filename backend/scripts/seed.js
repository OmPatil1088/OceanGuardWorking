/**
 * Database Seed Script
 * Populates database with initial test data
 * Usage: npm run seed
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'oceanguard',
  user: process.env.DB_USER || 'oceanguard',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding database with test data...\n');

    // Sample users
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || 10);
    const adminPassword = await bcrypt.hash('Admin@12345', saltRounds);
    const userPassword = await bcrypt.hash('User@12345', saltRounds);

    const users = [
      {
        email: 'admin@hazardwatch.com',
        password_hash: adminPassword,
        first_name: 'Admin',
        last_name: 'Officer',
        role: 'super_admin',
        is_active: true,
        is_verified: true,
      },
      {
        email: 'officer@hazardwatch.com',
        password_hash: userPassword,
        first_name: 'Response',
        last_name: 'Officer',
        role: 'officer',
        is_active: true,
        is_verified: true,
      },
    ];

    console.log('👥 Adding seed users...');
    for (const user of users) {
      try {
        await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, is_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (email) DO NOTHING`,
          [
            user.email,
            user.password_hash,
            user.first_name,
            user.last_name,
            user.role,
            user.is_active,
            user.is_verified,
          ]
        );
        console.log(`   ✅ ${user.email}`);
      } catch (error) {
        if (error.code !== '23505') { // Ignore duplicate key errors
          throw error;
        }
      }
    }

    console.log('\n✅ Database seeding completed!');
    console.log('\n📋 Test Credentials:');
    console.log('   Admin User:');
    console.log('     Email: admin@hazardwatch.com');
    console.log('     Password: Admin@12345');
    console.log('\n   Regular Officer:');
    console.log('     Email: officer@hazardwatch.com');
    console.log('     Password: User@12345');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

seedDatabase();
