/**
 * User Model - MongoDB/Mongoose
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false // Don't return password by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      default: '',
      trim: true
    },
    fullName: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'public_user'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastLogin: {
      type: Date,
      default: null
    },
    profilePicture: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

/**
 * Hash password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Set fullName if not provided
    if (!this.fullName) {
      this.fullName = `${this.firstName} ${this.lastName}`.trim();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password method
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Determine user role from email
 */
userSchema.pre('save', function(next) {
  if (!this.role || this.role === 'user') {
    // Auto-assign admin role based on email pattern
    if (this.email.includes('admin') || this.email.includes('ompatil')) {
      this.role = 'admin';
    } else {
      this.role = 'user';
    }
  }
  next();
});

/**
 * Return user info without sensitive data
 */
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
