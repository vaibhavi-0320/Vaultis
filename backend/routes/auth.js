const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');
const InheritanceWorkflow = require('../models/InheritanceWorkflow');
const Asset = require('../models/Asset');
const Contact = require('../models/Contact');
const WillDocument = require('../models/WillDocument');
const CheckIn = require('../models/CheckIn');
const Beneficiary = require('../models/Beneficiary');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { isDatabaseReady } = require('../config/db');
const { sendWelcomeEmail } = require('../services/emailService');
const { recordActivity } = require('../utils/activity');
const {
  createNotification,
  createUser,
  createWorkflow,
  deleteUserData,
  findUserByEmail,
  findUserById,
  toSafeUser,
  updateUser
} = require('../services/localStore');

const router = express.Router();
const walletAddressValidators = {
  metamask: /^0x[a-fA-F0-9]{40}$/
}

// Stricter rate limiting for login/register to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per IP per 15 minutes
  keyGenerator: (req) => {
    // Use IP address for rate limiting (x-forwarded-for for production, socket address for local)
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({ 
      success: false, 
      message: 'Too many login attempts. Please try again in 15 minutes.' 
    });
  },
  standardHeaders: false, // Disable `RateLimit-*` headers
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 registrations per IP per hour
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({ 
      success: false, 
      message: 'Too many registration attempts. Please try again in 1 hour.' 
    });
  },
  standardHeaders: false,
  legacyHeaders: false
});

// Generic auth endpoint limiter (for other auth endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({ 
      success: false, 
      message: 'Too many requests. Please try again later.' 
    });
  },
  standardHeaders: false,
  legacyHeaders: false
});

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Set httpOnly cookie for secure token storage
  res.cookie('vaultis_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
  
  res.status(statusCode).json({
    success: true,
    // Don't send token in response body anymore - it's in the httpOnly cookie
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      walletType: user.walletType,
      ethereumAddress: user.ethereumAddress,
      lvtBalance: user.lvtBalance,
      stakedAmount: user.stakedAmount,
      status: user.status,
      lastCheckIn: user.lastCheckIn,
      checkInStreak: user.checkInStreak,
      daysUntilWarning: user.daysUntilWarning
    }
  });
};

