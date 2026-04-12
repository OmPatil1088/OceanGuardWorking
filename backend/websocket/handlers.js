/**
 * WebSocket Event Handlers - Real-time Communication
 * Handles incident updates, alerts, and community notifications
 */

const logger = require('../middleware/logger');

/**
 * Register all WebSocket event handlers for a connected socket
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Individual socket connection
 */
function registerHandlers(io, socket) {
  const userId = socket.user?.id;
  const userRole = socket.user?.role;

  // Store user info in socket data
  socket.data.userId = userId;
  socket.data.userRole = userRole;

  // ========================================
  // INCIDENT EVENTS
  // ========================================

  /**
   * New incident reported
   */
  socket.on('incident:report', (data) => {
    try {
      logger.info(`New incident reported by ${userId}:`, data);
      
      const incident = {
        id: `INC-${Date.now()}`,
        ...data,
        reportedBy: userId,
        timestamp: new Date().toISOString(),
        status: 'active'
      };

      // Broadcast to all connected users
      io.emit('incident:new', incident);
      
      // Log the incident
      logger.info(`Incident ${incident.id} broadcasted to all users`);
    } catch (error) {
      logger.error('Error handling incident:report:', error);
      socket.emit('error', { message: 'Failed to report incident' });
    }
  });

  /**
   * Incident status update
   */
  socket.on('incident:update', (data) => {
    try {
      logger.info(`Incident ${data.incidentId} updated by ${userId}`);
      
      // Broadcast to all users
      io.emit('incident:updated', {
        incidentId: data.incidentId,
        status: data.status,
        updates: data.updates,
        updatedBy: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error handling incident:update:', error);
      socket.emit('error', { message: 'Failed to update incident' });
    }
  });

  /**
   * Incident resolved
   */
  socket.on('incident:resolve', (data) => {
    try {
      logger.info(`Incident ${data.incidentId} resolved by ${userId}`);
      
      io.emit('incident:resolved', {
        incidentId: data.incidentId,
        resolvedBy: userId,
        resolution: data.resolution,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error handling incident:resolve:', error);
      socket.emit('error', { message: 'Failed to resolve incident' });
    }
  });

  // ========================================
  // ALERT EVENTS
  // ========================================

  /**
   * Send alert to specific users or all users
   */
  socket.on('alert:send', (data) => {
    try {
      if (userRole !== 'admin' && userRole !== 'moderator') {
        socket.emit('error', { message: 'Insufficient permissions to send alerts' });
        return;
      }

      logger.info(`Alert sent by ${userId}:`, data.message);
      
      const alert = {
        id: `ALERT-${Date.now()}`,
        ...data,
        sentBy: userId,
        timestamp: new Date().toISOString()
      };

      // Send to specific users or broadcast
      if (data.targetUsers && data.targetUsers.length > 0) {
        data.targetUsers.forEach(targetUserId => {
          io.to(`user:${targetUserId}`).emit('alert:received', alert);
        });
      } else {
        // Broadcast to all users
        io.emit('alert:received', alert);
      }

      logger.info(`Alert ${alert.id} sent successfully`);
    } catch (error) {
      logger.error('Error handling alert:send:', error);
      socket.emit('error', { message: 'Failed to send alert' });
    }
  });

  // ========================================
  // COMMUNITY EVENTS
  // ========================================

  /**
   * User votes on incident (verify/unverify)
   */
  socket.on('community:vote', (data) => {
    try {
      logger.info(`User ${userId} voted on incident ${data.incidentId}: ${data.voteType}`);
      
      io.emit('community:voted', {
        incidentId: data.incidentId,
        voteType: data.voteType,
        userId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error handling community:vote:', error);
      socket.emit('error', { message: 'Failed to record vote' });
    }
  });

  /**
   * User posts comment on incident
   */
  socket.on('community:comment', (data) => {
    try {
      logger.info(`User ${userId} commented on incident ${data.incidentId}`);
      
      const comment = {
        id: `COMMENT-${Date.now()}`,
        incidentId: data.incidentId,
        author: userId,
        text: data.text,
        timestamp: new Date().toISOString()
      };

      io.emit('community:commented', comment);
    } catch (error) {
      logger.error('Error handling community:comment:', error);
      socket.emit('error', { message: 'Failed to post comment' });
    }
  });

  /**
   * Report false incident
   */
  socket.on('community:report-false', (data) => {
    try {
      logger.info(`User ${userId} reported incident ${data.incidentId} as false`);
      
      io.emit('community:false-reported', {
        incidentId: data.incidentId,
        reportedBy: userId,
        reason: data.reason,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error handling community:report-false:', error);
      socket.emit('error', { message: 'Failed to report false incident' });
    }
  });

  // ========================================
  // NOTIFICATION EVENTS
  // ========================================

  /**
   * Send notification to specific user
   */
  socket.on('notification:send', (data) => {
    try {
      logger.info(`Notification sent to user ${data.targetUserId} by ${userId}`);
      
      const notification = {
        id: `NOTIF-${Date.now()}`,
        ...data,
        sentBy: userId,
        timestamp: new Date().toISOString()
      };

      io.to(`user:${data.targetUserId}`).emit('notification:received', notification);
    } catch (error) {
      logger.error('Error handling notification:send:', error);
      socket.emit('error', { message: 'Failed to send notification' });
    }
  });

  // ========================================
  // ROOM MANAGEMENT
  // ========================================

  /**
   * Join incident room for real-time updates
   */
  socket.on('incident:join', (incidentId) => {
    try {
      socket.join(`incident:${incidentId}`);
      logger.info(`User ${userId} joined incident room: ${incidentId}`);
      
      // Notify others in the room
      io.to(`incident:${incidentId}`).emit('incident:user-joined', {
        userId: userId,
        incidentId: incidentId
      });
    } catch (error) {
      logger.error('Error joining incident room:', error);
    }
  });

  /**
   * Leave incident room
   */
  socket.on('incident:leave', (incidentId) => {
    try {
      socket.leave(`incident:${incidentId}`);
      logger.info(`User ${userId} left incident room: ${incidentId}`);
      
      io.to(`incident:${incidentId}`).emit('incident:user-left', {
        userId: userId,
        incidentId: incidentId
      });
    } catch (error) {
      logger.error('Error leaving incident room:', error);
    }
  });

  /**
   * Join user room for personal notifications
   */
  socket.on('user:join-room', () => {
    try {
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined personal notification room`);
    } catch (error) {
      logger.error('Error joining user room:', error);
    }
  });

  // ========================================
  // LOCATION/MAP EVENTS
  // ========================================

  /**
   * Broadcast live location
   */
  socket.on('location:update', (data) => {
    try {
      // Only broadcast to authorized users (e.g., responders, admins)
      if (['responder', 'admin', 'coordinator'].includes(userRole)) {
        io.emit('location:updated', {
          userId: userId,
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Error handling location:update:', error);
    }
  });

  // ========================================
  // HEALTH CHECK
  // ========================================

  /**
   * Ping/Pong for connection health
   */
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });

  // ========================================
  // DISCONNECT HANDLER
  // ========================================

  socket.on('error', (error) => {
    logger.error(`Socket error for user ${userId}:`, error);
  });
}

module.exports = {
  registerHandlers
};
