/**
 * User Management Routes
 * Handles user profile, settings, and profile management
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize, authorizeRole } = require('../middleware/auth');
const errorHandler = require('../middleware/errorHandler');
const db = require('../db');
const logger = require('../middleware/logger');

/**
 * GET /api/users/:id
 * Get user profile
 */
router.get('/:id', authenticate, errorHandler.asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `SELECT id, uuid, email, phone, first_name, last_name, role, state_id, district_id, city,
            language, profile_image_url, bio, is_active, is_verified, created_at
     FROM users WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw errorHandler.createError('User not found', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * PUT /api/users/:id
 * Update user profile
 */
router.put('/:id', authenticate, errorHandler.asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, city, language, bio } = req.body;

  // Only allow users to update their own profile
  if (req.userId !== parseInt(id) && req.userRole !== 'super_admin') {
    throw errorHandler.createError('Unauthorized', 403, 'FORBIDDEN');
  }

  const result = await db.query(
    `UPDATE users 
     SET first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         phone = COALESCE($3, phone),
         city = COALESCE($4, city),
         language = COALESCE($5, language),
         bio = COALESCE($6, bio),
         updated_at = CURRENT_TIMESTAMP,
         updated_by = $7
     WHERE id = $8
     RETURNING id, uuid, email, first_name, last_name, role, updated_at`,
    [firstName, lastName, phone, city, language, bio, req.userId, id]
  );

  if (result.rows.length === 0) {
    throw errorHandler.createError('User not found', 404, 'NOT_FOUND');
  }

  logger.info(`User profile updated: ${id}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: result.rows[0]
  });
}));

/**
 * GET /api/users
 * List users (admin only)
 */
router.get('/', authenticate, authorizeRole('super_admin', 'state_controller', 'district_admin'),
  errorHandler.asyncHandler(async (req, res) => {
    const { role, state_id, district_id, limit = 20, offset = 0 } = req.query;

    let query = 'SELECT id, uuid, email, first_name, last_name, role, state_id, district_id, is_active, created_at FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (role) {
      query += ` AND role = $${paramCount++}`;
      params.push(role);
    }

    if (state_id && req.userRole !== 'super_admin') {
      query += ` AND state_id = $${paramCount++}`;
      params.push(state_id);
    }

    if (district_id) {
      query += ` AND district_id = $${paramCount++}`;
      params.push(district_id);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        users: result.rows,
        total: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  })
);

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', authenticate, authorizeRole('super_admin'),
  errorHandler.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw errorHandler.createError('User not found', 404, 'NOT_FOUND');
    }

    logger.info(`User deleted: ${id}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

/**
 * GET /api/users/:id/permissions
 * Get user permissions
 */
router.get('/:id/permissions', authenticate, errorHandler.asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    'SELECT role FROM users WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw errorHandler.createError('User not found', 404, 'NOT_FOUND');
  }

  const { AUTH_PERMISSIONS } = require('../middleware/auth');
  const userRole = result.rows[0].role;
  const permissions = AUTH_PERMISSIONS[userRole] || [];

  res.json({
    success: true,
    data: {
      role: userRole,
      permissions
    }
  });
}));

module.exports = router;