router.post('/register', registerLimiter, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and symbol (@$!%*?&)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Invalid registration request',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = isDatabaseReady()
      ? await User.findOne({ email: normalizedEmail })
      : await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = isDatabaseReady()
      ? await User.create({
          name: String(name).trim(),
          email: normalizedEmail,
          password,
          lvtBalance: 0,
          status: 'active'
        })
      : await createUser({
          name,
          email: normalizedEmail,
          password: await bcrypt.hash(password, 12),
          lvtBalance: 0,
          status: 'active'
        });
    const safeUser = isDatabaseReady() ? user : toSafeUser(user);

    if (isDatabaseReady()) {
      await InheritanceWorkflow.create({ userId: user._id, lastHeartbeatAt: user.lastCheckIn });
      await Notification.create({
        userId: user._id,
        type: 'system',
        title: 'Welcome to VAULTIS',
        message: 'Your vault is ready. Add your first asset to begin protection.'
      });
    } else {
      await createWorkflow(user._id, { lastHeartbeatAt: user.lastCheckIn });
      await createNotification({
        userId: user._id,
        type: 'system',
        title: 'Welcome to VAULTIS',
        message: 'Your vault is ready. Add your first asset to begin protection.'
      });
    }

    await recordActivity({
      userId: user._id,
      eventType: 'account_created',
      title: 'Vault created',
      description: 'New VAULTIS account initialized.',
      severity: 'success'
    });

    sendWelcomeEmail(normalizedEmail, String(name).trim()).catch(() => {});
    sendTokenResponse(safeUser, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Invalid login request',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = isDatabaseReady()
      ? await User.findOne({ email: normalizedEmail })
      : await findUserByEmail(normalizedEmail);

    // Generic error for both "no account" and "wrong password" — a distinct message
    // for each would let an attacker enumerate registered emails.
    const invalidCredentials = () => res.status(401).json({
      success: false,
      message: 'Invalid email or password.'
    });

    if (!user) {
      return invalidCredentials();
    }

    const isValid = isDatabaseReady()
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, user.password);

    if (!isValid) {
      return invalidCredentials();
    }

    if (isDatabaseReady()) {
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
      sendTokenResponse(user, 200, res);
    } else {
      const updatedUser = await updateUser(user._id, { lastLogin: new Date().toISOString() });
      sendTokenResponse(toSafeUser(updatedUser), 200, res);
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = isDatabaseReady()
      ? await User.findById(req.user._id).select('-password')
      : toSafeUser(await findUserById(req.user._id));
    res.json({ success: true, user });
  } catch (error) {
    console.error('GET /me error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.put('/wallet', protect, async (req, res) => {
  try {
    const { walletAddress, walletType } = req.body;
    if (!walletAddress || !walletType) {
      return res.status(400).json({ success: false, message: 'Wallet address and type are required' });
    }

    if (!walletAddressValidators[walletType]?.test(walletAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid wallet address format' });
    }

    if (walletType !== 'metamask') {
      return res.status(400).json({ success: false, message: 'Only MetaMask on Ethereum Sepolia is supported' })
    }

    const updates = { walletAddress, walletType, ethereumAddress: walletAddress }

    const user = isDatabaseReady()
      ? await User.findByIdAndUpdate(
          req.user._id,
          updates,
          { new: true }
        ).select('-password')
      : toSafeUser(await updateUser(req.user._id, updates));

    await recordActivity({
      userId: req.user._id,
      eventType: 'wallet_connected',
      title: 'Wallet connected',
      description: `${walletType} wallet ${walletAddress} linked to vault.`,
      severity: 'success',
      metadata: { walletAddress, walletType }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('PUT /wallet error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name', 'checkInIntervalDays', 'primaryBeneficiaryEmail'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = isDatabaseReady()
      ? await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password')
      : toSafeUser(await updateUser(req.user._id, updates));
    res.json({ success: true, user });
  } catch (error) {
    console.error('PUT /profile error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// Delete account endpoint - requires password confirmation
router.delete('/account', protect, async (req, res) => {
  try {
    const { password } = req.body;
    
    // Validate password is provided
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account.'
      });
    }

    // Verify password
    const user = isDatabaseReady()
      ? await User.findById(req.user._id)
      : await findUserById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const isPasswordValid = isDatabaseReady()
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password.'
      });
    }

    const userId = req.user._id;

    if (isDatabaseReady()) {
      // Delete all associated documents in MongoDB (including prior activity logs)
      await Promise.all([
        Asset.deleteMany({ userId }),
        Contact.deleteMany({ userId }),
        WillDocument.deleteMany({ userId }),
        CheckIn.deleteMany({ userId }),
        Beneficiary.deleteMany({ userId }),
        Notification.deleteMany({ userId }),
        InheritanceWorkflow.deleteMany({ userId }),
        ActivityLog.deleteMany({ userId })
      ]);

      // Record the deletion for audit purposes while userId is still a valid
      // reference, then remove the user document last so this entry survives.
      try {
        await ActivityLog.create({
          userId,
          eventType: 'account_deleted',
          title: 'Account deleted',
          description: 'User account permanently deleted. All data removed.',
          severity: 'critical',
          metadata: { deletedUserId: userId, timestamp: new Date() }
        });
      } catch (auditError) {
        // Log but don't fail - deletion is more important than audit
        console.error('Failed to record account deletion audit log:', auditError);
      }

      await User.findByIdAndDelete(userId);
    } else {
      await deleteUserData(userId);
    }

    // Return success - user is now deleted
    res.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted.'
    });
  } catch (error) {
    console.error('DELETE /account error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// Logout endpoint (clears server-side session if needed, frontend also clears localStorage)
router.post('/logout', protect, async (req, res) => {
  try {
    // Clear the httpOnly cookie
    res.clearCookie('vaultis_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      path: '/'
    });

    // Server-side: log the logout activity
    await recordActivity({
      userId: req.user._id,
      eventType: 'logout',
      title: 'Logged out',
      description: 'User session ended.',
      severity: 'info'
    });

    // Return success - frontend will clear localStorage and cookies
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('POST /logout error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
