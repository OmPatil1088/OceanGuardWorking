/**
 * Error Handler Middleware
 * Comprehensive error handling with proper status codes and logging
 */

const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = {
  /**
   * Main error handler middleware
   */
  handle: (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.code = err.code || 'INTERNAL_ERROR';

    // Wrong MongoDB ID error
    if (err.name === 'CastError') {
      const message = `Resource not found. Invalid: ${err.path}`;
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message,
          statusCode: 400
        }
      });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      const message = 'Invalid token';
      logger.warn('JWT validation failed:', { error: err.message });
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message,
          statusCode: 401
        }
      });
    }

    if (err.name === 'TokenExpiredError') {
      const message = 'Token has expired';
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message,
          statusCode: 401
        }
      });
    }

    // Database errors
    if (err.code === 'ER_DUP_ENTRY' || err.code === 23505) {
      const message = 'Duplicate entry found';
      logger.warn('Database duplicate entry:', { error: err.message });
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message,
          statusCode: 409
        }
      });
    }

    if (err.code === '42703') { // PostgreSQL invalid column
      const message = 'Invalid database operation';
      logger.error('Database error:', { error: err.message });
      return res.status(400).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message,
          statusCode: 400
        }
      });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
          statusCode: 400
        }
      });
    }

    // Default operational error
    if (err.isOperational) {
      logger.warn(`Operational error (${err.code}):`, { message: err.message });
      return res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          statusCode: err.statusCode
        }
      });
    }

    // Unexpected error
    logger.error('Unexpected error:', err);
    
    // Don't leak error details to client in production
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
          statusCode: 500
        }
      });
    }

    // Development: leak error details
    return res.status(err.statusCode || 500).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode || 500
      }
    });
  },

  /**
   * Async function wrapper to catch errors
   */
  asyncHandler: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  /**
   * Create application error
   */
  createError: (message, statusCode = 500, code = 'ERROR') => {
    return new AppError(message, statusCode, code);
  }
};

module.exports = errorHandler;
