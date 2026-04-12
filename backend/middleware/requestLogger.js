/**
 * Request Logger Middleware
 * Logs all incoming HTTP requests and responses
 */

const logger = require('./logger');

function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.id = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', req.id);

  // Record start time
  req.startTime = Date.now();

  // Extract relevant request info
  const {
    method,
    originalUrl,
    ip,
    userAgent,
    headers
  } = req;

  const clientIp = ip || headers['x-forwarded-for']?.split(',')[0] || 'unknown';

  // Log incoming request
  logger.http(`Incoming ${method} ${originalUrl}`, {
    requestId: req.id,
    method,
    url: originalUrl,
    ip: clientIp,
    userAgent
  });

  // Capture response
  const originalSend = res.send;

  res.send = function(data) {
    // Restore the original send
    res.send = originalSend;

    // Calculate response time
    const duration = Date.now() - req.startTime;
    const statusCode = res.statusCode;

    // Determine log level based on status code
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';

    // Log response
    logger.http(`Response ${statusCode} ${method} ${originalUrl}`, {
      requestId: req.id,
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      ip: clientIp,
      contentLength: res.get('content-length') || 'unknown'
    });

    // Call the original send
    res.send(data);
  };

  // Capture errors
  res.on('error', (error) => {
    const duration = Date.now() - req.startTime;
    logger.error(`Error handling request ${method} ${originalUrl}`, {
      requestId: req.id,
      method,
      url: originalUrl,
      error: error.message,
      duration: `${duration}ms`,
      ip: clientIp,
      stack: error.stack
    });
  });

  next();
};

module.exports = requestLogger;
