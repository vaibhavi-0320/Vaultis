const express = require('express');
const Asset = require('../models/Asset');
const Contact = require('../models/Contact');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const InheritanceWorkflow = require('../models/InheritanceWorkflow');
const WillDocument = require('../models/WillDocument');
const { protect } = require('../middleware/auth');
const { isDatabaseReady } = require('../config/db');
const { getOverviewSummary } = require('../services/localStore');
const { computeTrustConfidence, computeVaultIntegrity } = require('../services/vaultMetrics');

const router = express.Router();

router.get('/summary', protect, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.json({
        success: true,
        summary: await getOverviewSummary(req.user._id)
      });
    }

    const [assetCount, contacts, unreadCount, recentActivity, workflow, willDoc] = await Promise.all([
      Asset.countDocuments({ userId: req.user._id, isActive: true }),
      Contact.find({ userId: req.user._id }).select('verificationStatus trustScore'),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
      ActivityLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10),
      InheritanceWorkflow.findOne({ userId: req.user._id }),
      WillDocument.findOne({ userId: req.user._id }).select('proofStatus proofRegisteredAt sha256Hash blockchainTxHash encryptedContent')
    ]);

    const assets = await Asset.find({ userId: req.user._id, isActive: true })
      .select('category integrityScore trustConfidence riskIndicator encryptionStrength onChainRegistered blockchainTxHash')
      .lean();

    const trustAverage = computeTrustConfidence({ user: req.user, contacts, will: willDoc, workflow });
    const integrityAverage = computeVaultIntegrity({ user: req.user, assets, contacts, will: willDoc });

    const categoryBreakdown = assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      summary: {
        assetCount,
        contactCount: contacts.length,
        unreadCount,
        trustAverage,
        integrityAverage,
        categoryBreakdown,
        workflow,
        will: willDoc,
        activity: recentActivity
      }
    });
  } catch (error) {
    console.error('GET /summary error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
