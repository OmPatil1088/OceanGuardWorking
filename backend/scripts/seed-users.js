/**
 * Seed MongoDB with test users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const logger = require('./middleware/logger');

const testUsers = [
  {
    email: 'ompatil@hazardwatch.com',
    password: 'Om1@121204',
    firstName: 'Om',
    lastName: 'Patil',
    fullName: 'Om Patil',
    role: 'admin'
  },
  {
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    fullName: 'Admin User',
    role: 'admin'
  },
  {
    email: 'user@example.com',
    password: 'user123',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    role: 'user'
  },
  {
    email: 'john@example.com',
    password: 'john123',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    role: 'user'
  },
  {
    email: 'sarah@example.com',
    password: 'sarah123',
    firstName: 'Sarah',
    lastName: 'Smith',
    fullName: 'Sarah Smith',
    role: 'user'
  }
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not set in .env');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      family: 4
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing test users
    console.log('🧹 Clearing existing test users...');
    const testEmails = testUsers.map(u => u.email);
    await User.deleteMany({ email: { $in: testEmails } });

    // Create test users
    console.log('👤 Creating test users...');
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created: ${userData.email} (Role: ${userData.role})`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   ADMIN:');
    console.log('   - ompatil@hazardwatch.com / Om1@121204');
    console.log('   - admin@example.com / admin123');
    console.log('   USER:');
    console.log('   - user@example.com / user123');
    console.log('   - john@example.com / john123');
    console.log('   - sarah@example.com / sarah123');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
