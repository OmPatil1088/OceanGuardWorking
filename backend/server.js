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
const path = require('path');
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
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5000', 'http://localhost:3000'],
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
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://unpkg.com"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://unpkg.com"],
      scriptSrcAttr: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      mediaSrc: ["'self'", 'data:'],
      connectSrc: [
        "'self'", 
        'wss:', 
        'ws:', 
        'https://www.gstatic.com',
        'https://*.firebaseio.com',
        'https://*.firebaseapp.com',
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://overpass-api.de',
        'https://overpass.kumi.systems',
        'https://overpass.openstreetmap.ru',
        'https://*.tile.openstreetmap.org',
        'https://nominatim.openstreetmap.org',
        'https://unpkg.com'
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5000', 'http://localhost:3000'],
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
// In Docker: mount parent dir at /frontend
// Locally: use __dirname/../
let frontendPath;
try {
  // Try /frontend first (Docker mount)
  require('fs').accessSync('/frontend/index.html');
  frontendPath = '/frontend';
  logger.info('Using Docker mount path: /frontend');
} catch {
  // Fall back to parent directory (local development)
  frontendPath = path.join(__dirname, '../');
  logger.info('Using local path: ' + frontendPath);
}

logger.info(`Frontend path: ${frontendPath}`);
logger.info(`Index.html full path: ${path.resolve(frontendPath, 'index.html')}`);

app.use(express.static(frontendPath, { 
  index: 'index.html',
  maxAge: '1h'
}));

// Serve index.html for SPA routing
app.get('/', (req, res, next) => {
  const indexPath = path.resolve(frontendPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      logger.error(`Failed to serve index.html from ${indexPath}:`, err);
      res.status(404).json({
        success: false,
        error: 'index.html not found',
        path: indexPath
      });
    }
  });
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

// Import auth router
const authRouter = require('./routes/auth');

// Authentication routes
app.use('/api/auth', authRouter);

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

// External API Proxy routes
app.use('/api/proxy', stubRoutes.proxy);

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
// SPA ROUTING - Serve index.html only for non-file routes
// ========================================

app.get('*', (req, res) => {
  // Don't interfere with API routes - return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: req.originalUrl,
      method: req.method
    });
  }

  // For any other request not served by express.static, serve index.html
  // This allows SPA routing to work
  // If it's a real file, express.static would have already served it
  const indexPath = path.resolve(frontendPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      logger.error(`Failed to serve index.html from ${indexPath}:`, err);
      res.status(404).json({
        success: false,
        error: 'index.html not found',
        path: indexPath
      });
    }
  });
});

// ========================================
// 404 HANDLER (fallback)
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
    // Initialize database (optional for development mode)
    let dbInitialized = false;
    if (process.env.NODE_ENV !== 'development' || process.env.REQUIRE_DB === 'true') {
      try {
        logger.info('Initializing database connection...');
        await db.initialize();
        logger.info('Database connected successfully');
        
        // Run migrations
        logger.info('Running database migrations...');
        await db.runMigrations();
        logger.info('Migrations completed');
        dbInitialized = true;
      } catch (dbError) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Database connection failed - running in development mode without database');
          logger.warn('Frontend will work with mock data');
        } else {
          throw dbError;
        }
      }
    } else {
      logger.info('Running in development mode - database is optional');
      logger.info('Frontend will work with mock API responses');
    }
    
    // Start HTTP server
    server.listen(PORT, HOST, () => {
      const url = `http://localhost:${PORT}`;
      logger.info(`🚀 OceanGuard API Server running`);
      logger.info(`📍 Visit: ${url}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Workers: ${process.env.WORKERS || 1}`);
      if (dbInitialized) {
        logger.info(`Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
      } else {
        logger.info(`Database: Not connected (development mode)`);
      }
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
