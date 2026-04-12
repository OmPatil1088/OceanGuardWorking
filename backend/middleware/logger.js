/**
 * Logger Middleware - Winston-based structured logging
 * Supports multiple log levels and outputs for production
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      debug: 4
    };
    
    this.colors = {
      error: '\x1b[31m',    // Red
      warn: '\x1b[33m',     // Yellow
      info: '\x1b[36m',     // Cyan
      http: '\x1b[35m',     // Magenta
      debug: '\x1b[34m',    // Blue
      reset: '\x1b[0m'      // Reset
    };
    
    this.currentLevel = this.levels[process.env.LOG_LEVEL || 'info'];
  }

  /**
   * Format timestamp as ISO 8601
   * @returns {string} ISO formatted timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message with metadata
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} meta - Additional metadata
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const pid = process.pid;
    
    let formatted = `[${timestamp}] [${level.toUpperCase()}] [PID:${pid}] ${message}`;
    
    if (Object.keys(meta).length > 0) {
      formatted += ` ${JSON.stringify(meta)}`;
    }
    
    return formatted;
  }

  /**
   * Write log to file
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} meta - Metadata
   */
  writeToFile(level, message, meta) {
    try {
      const logFile = path.join(logsDir, `${level}.log`);
      const logMessage = this.formatMessage(level, message, meta) + '\n';
      fs.appendFileSync(logFile, logMessage);
      
      // Also write to combined log
      const combinedFile = path.join(logsDir, 'combined.log');
      fs.appendFileSync(combinedFile, logMessage);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  /**
   * Console output with colors
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} meta - Metadata
   */
  consoleOutput(level, message, meta) {
    if (this.levels[level] <= this.currentLevel) {
      const color = this.colors[level] || this.colors.reset;
      const timestamp = this.getTimestamp();
      const formatted = `${color}[${timestamp}] [${level.toUpperCase()}]${this.colors.reset} ${message}`;
      
      if (Object.keys(meta).length > 0) {
        console.log(formatted, meta);
      } else {
        console.log(formatted);
      }
    }
  }

  /**
   * Log error
   * @param {string} message - Log message
   * @param {Error|object} error - Error object or metadata
   */
  error(message, error = {}) {
    const meta = error instanceof Error ? {
      error: error.message,
      stack: error.stack,
      ...error
    } : error;
    
    this.consoleOutput('error', message, meta);
    this.writeToFile('error', message, meta);
  }

  /**
   * Log warning
   * @param {string} message - Log message
   * @param {object} meta - Metadata
   */
  warn(message, meta = {}) {
    this.consoleOutput('warn', message, meta);
    this.writeToFile('warn', message, meta);
  }

  /**
   * Log info
   * @param {string} message - Log message
   * @param {object} meta - Metadata
   */
  info(message, meta = {}) {
    this.consoleOutput('info', message, meta);
    this.writeToFile('info', message, meta);
  }

  /**
   * Log HTTP request/response
   * @param {string} message - Log message
   * @param {object} meta - Metadata (method, url, statusCode, duration)
   */
  http(message, meta = {}) {
    this.consoleOutput('http', message, meta);
    this.writeToFile('http', message, meta);
  }

  /**
   * Log debug information
   * @param {string} message - Log message
   * @param {object} meta - Metadata
   */
  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.consoleOutput('debug', message, meta);
      this.writeToFile('debug', message, meta);
    }
  }
}

module.exports = new Logger();
