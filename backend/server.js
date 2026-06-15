const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('./config/validateEnv');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { connectDB, getDatabaseStatus, isDatabaseReady } = require('./config/db');
const { init: initBlockchain, getBlockchainStatus } = require('./services/blockchainService');
const { getEventListenerStatus, startEventListener } = require('./services/eventListener');
const { startCronJobs } = require('./services/cronJob');
const { requireDatabaseReady } = require('./middleware/databaseRequired');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],  // Removed 'unsafe-inline' for better security
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        // Remove localhost for production
        process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
        process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : null,
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://api-sepolia.etherscan.io",
        "https://sepolia.infura.io"
      ].filter(Boolean)
    }
  },
  crossOriginEmbedderPolicy: false,
  // Add additional secure headers
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, slow down.' }
});
app.use('/api/', limiter);

// Check-in rate limiter — disabled for demo (unlimited check-ins allowed)
// Re-enable and set max: 5 for production
const checkInLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 9999,
  skip: () => true
});

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
  'https://vaultis.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());

app.get('/api/health', (req, res) => {
  const databaseStatus = getDatabaseStatus();
  const blockchainStatus = getBlockchainStatus();
  const eventListenerStatus = getEventListenerStatus();

  res.json({
    success: true,
    message: 'VAULTIS API running',
    mongodb: isDatabaseReady() ? 'connected' : 'unavailable',
    persistence: isDatabaseReady() ? 'mongodb' : 'development-local-fallback',
    database: databaseStatus,
    blockchain: blockchainStatus,
    eventListener: eventListenerStatus,
    lastSyncAt: blockchainStatus.lastCheckedAt,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.use('/api', requireDatabaseReady);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/checkin', checkInLimiter);
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/vault', require('./routes/vault'));
app.use('/api/will', require('./routes/will'));
app.use('/api/security', require('./routes/security'));
app.use('/api/overview', require('./routes/overview'));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Internal server error',
    ...(isDev ? { stack: err.stack } : {})
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    initBlockchain();
    startEventListener();
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }

  // On Vercel, we export the app and don't bind to a port or run local cron jobs
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Persistence mode: ${isDatabaseReady() ? 'mongodb' : 'development-local-fallback'}`);
      startCronJobs();
    });
  }
}

startServer();

module.exports = app;
