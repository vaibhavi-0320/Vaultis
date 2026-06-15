const express = require('express');
const crypto = require('crypto');
const WillDocument = require('../models/WillDocument');
const { protect } = require('../middleware/auth');
const { isDatabaseReady } = require('../config/db');
const { encrypt, decrypt } = require('../services/encryptionService');
const { registerWill } = require('../services/blockchainService');
const { recordActivity } = require('../utils/activity');
const { getWillDocument, saveWillDocument, updateUser } = require('../services/localStore');

const router = express.Router();

const sha256Hex = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

router.get('/', protect, async (req, res) => {
  try {
    const will = isDatabaseReady()
      ? await WillDocument.findOne({ userId: req.user._id })
      : await getWillDocument(req.user._id);
    if (!will) {
      return res.json({ success: true, will: null });
    }

    res.json({
      success: true,
      will: {
        ...(will.toObject ? will.toObject() : will),
        content: decrypt(will.encryptedContent)
      }
    });
  } catch (error) {
    console.error('GET / error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { content, summary = '', registerOnChain = false } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: 'Will content is required' });
    }

    const sha256Hash = sha256Hex(content);
    const encryptedContent = encrypt(content);
    let proof = { success: false, simulated: false, txHash: '' };

    const payload = {
      encryptedContent,
      summary: String(summary).trim(),
      sha256Hash,
      proofStatus: 'draft'
    };

    if (registerOnChain) {
      proof = await registerWill(sha256Hash);
      payload.blockchainTxHash = proof.txHash || '';
      payload.proofRegisteredAt = proof.txHash ? new Date() : null;
      payload.proofStatus = proof.success ? 'registered' : 'simulation';
    }

    const will = isDatabaseReady()
      ? await WillDocument.findOneAndUpdate(
          { userId: req.user._id },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      : await saveWillDocument(req.user._id, payload);

    await recordActivity({
      userId: req.user._id,
      eventType: registerOnChain ? 'will_registered' : 'will_saved',
      title: registerOnChain ? 'Will proof registered' : 'Will draft secured',
      description: registerOnChain
        ? 'Encrypted will stored and blockchain proof recorded.'
        : 'Encrypted will draft stored in the secure vault.',
      severity: 'success',
      metadata: { sha256Hash, txHash: proof.txHash || '' }
    });

    if (isDatabaseReady()) {
      await req.user.constructor.findByIdAndUpdate(req.user._id, {
        onChainRegistered: proof.success,
        inheritanceTxHash: proof.txHash || ''
      })
    } else {
      await updateUser(req.user._id, {
        onChainRegistered: proof.success,
        inheritanceTxHash: proof.txHash || ''
      });
    }

    res.status(201).json({
      success: true,
      will: {
        ...(will.toObject ? will.toObject() : will),
        content
      },
      proof
    });
  } catch (error) {
    console.error('POST / error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
