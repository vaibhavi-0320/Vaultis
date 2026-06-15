const express = require('express');
const Asset = require('../models/Asset');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { isDatabaseReady } = require('../config/db');
const { verifyWill, getTokenBalance, registerWill, getBlockchainStatus } = require('../services/blockchainService');
const { hashData } = require('../services/encryptionService');
const { findUserById, getAssetHashes, getCheckInHistory, updateUser } = require('../services/localStore');
const { isValidTxHash } = require('../utils/etherscan');
const router = express.Router();

router.post('/register-will', protect, async (req, res) => {
  try {
    const { hash } = req.body;
    if (!hash) {
      return res.status(400).json({
        success: false,
        message: 'Will hash is required'
      });
    }

    const result = await registerWill(hash);
    if (isDatabaseReady()) {
      await User.findByIdAndUpdate(req.user._id, {
        onChainRegistered: !!result.success,
        inheritanceTxHash: result.txHash || ''
      });
    } else {
      const u = await findUserById(req.user._id);
      if (u) {
        await updateUser(req.user._id, {
          ...u,
          onChainRegistered: !!result.success,
          inheritanceTxHash: result.txHash || ''
        });
      }
    }

    res.json({
      success: true,
      simulated: !!result.simulated,
      txHash: result.txHash || '',
      message: result.simulated
        ? 'Will stored in simulation mode'
        : 'Will registered on-chain'
    });
  } catch (error) {
    console.error('POST /register-will error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.get('/verify-will', protect, async (req, res) => {
  try {
    const { walletAddress } = req.user;
    if (!walletAddress) return res.json({ 
      success: false, message: 'No wallet connected' 
    });
    const result = await verifyWill(walletAddress);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('GET /verify-will error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.get('/on-chain-balance', protect, async (req, res) => {
  try {
    const { walletAddress } = req.user;
    if (!walletAddress) return res.json({ 
      success: false, balance: '0', message: 'No wallet connected' 
    });
    const result = await getTokenBalance(walletAddress);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('GET /on-chain-balance error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.get('/asset-hashes', protect, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.json({ success: true, hashes: await getAssetHashes(req.user._id) });
    }
    const assets = await Asset.find({ 
      userId: req.user._id, willHash: { $ne: '' } 
    }).select('title willHash onChainRegistered blockchainTxHash createdAt');
    res.json({ success: true, hashes: assets });
  } catch (error) {
    console.error('GET /asset-hashes error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.get('/sync-status', protect, async (req, res) => {
  try {
    const blockchain = getBlockchainStatus();
    const checkins = isDatabaseReady()
      ? await CheckIn.find({ userId: req.user._id }).select('txHash status updatedAt createdAt timestamp')
      : await getCheckInHistory(req.user._id);

    const expected = checkins.filter((item) => item.txHash && item.txHash !== 'offline' && !String(item.txHash).startsWith('simulated_'));
    const confirmed = expected.filter((item) => item.status === 'confirmed' && isValidTxHash(item.txHash));
    const syncPercent = expected.length ? Math.round((confirmed.length / expected.length) * 100) : 0;
    const lastSyncAt = checkins[0]?.updatedAt || checkins[0]?.createdAt || checkins[0]?.timestamp || blockchain.lastCheckedAt || null;

    res.json({
      success: true,
      sync: {
        percent: syncPercent,
        matched: confirmed.length,
        total: expected.length,
        pending: expected.length - confirmed.length,
        lastSyncAt,
        blockchain
      }
    });
  } catch (error) {
    console.error('GET /sync-status error:', error);
    res.status(500).json({ success: false, message: 'Unable to load blockchain sync status.' });
  }
});

module.exports = router;
