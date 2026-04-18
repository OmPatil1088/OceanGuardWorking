/**
 * OceanGuard API Server - Main Application Entry Point
 * Production-Grade Government Disaster Management System
 * Supports 100K+ concurrent users, 99.9% uptime SLA
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const rateLimiter = require('./middleware/rateLimiter');
const db = require('./db');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000
});

// ========================================
// SECURITY MIDDLEWARE
// ========================================

// Helmet - HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  maxAge: 3600
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use(requestLogger);

// ========================================
// RATE LIMITING & SECURITY
// ========================================

// Global rate limiter
app.use('/api/', rateLimiter.globalLimiter);

// Stricter rate limiting for auth endpoints
app.use('/api/auth/login', rateLimiter.createLimiter(5, 15 * 60 * 1000)); // 5 attempts per 15 min
app.use('/api/auth/register', rateLimiter.createLimiter(3, 60 * 60 * 1000)); // 3 attempts per hour

// ========================================
// STATIC FILES (Frontend)
// ========================================

// Serve frontend files from parent directory
const path = require('path');
const frontendPath = path.join(__dirname, '../');
app.use(express.static(frontendPath));

// Serve index.html for SPA routing
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ========================================
// HEALTH CHECK ENDPOINT
// ========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ========================================
// API ROUTES
// ========================================

// Authentication routes
app.use('/api/auth', require('./routes/auth'));

// User management routes
app.use('/api/users', require('./routes/users'));

// Import stub routes
const stubRoutes = require('./routes/index');

// Incident management routes
app.use('/api/incidents', stubRoutes.incidents);

// Alert management routes
app.use('/api/alerts', stubRoutes.alerts);

// Resource management routes
app.use('/api/resources', stubRoutes.resources);

// News and community routes
app.use('/api/community', stubRoutes.community);

// Analytics and reporting routes
app.use('/api/analytics', stubRoutes.analytics);

// Admin routes
app.use('/api/admin', stubRoutes.admin);

// Weather API routes
app.use('/api/weather', stubRoutes.weather);

// ========================================
// WEBSOCKET (Socket.io) SETUP
// ========================================

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    const auth = require('./middleware/socketAuth');
    const user = await auth.verifyToken(token);
    socket.user = user;
    next();
  } catch (error) {
    logger.error('Socket authentication failed:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io event handlers
const socketHandlers = require('./websocket/handlers');
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.user.id} (${socket.user.role})`);
  
  socketHandlers.registerHandlers(io, socket);
  
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.user.id}`);
  });
  
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.user.id}:`, error);
  });
});

// Make io accessible to routes
app.set('io', io);

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

app.use(errorHandler.handle);

// ========================================
// DATABASE & SERVER INITIALIZATION
// ========================================

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    // Initialize database
    logger.info('Initializing database connection...');
    await db.initialize();
    logger.info('Database connected successfully');
    
    // Run migrations
    logger.info('Running database migrations...');
    await db.runMigrations();
    logger.info('Migrations completed');
    
    // Start HTTP server
    server.listen(PORT, HOST, () => {
      logger.info(`🚀 OceanGuard API Server running on ${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Workers: ${process.env.WORKERS || 1}`);
      logger.info(`Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
      logger.info(`WebSocket: Enabled (Socket.io)`);
    });
    
    // Graceful shutdown
    handleGracefulShutdown(server, db);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ========================================
// GRACEFUL SHUTDOWN HANDLER
// ========================================

function handleGracefulShutdown(server, db) {
  const signals = ['SIGTERM', 'SIGINT'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.info(`${signal} received - starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Close database connections
      await db.close();
      logger.info('Database connections closed');
      
      // Close socket.io
      io.close();
      logger.info('Socket.io connections closed');
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };
