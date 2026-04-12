/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const logger = require('./logger');
const errorHandler = require('./errorHandler');

const AUTH_ROLES = {
  SUPER_ADMIN: 'super_admin',
  STATE_CONTROLLER: 'state_controller',
  DISTRICT_ADMIN: 'district_admin',
  OFFICER: 'officer',
  RESPONDER: 'responder',
  PUBLIC_USER: 'public_user',
  GUEST: 'guest'
};

const AUTH_PERMISSIONS = {
  super_admin: ['*'], // All permissions
  state_controller: [
    'manage:districts',
    'manage:users',
    'view:analytics',
    'manage:alerts',
    'manage:resources'
  ],
  district_admin: [
    'manage:incidents',
    'manage:users:district',
    'view:analytics:district',
    'manage:alerts',
    'manage:resources:district'
  ],
  officer: [
    'create:incidents',
    'update:incidents:own',
    'view:incidents',
    'manage:resources:own'
  ],
  responder: [
    'view:incidents',
    'update:incidents:own',
    'manage:responses'
  ],
  public_user: [
    'create:incidents',
    'view:incidents:public',
    'view:alerts',
    'manage:profile'
  ],
  guest: [
    'view:incidents:public',
    'view:alerts:public'
  ]
};

/**
 * Verify JWT Token
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw errorHandler.createError('Token has expired', 401, 'TOKEN_EXPIRED');
    }
    throw errorHandler.createError('Invalid token', 401, 'INVALID_TOKEN');
  }
};

/**
 * Authenticate user from JWT token
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw errorHandler.createError(
        'No token provided',
        401,
        'NO_TOKEN'
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Attach user to request
    req.user = decoded;
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.isAuthenticated = true;

    logger.debug(`User authenticated: ${decoded.id} (${decoded.role})`);
    next();
  } catch (error) {
    logger.warn('Authentication failed:', { error: error.message });
    next(error);
  }
};

/**
 * Authorize user based on role and permissions
 */
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.isAuthenticated) {
        throw errorHandler.createError(
          'Authentication required',
          401,
          'NOT_AUTHENTICATED'
        );
      }

      const userRole = req.userRole;
      const userPermissions = AUTH_PERMISSIONS[userRole] || [];

      // Super admin has all permissions
      if (userPermissions.includes('*')) {
        return next();
      }

      // Check if user has required permissions
      const hasPermission = requiredPermissions.some(permission =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        logger.warn(`Authorization failed for user ${req.userId}`, {
          userRole,
          requiredPermissions,
          method: req.method,
          url: req.originalUrl
        });

        throw errorHandler.createError(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
          403,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Authorize by role
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.isAuthenticated) {
        throw errorHandler.createError(
          'Authentication required',
          401,
          'NOT_AUTHENTICATED'
        );
      }

      if (!allowedRoles.includes(req.userRole)) {
        logger.warn(`Role authorization failed for user ${req.userId}`, {
          userRole: req.userRole,
          allowedRoles,
          method: req.method,
          url: req.originalUrl
        });

        throw errorHandler.createError(
          `This action requires one of these roles: ${allowedRoles.join(', ')}`,
          403,
          'INSUFFICIENT_ROLE'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication (doesn't fail if no token, just sets user)
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = decoded;
      req.userId = decoded.id;
      req.userRole = decoded.role;
      req.isAuthenticated = true;
    } else {
      req.isAuthenticated = false;
    }

    next();
  } catch (error) {
    // Continue anyway - optional auth
    req.isAuthenticated = false;
    next();
  }
};

/**
 * Check resource ownership
 */
const checkOwnership = (req, res, next) => {
  try {
    if (!req.isAuthenticated) {
      throw errorHandler.createError(
        'Authentication required',
        401,
        'NOT_AUTHENTICATED'
      );
    }

    // You can extend this based on your specific resource structure
    const resourceUserId = req.body?.userId || req.params?.userId;

    if (resourceUserId && req.userId !== resourceUserId && req.userRole !== AUTH_ROLES.SUPER_ADMIN) {
      throw errorHandler.createError(
        'You do not have permission to access this resource',
        403,
        'OWNERSHIP_DENIED'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Generate JWT Token
 */
const generateToken = (userId, role, expiresIn = process.env.JWT_EXPIRE || '24h') => {
  return jwt.sign(
    {
      id: userId,
      role,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

module.exports = {
  authenticate,
  authorize,
  authorizeRole,
  optionalAuth,
  checkOwnership,
  verifyToken,
  generateToken,
  AUTH_ROLES,
  AUTH_PERMISSIONS
};
