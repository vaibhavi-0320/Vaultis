const express = require('express');
const Asset = require('../models/Asset');
const CheckIn = require('../models/CheckIn');
const Contact = require('../models/Contact');
const InheritanceWorkflow = require('../models/InheritanceWorkflow');
const WillDocument = require('../models/WillDocument');
const { protect } = require('../middleware/auth');
const { isDatabaseReady } = require('../config/db');
const { getSecuritySnapshot } = require('../services/localStore');
const { isConfigured: isPinataConfigured } = require('../services/pinataService');
const {
  computeBlockchainSync,
  computeTrustedContactCoverage,
  computeVaultIntegrity
} = require('../services/vaultMetrics');

const router = express.Router();

router.get('/status', protect, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.json({
        success: true,
        security: await getSecuritySnapshot(req.user._id, req.user)
      });
    }

    const [assets, contacts, workflow, willDoc, checkins] = await Promise.all([
      Asset.find({ userId: req.user._id, isActive: true }).select(
        'integrityScore trustConfidence verificationStatus onChainRegistered pinataStatus riskIndicator encryptionStrength blockchainTxHash'
      ),
      Contact.find({ userId: req.user._id }).select('verificationStatus trustScore'),
      InheritanceWorkflow.findOne({ userId: req.user._id }),
      WillDocument.findOne({ userId: req.user._id }).select('proofStatus sha256Hash blockchainTxHash encryptedContent'),
      CheckIn.find({ userId: req.user._id }).select('status txHash')
    ]);

    const totalAssets = assets.length;
    const encryptedAssets = assets.filter((asset) => asset.encryptionStrength === 'AES-256-GCM').length;
    const vaultHealth = computeVaultIntegrity({ user: req.user, assets, contacts, will: willDoc });

    res.json({
      success: true,
      security: {
        walletConnected: Boolean(req.user.walletAddress),
        encryptionState: `${encryptedAssets}/${totalAssets} AES-256-GCM`,
        vaultHealth,
        blockchainSync: computeBlockchainSync([...assets, ...checkins]),
        smartContractStatus: req.user.walletAddress ? 'ready' : 'degraded',
        ipfsAvailability: isPinataConfigured() ? 'configured' : 'unconfigured',
        emergencyPaused: Boolean(workflow?.emergencyPaused),
        sessionSecurity: req.user.twoFactorEnabled ? 'enhanced' : 'standard',
        trustedContactCoverage: computeTrustedContactCoverage(contacts),
        lastCheckIn: req.user.lastCheckIn || null
      }
    });
  } catch (error) {
    console.error('GET /status error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
