const express = require('express');
const Asset = require('../models/Asset');
const Contact = require('../models/Contact');
const WillDocument = require('../models/WillDocument');
const { protect } = require('../middleware/auth');
const { isDatabaseReady } = require('../config/db');
const { getSecuritySnapshot } = require('../services/localStore');
const { computeVaultIntegrity } = require('../services/vaultMetrics');

const router = express.Router();

router.get('/integrity', protect, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      const security = await getSecuritySnapshot(req.user._id, req.user);
      return res.json({
        success: true,
        integrity: security.vaultHealth,
        source: 'development-local-fallback'
      });
    }

    const [assets, contacts, will] = await Promise.all([
      Asset.find({ userId: req.user._id, isActive: true }).select('encryptionStrength onChainRegistered blockchainTxHash'),
      Contact.find({ userId: req.user._id }).select('verificationStatus trustScore'),
      WillDocument.findOne({ userId: req.user._id }).select('sha256Hash blockchainTxHash encryptedContent proofStatus')
    ]);

    res.json({
      success: true,
      integrity: computeVaultIntegrity({ user: req.user, assets, contacts, will }),
      source: 'mongodb'
    });
  } catch (error) {
    console.error('GET /integrity error:', error);
    res.status(500).json({ success: false, message: 'Unable to load vault integrity.' });
  }
});

module.exports = router;
