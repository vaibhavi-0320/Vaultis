const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isDatabaseReady } = require('../config/db');
const { findUserById, toSafeUser } = require('../services/localStore');

const protect = async (req, res, next) => {
  try {
    let token;
    
    // Try to get token from cookie first (primary method)
    if (req.cookies && req.cookies.vaultis_token) {
      token = req.cookies.vaultis_token;
    }
    // Fall back to Authorization header for backwards compatibility
    else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false, message: 'Access denied. No token.' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = isDatabaseReady()
      ? await User.findById(decoded.id).select('-password')
      : toSafeUser(await findUserById(decoded.id));
    if (!user) {
      return res.status(401).json({ 
        success: false, message: 'User not found.' 
      });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'TOKEN_INVALID'
      });
    }

    return res.status(401).json({ 
      success: false, message: 'Token expired or invalid.' 
    });
  }
};

module.exports = { protect };
