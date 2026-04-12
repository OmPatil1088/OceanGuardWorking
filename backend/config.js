/**
 * Application Configuration
 * Central location for environment-based settings
 */

const config = {
  // ========================================
  // SERVER CONFIGURATION
  // ========================================
  server: {
    port: parseInt(process.env.PORT || '5000'),
    host: process.env.HOST || '0.0.0.0',
    workers: parseInt(process.env.WORKERS || '4'),
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
  },

  // ========================================
  // DATABASE CONFIGURATION
  // ========================================
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'oceanguard',
    user: process.env.DB_USER || 'oceanguard',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
    poolMin: parseInt(process.env.DB_POOL_MIN || '10'),
    poolMax: parseInt(process.env.DB_POOL_MAX || '100'),
    maxConnections: 100
  },

  // ========================================
  // CACHE CONFIGURATION (Redis)
  // ========================================
  cache: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
    enabled: true
  },

  // ========================================
  // AUTHENTICATION
  // ========================================
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpire: process.env.JWT_EXPIRE || '24h',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    mfaEnabled: true,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true
  },

  // ========================================
  // SECURITY
  // ========================================
  security: {
    helmetEnabled: process.env.HELMET_ENABLED === 'true',
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'ws:']
      }
    },
    hstsMaxAge: 31536000,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000')
  },

  // ========================================
  // LOGGING
  // ========================================
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    dir: './logs',
    maxSize: '20m',
    maxFiles: 14
  },

  // ========================================
  // FILE UPLOAD
  // ========================================
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'video/mp4',
      'video/quicktime'
    ],
    uploadDir: './uploads',
    tempDir: './temp'
  },

  // ========================================
  // NOTIFICATION CHANNELS
  // ========================================
  notifications: {
    sms: {
      enabled: process.env.TWILIO_ACCOUNT_SID ? true : false,
      provider: 'twilio',
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    },
    email: {
      enabled: process.env.SMTP_USER ? true : false,
      provider: 'sendgrid',
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASS,
      from: process.env.EMAIL_FROM || 'noreply@oceanguard.gov.in'
    },
    push: {
      enabled: true,
      provider: 'fcm'
    }
  },

  // ========================================
  // EXTERNAL APIs
  // ========================================
  externalApis: {
    weather: {
      openWeatherId: process.env.OPENWEATHER_API_KEY,
      imdId: process.env.IMD_API_KEY,
      endpoint: 'https://api.openweathermap.org'
    },
    maps: {
      googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,
      provider: 'google'
    },
    news: {
      gnewsEndpoint: 'https://gnewsapi.com'
    }
  },

  // ========================================
  // FEATURE FLAGS
  // ========================================
  features: {
    aiPredictions: process.env.ENABLE_AI_PREDICTIONS === 'true',
    communityVerification: process.env.ENABLE_COMMUNITY_VERIFICATION === 'true',
    smsAlerts: process.env.ENABLE_SMS_ALERTS === 'true',
    emailAlerts: process.env.ENABLE_EMAIL_ALERTS === 'true',
    pushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true'
  },

  // ========================================
  // PAGINATION
  // ========================================
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    defaultPage: 1
  },

  // ========================================
  // PERFORMANCE
  // ========================================
  performance: {
    queryTimeout: 30000, // 30 seconds
    requestTimeout: 60000, // 60 seconds
    maxConnections: 100,
    connectionIdleTimeout: 30000
  },

  // ========================================
  // DEPLOYMENT TARGETS
  // ========================================
  deployment: {
    targets: ['web', 'mobile', 'pwa', 'desktop'],
    platforms: ['ios', 'android', 'windows', 'macos', 'linux'],
    regions: ['ap-south-1', 'ap-southeast-1']
  }
};

/**
 * Get config value with fallback
 */
config.get = (path, defaultValue = null) => {
  const keys = path.split('.');
  let value = config;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      return defaultValue;
    }
  }

  return value;
};

/**
 * Validate critical configuration
 */
config.validate = () => {
  const errors = [];

  if (!config.auth.jwtSecret || config.auth.jwtSecret === 'your-secret-key') {
    errors.push('JWT_SECRET is not configured');
  }

  if (!config.database.name) {
    errors.push('DB_NAME is not configured');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    throw new Error('Configuration validation failed');
  }
};

// Validate on module load
if (process.env.NODE_ENV === 'production') {
  config.validate();
}

module.exports = config;
