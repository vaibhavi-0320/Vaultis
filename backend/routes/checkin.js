const express = require('express');
const User = require('../models/User');
const CheckIn = require('../models/CheckIn');
const Notification = require('../models/Notification');
const InheritanceWorkflow = require('../models/InheritanceWorkflow');
const { protect } = require('../middleware/auth');
const { isDatabaseReady } = require('../config/db');
const { rewardCheckIn } = require('../services/blockchainService');
const { recordActivity } = require('../utils/activity');
const { getSepoliaTxUrl, isValidTxHash, verifyTransaction } = require('../utils/etherscan');
const {
  createCheckIn,
  createNotification,
  createWorkflow,
  findUserById,
  getCheckInHistory,
  resetDemoState,
  saveCheckInTx,
  toSafeUser,
  updateUser
} = require('../services/localStore');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const now = new Date();
    const reward = 10;

    let user;

    if (isDatabaseReady()) {
      user = await User.findByIdAndUpdate(
        req.user._id,
        {
          lastCheckIn: now,
          status: 'active',
          $inc: { lvtBalance: reward, totalRewardsEarned: reward }
        },
        { new: true }
      );

      await InheritanceWorkflow.findOneAndUpdate(
        { userId: user._id },
        {
          status: 'active',
          lastHeartbeatAt: now,
          lastEvaluationAt: now,
          warningAt: null,
          triggeredAt: null,
          releaseAt: null
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      const existingUser = await findUserById(req.user._id);
      user = await updateUser(req.user._id, {
        ...existingUser,
        lastCheckIn: now.toISOString(),
        status: 'active',
        lvtBalance: Number(existingUser?.lvtBalance || 0) + reward,
        totalRewardsEarned: Number(existingUser?.totalRewardsEarned || 0) + reward
      });

      await createWorkflow(user._id, {
        status: 'active',
        lastHeartbeatAt: now.toISOString(),
        lastEvaluationAt: now.toISOString(),
        warningAt: null,
        triggeredAt: null,
        releaseAt: null
      });
    }

    let txHash = 'offline';
    let blockchainStatus = 'no_wallet';
    if (user.ethereumAddress && process.env.VAULTIS_TOKEN_ADDRESS) {
      const result = await rewardCheckIn(user.ethereumAddress, reward);
      txHash = result.txHash || 'offline';
      blockchainStatus = result.success ? 'confirmed' : 'simulated';
    }

    if (isDatabaseReady()) {
      await CheckIn.create({
        userId: user._id,
        lvtRewarded: reward,
        streakBonus: 0,
        txHash,
        blockNumber: 0,
        gasUsed: 0,
        status: blockchainStatus === 'confirmed' ? 'confirmed' : 'simulated',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      await Notification.create({
        userId: user._id,
        type: 'reward_earned',
        title: `Check-in Complete: +${reward} LVT`,
        message: 'Your vault heartbeat is healthy.',
        data: { reward, txHash }
      });
    } else {
      await createCheckIn({
        userId: user._id,
        lvtRewarded: reward,
        streakBonus: 0,
        txHash,
        blockNumber: 0,
        gasUsed: 0,
        status: blockchainStatus === 'confirmed' ? 'confirmed' : 'simulated',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      await createNotification({
        userId: user._id,
        type: 'reward_earned',
        title: `Check-in Complete: +${reward} LVT`,
        message: 'Your vault heartbeat is healthy.',
        data: { reward, txHash }
      });
    }

    await recordActivity({
      userId: user._id,
      eventType: 'checkin_completed',
      title: 'Heartbeat verified',
      description: `Check-in confirmed with a ${reward} LVT reward.`,
      severity: 'success',
      metadata: { reward, txHash }
    });

    res.json({
      success: true,
      message: 'Check-in recorded',
      reward,
      streakBonus: 0,
      streak: user.checkInStreak || 0,
      lvtBalance: user.lvtBalance,
      lastCheckIn: user.lastCheckIn,
      nextCheckInDue: new Date(now.getTime() + (user.checkInIntervalDays || 45) * 24 * 60 * 60 * 1000),
      status: user.status,
      txHash,
      blockchainStatus,
      heartbeatAt: now
    });
  } catch (error) {
    console.error('POST / error:', error);
    res.status(500).json({ success: false, message: error.message || 'Something went wrong. Please try again.' });
  }
});

router.get('/status', protect, async (req, res) => {
  try {
    const user = isDatabaseReady() ? await User.findById(req.user._id) : await findUserById(req.user._id);
    const lastCheckInTime = user?.lastCheckIn ? new Date(user.lastCheckIn).getTime() : NaN;
    const daysSince = Number.isNaN(lastCheckInTime)
      ? 0
      : Math.floor((Date.now() - lastCheckInTime) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      status: user.status,
      lastCheckIn: user.lastCheckIn || null,
      daysSinceCheckIn: daysSince,
      daysUntilWarning: user.lastCheckIn ? Math.max(0, user.checkInIntervalDays - daysSince) : 45,
      daysUntilTrigger: Math.max(0, 60 - daysSince),
      checkInStreak: user.checkInStreak
    });
  } catch (error) {
    console.error('GET /status error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.post('/demo-reset', protect, async (req, res) => {
  const host = req.headers.host || '';
  const isDev = host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    process.env.NODE_ENV === 'development';

  if (!isDev) {
    return res.status(403).json({
      success: false,
      message: 'Demo reset only available in development'
    });
  }

  try {
    const resetTime = new Date(Date.now() - 25 * 60 * 60 * 1000);

    if (isDatabaseReady()) {
      await User.findByIdAndUpdate(req.user._id, {
        lastCheckIn: resetTime,
        status: 'active',
        lvtBalance: 0,
        totalRewardsEarned: 0,
        checkInStreak: 0
      });
      await CheckIn.deleteMany({ userId: req.user._id });
      await Notification.deleteMany({ userId: req.user._id, type: 'reward_earned' });
      await InheritanceWorkflow.findOneAndUpdate(
        { userId: req.user._id },
        {
          status: 'active',
          warningAt: null,
          triggeredAt: null,
          releaseAt: null,
          lastHeartbeatAt: resetTime,
          lastEvaluationAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      await resetDemoState(req.user._id);
    }

    res.json({
      success: true,
      message: 'Demo reset complete',
      lastCheckIn: resetTime
    });
  } catch (error) {
    console.error('POST /demo-reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
});

router.get('/history', protect, async (req, res) => {
  try {
    const history = isDatabaseReady()
      ? await CheckIn.find({ userId: req.user._id })
        .sort({ timestamp: -1 })
        .limit(20)
        .select('timestamp lvtRewarded txHash status blockNumber network method etherscanUrl')
      : await getCheckInHistory(req.user._id);
    res.json({ success: true, history });
  } catch (error) {
    console.error('GET /history error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.post('/save-tx', protect, async (req, res) => {
  try {
    const {
      txHash,
      blockNumber = 0,
      network = 'Sepolia Testnet',
      method = 'checkInAndEarn',
      lvtRewarded = 10,
      timestamp,
      status = 'confirmed',
      etherscanUrl,
      gasUsed = 0
    } = req.body;

    if (!isValidTxHash(txHash)) {
      return res.status(400).json({
        success: false,
        message: 'txHash must be a confirmed Sepolia transaction hash in 0x + 64 hex format'
      });
    }

    const normalizedStatus = status === 'confirmed' ? 'confirmed' : 'pending';

    // Verify transaction on-chain if marked as confirmed
    if (normalizedStatus === 'confirmed') {
      const verification = await verifyTransaction(txHash);
      
      if (!verification.exists) {
        return res.status(400).json({
          success: false,
          message: `Transaction verification failed: ${verification.error || 'Transaction not found on Sepolia'}`
        });
      }

      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: `Transaction failed on-chain: ${verification.error || 'Transaction reverted'}`
        });
      }
    }

    const safeEtherscanUrl = normalizedStatus === 'confirmed'
      ? getSepoliaTxUrl(txHash)
      : '';

    if (isDatabaseReady()) {
      const checkInRecord = await CheckIn.create({
        userId: req.user._id,
        txHash,
        blockNumber,
        network,
        method,
        lvtRewarded,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        status: normalizedStatus,
        etherscanUrl: safeEtherscanUrl || etherscanUrl || '',
        gasUsed
      });

      // Update user's LVT balance if transaction confirmed
      if (normalizedStatus === 'confirmed') {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { lvtBalance: lvtRewarded, totalRewardsEarned: lvtRewarded }
        });
      }

      await Notification.create({
        userId: req.user._id,
        type: 'tx_confirmed',
        title: `Check-in Confirmed: +${lvtRewarded} LVT`,
        message: `On-chain transaction verified on Sepolia: ${txHash.slice(0, 10)}...`,
        data: { txHash, lvtRewarded, etherscanUrl: safeEtherscanUrl }
      });

      await recordActivity({
        userId: req.user._id,
        eventType: 'checkin_tx_confirmed',
        title: 'On-chain check-in confirmed',
        description: `Transaction ${txHash.slice(0, 10)}... verified on Sepolia with +${lvtRewarded} LVT reward.`,
        severity: 'success',
        metadata: { txHash, lvtRewarded, etherscanUrl: safeEtherscanUrl }
      });
    } else {
      await saveCheckInTx(req.user._id, {
        txHash,
        blockNumber,
        network,
        method,
        lvtRewarded,
        timestamp,
        status: normalizedStatus,
        etherscanUrl: safeEtherscanUrl || etherscanUrl || '',
        gasUsed
      });
    }

    res.json({ 
      success: true,
      message: 'Transaction verified and recorded',
      txHash,
      etherscanUrl: safeEtherscanUrl,
      lvtRewarded
    });
  } catch (error) {
    console.error('POST /save-tx error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
