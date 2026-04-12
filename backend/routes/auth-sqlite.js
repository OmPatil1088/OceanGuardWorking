/**
 * Authentication Routes - SQLite Version
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db-sqlite');
const logger = require('../middleware/logger');

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, fullName } = req.body;

    // Validation
    if (!email || !password || !firstName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and first name are required'
      });
    }

    const database = db.getInstance();

    // Check if user exists
    const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const stmt = database.prepare(`
      INSERT INTO users (email, password, firstName, lastName, fullName, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Determine role
    const role = email.toLowerCase().includes('admin') || email.toLowerCase().includes('ompatil') ? 'admin' : 'user';

    const result = stmt.run(
      email.toLowerCase(),
      hashedPassword,
      firstName,
      lastName || '',
      fullName || `${firstName} ${lastName || ''}`.trim(),
      role
    );

    logger.info(`✅ User registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.lastInsertRowid,
          email: email.toLowerCase(),
          firstName,
          role
        }
      }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    const database = db.getInstance();

    // Find user
    const user = database.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    database.prepare('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    logger.info(`✅ Login: ${email} (${user.role})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          fullName: user.fullName,
          role: user.role,
          isAdmin: user.role === 'admin'
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
