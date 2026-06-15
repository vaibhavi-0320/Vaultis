/**
 * Security Middleware
 * Handles CORS, rate limiting, security headers, and request validation
 */

const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const {
  rateLimiters,
  corsOptions,
  helmetConfig,
  errorMessages,
} = require('../config/security');

// ============================================================================
// HELMET SECURITY HEADERS MIDDLEWARE
// ============================================================================

const securityHeadersMiddleware = helmet(helmetConfig);

// ============================================================================
// CORS MIDDLEWARE
// ============================================================================

const corsMiddleware = cors(corsOptions);

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

const generalRateLimiter = rateLimiters.general;
const authRateLimiter = rateLimiters.auth;
const registrationRateLimiter = rateLimiters.registration;
const sensitiveRateLimiter = rateLimiters.sensitive;

// ============================================================================
// BODY SANITIZATION MIDDLEWARE
// ============================================================================

// Remove MongoDB query injection characters
const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Potential MongoDB injection attempt in field: ${key}`);
  },
});

// Remove XSS attack characters
const xssMiddleware = xss();

// ============================================================================
// REQUEST VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate JSON content type for POST/PUT requests
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be application/json',
      });
    }
  }
  next();
};

/**
 * Validate request size
 */
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || 0);
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large',
    });
  }
  next();
};

/**
 * Sanitize user input
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize string fields
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove null bytes
      return value.replace(/\0/g, '');
    } else if (typeof value === 'object' && value !== null) {
      return sanitizeObject(value);
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(sanitizeValue);
    }
    
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeValue(obj[key]);
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// ============================================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================================

/**
 * Log requests securely without exposing sensitive information
 */
const secureRequestLogger = (req, res, next) => {
  const start = Date.now();

  // Capture original send function
  const originalSend = res.send;

  // Override send to log response
  res.send = function(data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Log request with redacted sensitive info
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: statusCode,
      duration: `${duration}ms`,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    };

    // Don't log sensitive paths
    if (!req.path.includes('/auth/') || req.path === '/auth/me') {
      console.log(JSON.stringify(logEntry));
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Comprehensive error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error with full details (server-side only)
  console.error('Error:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  });

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Never expose error details in production
  const response = {
    success: false,
    message: isProduction
      ? errorMessages.SERVER_ERROR
      : err.message || errorMessages.SERVER_ERROR,
  };

  // Include error code if safe to expose
  if (err.code && ['VALIDATION_ERROR', 'AUTH_ERROR', 'NOT_FOUND'].includes(err.code)) {
    response.code = err.code;
  }

  res.status(statusCode).json(response);
};

// ============================================================================
// ENVIRONMENT VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate production environment on startup
 */
const validateProductionEnvironment = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const requiredVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'SEPOLIA_RPC_URL',
      'ETHERSCAN_API_KEY',
      'FRONTEND_URL',
    ];

    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        code: 'CONFIG_ERROR',
      });
    }
  }

  next();
};

// ============================================================================
// SECURITY MIDDLEWARE CHAIN
// ============================================================================

/**
 * Apply all security middleware in correct order
 */
const applySecurityMiddleware = (app) => {
  // 1. Helmet security headers
  app.use(securityHeadersMiddleware);

  // 2. CORS
  app.use(corsMiddleware);

  // 3. Body parsing with size limit
  app.use((req, res, next) => {
    requestSizeLimit(req, res, next);
  });

  // 4. General rate limiter
  app.use('/api/', generalRateLimiter);

  // 5. Content type validation
  app.use(validateContentType);

  // 6. Body sanitization
  app.use(mongoSanitizeMiddleware);
  app.use(xssMiddleware);

  // 7. Input sanitization
  app.use(sanitizeInput);

  // 8. Request logging
  app.use(secureRequestLogger);

  // 9. Environment validation
  app.use(validateProductionEnvironment);

  // 10. Error handler (must be last)
  app.use(errorHandler);
};

// ============================================================================
// EXPORT MIDDLEWARE
// ============================================================================

module.exports = {
  // Individual middleware
  securityHeadersMiddleware,
  corsMiddleware,
  generalRateLimiter,
  authRateLimiter,
  registrationRateLimiter,
  sensitiveRateLimiter,
  mongoSanitizeMiddleware,
  xssMiddleware,
  validateContentType,
  requestSizeLimit,
  sanitizeInput,
  secureRequestLogger,
  errorHandler,
  validateProductionEnvironment,

  // Middleware chain
  applySecurityMiddleware,

  // Rate limiters by function
  rateLimiters: {
    auth: authRateLimiter,
    registration: registrationRateLimiter,
    sensitive: sensitiveRateLimiter,
  },
};
