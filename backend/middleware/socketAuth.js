/**
 * Socket.io Authentication Middleware
 * Handles JWT verification for WebSocket connections
 */

const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Verify JWT token for Socket.io
 */
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

/**
 * Socket.io authentication middleware
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('No authentication token provided'));
    }

    const user = await verifyToken(token);
    socket.user = user;
    socket.userId = user.id;
    socket.userRole = user.role;

    logger.debug(`Socket authenticated: ${user.id} (${user.role})`);
    next();
  } catch (error) {
    logger.warn('Socket authentication failed:', { error: error.message });
    next(new Error(`Authentication failed: ${error.message}`));
  }
};

/**
 * Check user role for Socket.io event
 */
const checkSocketRole = (...allowedRoles) => {
  return (socket, next) => {
    if (!allowedRoles.includes(socket.userRole)) {
      logger.warn(`Socket role check failed for ${socket.userId}`, {
        role: socket.userRole,
        allowed: allowedRoles
      });
      return next(new Error('Insufficient role'));
    }
    next();
  };
};

/**
 * Check permissions for Socket.io event
 */
const checkSocketPermissions = (...requiredPermissions) => {
  return (socket, next) => {
    const AUTH_PERMISSIONS = require('./auth').AUTH_PERMISSIONS;
    const userPermissions = AUTH_PERMISSIONS[socket.userRole] || [];

    // Super admin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    const hasPermission = requiredPermissions.some(perm =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      logger.warn(`Socket permission check failed for ${socket.userId}`, {
        role: socket.userRole,
        required: requiredPermissions
      });
      return next(new Error('Insufficient permissions'));
    }

    next();
  };
};

module.exports = {
  socketAuthMiddleware,
  checkSocketRole,
  checkSocketPermissions,
  verifyToken
};
