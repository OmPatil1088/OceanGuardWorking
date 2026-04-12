/**
 * Rate Limiting Middleware
 * Prevents abuse and ensures fair usage of API resources
 */

const logger = require('./logger');

class RateLimiter {
  constructor() {
    // In-memory store for rate limits (use Redis in production)
    this.store = new Map();
    this.maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 1000);
    this.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000; // 15 minutes
  }

  /**
   * Get client identifier (IP address)
   */
  getClientId(req) {
    return req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  }

  /**
   * Get current window
   */
  getCurrentWindow() {
    return Math.floor(Date.now() / this.windowMs);
  }

  /**
   * Global rate limiter middleware
   */
  globalLimiter = (req, res, next) => {
    const clientId = this.getClientId(req);
    const window = this.getCurrentWindow();
    const key = `${clientId}:${window}`;

    // Get current count
    let data = this.store.get(key);

    if (!data) {
      data = {
        count: 0,
        firstRequest: Date.now(),
        clientId
      };
      this.store.set(key, data);
    }

    data.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - data.count));
    res.setHeader('X-RateLimit-Reset', new Date(window * this.windowMs + this.windowMs).toISOString());

    if (data.count > this.maxRequests) {
      logger.warn(`Rate limit exceeded for ${clientId}`, {
        clientId,
        requests: data.count,
        limit: this.maxRequests
      });

      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(this.windowMs / 1000)
        }
      });
    }

    next();
  };

  /**
   * Create custom rate limiter with specific limits
   */
  createLimiter(requests, windowMs) {
    return (req, res, next) => {
      const clientId = this.getClientId(req);
      const window = Math.floor(Date.now() / windowMs);
      const key = `${clientId}:${window}:custom`;

      let data = this.store.get(key);

      if (!data) {
        data = {
          count: 0,
          clientId,
          windowMs
        };
        this.store.set(key, data);
      }

      data.count++;

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', requests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, requests - data.count));
      res.setHeader('X-RateLimit-Reset', new Date(window * windowMs + windowMs).toISOString());

      if (data.count > requests) {
        logger.warn(`Custom rate limit exceeded for ${clientId}`, {
          clientId,
          requests: data.count,
          limit: requests,
          window: 'custom'
        });

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil(windowMs / 1000)
          }
        });
      }

      next();
    };
  }

  /**
   * Cleanup old windows (run periodically)
   */
  cleanup() {
    const now = Date.now();
    const threshold = now - (this.windowMs * 2); // Keep last 2 windows

    for (const [key, value] of this.store.entries()) {
      if (value.firstRequest < threshold) {
        this.store.delete(key);
      }
    }

    logger.debug(`Cleaned up ${this.store.size} rate limit entries`);
  }
}

const rateLimiter = new RateLimiter();

// Run cleanup every 10 minutes
setInterval(() => rateLimiter.cleanup(), 10 * 60 * 1000);

module.exports = rateLimiter;
