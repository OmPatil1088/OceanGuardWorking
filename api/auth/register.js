import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { MONGO_URI } = process.env;

// Mongoose connection caching (important for serverless environments)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connect() {
  if (!MONGO_URI) {
    throw new Error('Missing MONGO_URI environment variable');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      family: 4
    }).then((mongoose) => {
      return mongoose.connection;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Define User schema if not already defined
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  firstName: { type: String, required: true },
  lastName: { type: String, default: '' },
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  profilePicture: { type: String, default: '' }
});

// Get or create model
let User;
try {
  User = mongoose.model('User');
} catch {
  User = mongoose.model('User', userSchema);
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, firstName, lastName, fullName } = req.body || {};

    // Validate required fields
    if (!email || !password || !firstName) {
      return res.status(400).json({ 
        error: 'Email, password, and first name are required' 
      });
    }

    // Connect to MongoDB
    await connect();

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ 
        success: false,
        error: 'User already exists',
        message: 'This email is already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Detect admin role from email
    const role = (email.includes('admin') || email.includes('ompatil')) ? 'admin' : 'user';

    // Create user
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName: lastName || '',
      fullName: fullName || `${firstName} ${lastName || ''}`.trim(),
      role,
      isActive: true,
      createdAt: new Date()
    });

    await newUser.save();

    // Return response in expected format
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          fullName: newUser.fullName,
          role: newUser.role,
          isAdmin: newUser.role === 'admin',
          message: 'Registration successful! Please log in.'
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message || 'Server error' 
    });
  }
}
