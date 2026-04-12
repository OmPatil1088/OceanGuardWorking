/**
 * Authentication Routes
 * Handles user registration, login, and token management
 */

const express = require('express');
const router = express.Router();
const { authenticate, generateToken } = require('../middleware/auth');
const errorHandler = require('../middleware/errorHandler');
const db = require('../db');
const logger = require('../middleware/logger');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', errorHandler.asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, role = 'public_user' } = req.body;

  // Validation
  if (!email || !password || !firstName) {
    throw errorHandler.createError('Missing required fields', 400, 'VALIDATION_ERROR');
  }

  // Check if user exists
  const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (result.rows.length > 0) {
    throw errorHandler.createError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  // Hash password
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 12));

  // Create user
  const insertResult = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, uuid, email, role, created_at`,
    [email, passwordHash, firstName, lastName || '', phone || '', role, true]
  );

  const user = insertResult.rows[0];

  // Generate tokens
  const accessToken = generateToken(user.id, role);
  const refreshToken = generateToken(user.id, role, process.env.JWT_REFRESH_EXPIRE);

  // Log audit
  await db.query(
    `INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    ['CREATE_USER', 'users', user.id, user.id, 'success', user.id]
  );

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
}));

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', errorHandler.asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw errorHandler.createError('Email and password required', 400, 'VALIDATION_ERROR');
  }

  // Find user
  const result = await db.query(
    'SELECT id, uuid, email, password_hash, role, is_active FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw errorHandler.createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const user = result.rows[0];

  // Check if user is active
  if (!user.is_active) {
    throw errorHandler.createError('Account is disabled', 403, 'ACCOUNT_DISABLED');
  }

  // Verify password
  const bcrypt = require('bcryptjs');
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    // Log failed attempt
    await db.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, status, request_ip, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['LOGIN_FAILED', 'users', user.id, 'failed', req.ip, 0]
    );

    throw errorHandler.createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Update last login
  await db.query(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, last_login_ip = $1 WHERE id = $2',
    [req.ip, user.id]
  );

  // Generate tokens
  const accessToken = generateToken(user.id, user.role);
  const refreshToken = generateToken(user.id, user.role, process.env.JWT_REFRESH_EXPIRE);

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', errorHandler.asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw errorHandler.createError('Refresh token required', 400, 'VALIDATION_ERROR');
  }

  try {
    const { authenticate: auth } = require('../middleware/auth');
    const decoded = auth.verifyToken(refreshToken);

    // Generate new access token
    const accessToken = generateToken(decoded.id, decoded.role);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: { accessToken }
    });
  } catch (error) {
    throw errorHandler.createError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }
}));

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout', authenticate, errorHandler.asyncHandler(async (req, res) => {
  logger.info(`User logged out: ${req.userId}`);

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', errorHandler.asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw errorHandler.createError('Email required', 400, 'VALIDATION_ERROR');
  }

  // Find user
  const result = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);

  // Always return success for privacy
  if (result.rows.length === 0) {
    return res.json({
      success: true,
      message: 'If email exists, password reset link sent'
    });
  }

  const user = result.rows[0];

  // Generate reset token
  const { generateToken: genToken } = require('../middleware/auth');
  const resetToken = genToken(user.id, 'reset_password', '1h');

  // TODO: Send reset email with token
  logger.info(`Password reset requested for: ${email}`);

  res.json({
    success: true,
    message: 'Password reset link sent to email'
  });
}));

/**
 * POST /api/auth/verify-email
 * Verify email address
 */
router.post('/verify-email', errorHandler.asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw errorHandler.createError('Verification token required', 400, 'VALIDATION_ERROR');
  }

  try {
    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(token);

    // Mark email as verified
    await db.query('UPDATE users SET is_verified = true WHERE id = $1', [decoded.id]);

    logger.info(`Email verified for user: ${decoded.id}`);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    throw errorHandler.createError('Invalid or expired verification token', 401, 'INVALID_TOKEN');
  }
}));

module.exports = router;
