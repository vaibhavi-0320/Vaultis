const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { isDatabaseReady } = require('../config/db');
const { createNotification, findUserById, updateUser } = require('../services/localStore');

const router = express.Router();

router.get('/balance', protect, async (req, res) => {
  try {
    const user = isDatabaseReady() ? await User.findById(req.user._id) : await findUserById(req.user._id);
    const stakingDays = user.stakeStartTime
      ? Math.floor((Date.now() - new Date(user.stakeStartTime)) / (1000 * 60 * 60 * 24))
      : 0;
    const pendingReward = Number((user.stakedAmount * 0.05 * stakingDays / 365).toFixed(4));

    res.json({
      success: true,
      lvtBalance: user.lvtBalance,
      stakedAmount: user.stakedAmount,
      pendingReward,
      totalRewardsEarned: user.totalRewardsEarned,
      stakingDays,
      apy: '5%'
    });
  } catch (error) {
    console.error('GET /balance error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.post('/stake', protect, async (req, res) => {
  try {
    const amt = Number(req.body.amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }

    let user;

    if (isDatabaseReady()) {
      // Atomic, guarded update: the $gte filter and pipeline update run as one
      // operation on the database, so two concurrent stake requests can't both
      // pass the balance check against a stale in-memory value.
      user = await User.findOneAndUpdate(
        { _id: req.user._id, lvtBalance: { $gte: amt } },
        [{
          $set: {
            lvtBalance: { $subtract: ['$lvtBalance', amt] },
            stakedAmount: { $add: ['$stakedAmount', amt] },
            stakeStartTime: { $ifNull: ['$stakeStartTime', new Date()] }
          }
        }],
        { new: true }
      );

      if (!user) {
        return res.status(400).json({ success: false, message: 'Insufficient LVT balance' });
      }

      await Notification.create({
        userId: user._id,
        type: 'stake_update',
        title: `Staked ${amt} LVT`,
        message: 'Earning 5% APY. Unstake anytime.',
        data: { staked: amt, total: user.stakedAmount }
      });
    } else {
      user = await findUserById(req.user._id);
      if (amt > user.lvtBalance) {
        return res.status(400).json({ success: false, message: 'Insufficient LVT balance' });
      }
      user.lvtBalance -= amt;
      user.stakedAmount += amt;
      user.stakeStartTime = user.stakeStartTime || new Date().toISOString();
      await updateUser(user._id, user);
      await createNotification({
        userId: user._id,
        type: 'stake_update',
        title: `Staked ${amt} LVT`,
        message: 'Earning 5% APY. Unstake anytime.',
        data: { staked: amt, total: user.stakedAmount }
      });
    }

    res.json({
      success: true,
      message: `Staked ${amt} LVT successfully`,
      lvtBalance: user.lvtBalance,
      stakedAmount: user.stakedAmount
    });
  } catch (error) {
    console.error('POST /stake error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.post('/unstake', protect, async (req, res) => {
  try {
    const amt = Number(req.body.amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }

    const preUnstakeUser = isDatabaseReady() ? await User.findById(req.user._id) : await findUserById(req.user._id);
    if (!preUnstakeUser || amt > preUnstakeUser.stakedAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient staked amount' });
    }

    const stakingDays = preUnstakeUser.stakeStartTime
      ? Math.floor((Date.now() - new Date(preUnstakeUser.stakeStartTime)) / (1000 * 60 * 60 * 24))
      : 0;
    const reward = Number((amt * 0.05 * stakingDays / 365).toFixed(4));

    let user;

    if (isDatabaseReady()) {
      // Same atomic-guard pattern as /stake — the $gte filter and pipeline update
      // are evaluated together by the database, closing the stake/unstake race.
      user = await User.findOneAndUpdate(
        { _id: req.user._id, stakedAmount: { $gte: amt } },
        [{
          $set: {
            stakedAmount: { $subtract: ['$stakedAmount', amt] },
            lvtBalance: { $add: ['$lvtBalance', amt + reward] },
            totalRewardsEarned: { $add: ['$totalRewardsEarned', reward] }
          }
        }, {
          $set: {
            stakeStartTime: { $cond: [{ $eq: ['$stakedAmount', 0] }, null, '$stakeStartTime'] }
          }
        }],
        { new: true }
      );

      if (!user) {
        return res.status(400).json({ success: false, message: 'Insufficient staked amount' });
      }

      await Notification.create({
        userId: user._id,
        type: 'stake_update',
        title: `Unstaked ${amt} LVT + ${reward} reward`,
        message: `Total received: ${amt + reward} LVT`,
        data: { unstaked: amt, reward, total: user.lvtBalance }
      });
    } else {
      user = preUnstakeUser;
      user.stakedAmount -= amt;
      user.lvtBalance += amt + reward;
      user.totalRewardsEarned += reward;
      if (user.stakedAmount === 0) user.stakeStartTime = null;
      await updateUser(user._id, user);
      await createNotification({
        userId: user._id,
        type: 'stake_update',
        title: `Unstaked ${amt} LVT + ${reward} reward`,
        message: `Total received: ${amt + reward} LVT`,
        data: { unstaked: amt, reward, total: user.lvtBalance }
      });
    }

    res.json({
      success: true,
      message: `Unstaked ${amt} LVT + ${reward} LVT reward`,
      lvtBalance: user.lvtBalance,
      stakedAmount: user.stakedAmount,
      reward
    });
  } catch (error) {
    console.error('POST /unstake error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
