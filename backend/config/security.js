/**
 * Comprehensive Security Configuration
 * Production-hardened settings for maximum protection
 */

const rateLimit = require('express-rate-limit');

// ============================================================================
// RATE LIMITING CONFIGURATIONS
// ============================================================================

const rateLimiters = {
  // General API rate limiter
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production',
  }),

  // Strict rate limiter for auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts, please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use IP address from X-Forwarded-For header (for proxies like Vercel)
      return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.socket.remoteAddress || 
             req.ip;
    },
  }),

  // Rate limiter for registration
  registration: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour
    message: 'Too many registration attempts, please try again in 1 hour.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.socket.remoteAddress || 
             req.ip;
    },
  }),

  // Rate limiter for sensitive operations
  sensitive: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: 'Too many requests to this endpoint.',
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

// ============================================================================
// SECURITY HEADERS CONFIGURATION
// ============================================================================

const securityHeaders = {
  // Prevent browsers from inferring content type
  'X-Content-Type-Options': 'nosniff',

  // Prevent framing (clickjacking protection)
  'X-Frame-Options': 'DENY',

  // XSS protection (legacy, mostly for older browsers)
  'X-XSS-Protection': '1; mode=block',

  // Strict Transport Security (HTTPS enforcement)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy (restrict powerful features)
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',

  // Content Security Policy
  'Content-Security-Policy': buildCSP(),
};

function buildCSP() {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseCSP = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://ethereum-sepolia-rpc.publicnode.com https://api-sepolia.etherscan.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  // In development, allow localhost
  if (!isProduction) {
    baseCSP.push("connect-src 'self' http://localhost:* https://ethereum-sepolia-rpc.publicnode.com https://api-sepolia.etherscan.io");
  }

  return baseCSP.join('; ');
}

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ];

    if (process.env.NODE_ENV !== 'production') {
      // Allow all localhost origins in development
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
        return;
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};

// ============================================================================
// HELMET CONFIGURATION
// ============================================================================

const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'",
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://api-sepolia.etherscan.io',
      ],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  permissionsPolicy: {
    geolocation: [],
    microphone: [],
    camera: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: [],
  },
};

// ============================================================================
// PASSWORD REQUIREMENTS
// ============================================================================

const passwordRequirements = {
  minLength: 12,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
  message: 'Password must be at least 12 characters and contain uppercase, lowercase, number, and symbol (@$!%*?&)',
};

// ============================================================================
// SESSION CONFIGURATION
// ============================================================================

const cookieOptions = {
  httpOnly: true, // Prevent JavaScript access (XSS protection)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'Strict', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// ============================================================================
// JWT CONFIGURATION
// ============================================================================

const jwtConfig = {
  algorithm: 'HS256',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  issuer: 'vaultis-api',
  audience: 'vaultis-frontend',
};

// ============================================================================
// ENCRYPTION CONFIGURATION
// ============================================================================

const encryptionConfig = {
  algorithm: 'aes-256-gcm',
  encoding: 'utf-8',
  tagLength: 16, // GCM tag length in bytes
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

const validationRules = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9._-]{3,30}$/,
  walletAddress: /^0x[a-fA-F0-9]{40}$/,
  txHash: /^0x[a-fA-F0-9]{64}$/,
  uint256: /^\d+$/,
};

// ============================================================================
// ERROR MESSAGES (Generic, no information leakage)
// ============================================================================

const errorMessages = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Invalid request',
  CONFLICT: 'Resource already exists',
  SERVER_ERROR: 'An error occurred processing your request',
  RATE_LIMIT: 'Too many requests, please try again later',
  INVALID_CREDENTIALS: 'Invalid email or password',
  SESSION_EXPIRED: 'Session expired, please login again',
  INVALID_TOKEN: 'Invalid or expired authentication token',
};

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

module.exports = {
  rateLimiters,
  securityHeaders,
  corsOptions,
  helmetConfig,
  passwordRequirements,
  cookieOptions,
  jwtConfig,
  encryptionConfig,
  validationRules,
  errorMessages,
};
