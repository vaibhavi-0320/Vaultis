const { getDatabaseStatus, isDatabaseReady, shouldRequireDatabase } = require('../config/db');

function requireDatabaseReady(req, res, next) {
  if (!shouldRequireDatabase() || isDatabaseReady()) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: 'Database is temporarily unavailable. Please try again after MongoDB reconnects.',
    database: getDatabaseStatus()
  });
}

module.exports = { requireDatabaseReady };
