/**
 * Add User Script
 * Creates a new user in the database with hashed password
 * Usage: node scripts/add-user.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'oceanguard',
  user: process.env.DB_USER || 'oceanguard',
  password: process.env.DB_PASSWORD || 'oceanguard_password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function addUser() {
  const client = await pool.connect();

  try {
    // User data to insert
    const email = 'ompatil@hazardwatch.com';
    const plainPassword = 'Om1@121204';
    const firstName = 'Om';
    const lastName = 'Patil';
    const role = 'officer'; // or 'public_user', 'admin', etc.

    // Hash the password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || 10);
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    console.log('📝 Creating user...');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   Role: ${role}`);

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.error('❌ User already exists with this email!');
      return;
    }

    // Insert user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, uuid, email, role, created_at`,
      [email, passwordHash, firstName, lastName, role, true, true]
    );

    const newUser = result.rows[0];
    console.log('\n✅ User created successfully!');
    console.log('\n📋 User Details:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   UUID: ${newUser.uuid}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Created At: ${newUser.created_at}`);
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${plainPassword}`);

  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    if (error.code === '23505') {
      console.error('   → User with this email already exists');
    }
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

addUser();
