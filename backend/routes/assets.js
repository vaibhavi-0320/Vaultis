const express = require('express');
const Asset = require('../models/Asset');
const Beneficiary = require('../models/Beneficiary');
const { protect } = require('../middleware/auth');
const { isDatabaseReady } = require('../config/db');
const { encrypt, decrypt, hashData } = require('../services/encryptionService');
const { registerWill } = require('../services/blockchainService');
const { uploadVaultPayload } = require('../services/pinataService');
const { recordActivity } = require('../utils/activity');
const {
  archiveAsset,
  createAsset: createLocalAsset,
  getAsset: getLocalAsset,
  listAssets,
  updateAsset: updateLocalAsset
} = require('../services/localStore');

const router = express.Router();

const ASSET_UPDATE_FIELDS = [
  'title', 'description', 'category', 'assetType', 'data',
  'beneficiaryName', 'beneficiaryEmail', 'priority', 'tags', 'fileName', 'mimeType'
];

const pickAllowedFields = (body, fields) => fields.reduce((acc, field) => {
  if (Object.prototype.hasOwnProperty.call(body, field)) {
    acc[field] = body[field];
  }
  return acc;
}, {});

const ALLOWED_TYPES = new Set([
  'password', 'crypto_wallet', 'document', 'pdf', 'image', 'video',
  'social_account', 'bank_account', 'wallet_note', 'private_instruction', 'note', 'other'
]);

function inferCategory(assetType) {
  if (['document', 'pdf'].includes(assetType)) return 'documents';
  if (['image', 'video'].includes(assetType)) return 'media';
  if (['crypto_wallet', 'bank_account'].includes(assetType)) return 'financial';
  if (['password', 'social_account'].includes(assetType)) return 'identity';
  if (['wallet_note', 'private_instruction', 'note'].includes(assetType)) return 'instructions';
  return 'other';
}

function buildTrustMetrics({ assetType, priority, onChainRegistered, hasBeneficiary, pinataStatus }) {
  let integrityScore = 72;
  let trustConfidence = 68;
  let riskIndicator = 'moderate';
  const suspiciousMetadata = [];
  const securityRecommendations = [];

  if (priority === 'high') {
    integrityScore += 6;
    trustConfidence += 4;
  }

  if (['document', 'pdf', 'private_instruction'].includes(assetType)) {
    integrityScore += 8;
  }

  if (['crypto_wallet', 'bank_account', 'password'].includes(assetType)) {
    riskIndicator = 'high';
    suspiciousMetadata.push('Sensitive credential class requires stronger beneficiary review.');
  }

  if (onChainRegistered) {
    integrityScore += 10;
    trustConfidence += 12;
  } else {
    securityRecommendations.push('Register a proof hash on-chain to strengthen immutability.');
  }

  if (hasBeneficiary) {
    trustConfidence += 10;
  } else {
    riskIndicator = 'high';
    securityRecommendations.push('Assign a beneficiary to avoid an orphaned release path.');
  }

  if (pinataStatus === 'pinned') {
    integrityScore += 6;
  } else {
    securityRecommendations.push('Pin the encrypted payload to IPFS for resilient storage.');
  }

  return {
    integrityScore: Math.min(100, integrityScore),
    trustConfidence: Math.min(100, trustConfidence),
    riskIndicator,
    suspiciousMetadata,
    securityRecommendations
  };
}

function decodeAsset(asset) {
  return {
    ...asset.toObject(),
    encryptedData: decrypt(asset.encryptedData)
  };
}

router.get('/', protect, async (req, res) => {
  try {
    const { type, stage, released, q, category, risk } = req.query;
    const filter = { userId: req.user._id, isActive: true };

    if (type) filter.assetType = type;
    if (category) filter.category = category;
    if (stage) filter.releaseStage = Number(stage);
    if (risk) filter.riskIndicator = risk;
    if (released !== undefined) filter.isReleased = released === 'true';
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $elemMatch: { $regex: q, $options: 'i' } } }
      ];
    }

    const assets = isDatabaseReady()
      ? await Asset.find(filter).sort({ createdAt: -1 })
      : await listAssets(req.user._id, req.query);
    const result = isDatabaseReady() ? assets.map(decodeAsset) : assets.map((asset) => ({
      ...asset,
      encryptedData: decrypt(asset.encryptedData)
    }));

    res.json({ success: true, assets: result, count: result.length });
  } catch (error) {
    console.error('GET / error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const asset = isDatabaseReady()
      ? await Asset.findOne({
          _id: req.params.id,
          userId: req.user._id
        })
      : await getLocalAsset(req.user._id, req.params.id);

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const plainAsset = asset.toObject ? asset.toObject() : asset;
    res.json({
      success: true,
      asset: {
        ...plainAsset,
        encryptedData: decrypt(plainAsset.encryptedData)
      }
    });
  } catch (error) {
    console.error('GET /:id error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      assetType,
      data,
      beneficiaryEmail,
      beneficiaryName,
      releaseStage,
      description,
      tags,
      priority,
      fileName = '',
      mimeType = '',
      category,
      uploadToIpfs = false
    } = req.body;

    if (!title || !assetType || !data || !beneficiaryEmail || !beneficiaryName) {
      return res.status(400).json({
        success: false,
        message: 'Required: title, assetType, data, beneficiaryEmail, beneficiaryName'
      });
    }

    if (!ALLOWED_TYPES.has(assetType)) {
      return res.status(400).json({ success: false, message: 'Unsupported asset type' });
    }

    const encryptedData = encrypt(data);
    const willHash = hashData(data);
    const assetCategory = category || inferCategory(assetType);
    const pinataStatus = uploadToIpfs ? 'pending' : 'not_requested';
    const metrics = buildTrustMetrics({
      assetType,
      priority: priority || 'medium',
      onChainRegistered: false,
      hasBeneficiary: Boolean(beneficiaryEmail),
      pinataStatus
    });

    const assetPayload = {
      userId: req.user._id,
      title,
      assetType,
      encryptedData,
      beneficiaryEmail,
      beneficiaryName,
      releaseStage: releaseStage || 1,
      willHash,
      description: description || '',
      tags: tags || [],
      priority: priority || 'medium',
      category: assetCategory,
      fileName,
      mimeType,
      fileSize: Buffer.byteLength(String(data), 'utf8'),
      pinataStatus,
      verificationStatus: 'verified',
      encryptionStrength: 'AES-256-GCM',
      ...metrics
    };

    const asset = isDatabaseReady()
      ? await Asset.create(assetPayload)
      : await createLocalAsset(assetPayload);

    if (isDatabaseReady()) {
      await Beneficiary.findOneAndUpdate(
        { userId: req.user._id, email: String(beneficiaryEmail).trim().toLowerCase() },
        {
          $set: {
            name: beneficiaryName,
            email: String(beneficiaryEmail).trim().toLowerCase()
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    await recordActivity({
      userId: req.user._id,
      eventType: 'asset_created',
      title: 'Vault asset encrypted',
      description: `${title} was secured and assigned to ${beneficiaryName}.`,
      severity: 'success',
      metadata: { assetId: asset._id, assetType, category: assetCategory }
    });

    if (isDatabaseReady()) {
      registerWill(willHash).then((result) => {
      if (!result.success) {
        return Asset.findByIdAndUpdate(asset._id, {
          onChainRegistered: false
        }).exec();
      }

      const nextMetrics = buildTrustMetrics({
        assetType,
        priority: priority || 'medium',
        onChainRegistered: true,
        hasBeneficiary: true,
        pinataStatus
      });

      return Asset.findByIdAndUpdate(asset._id, {
        onChainRegistered: true,
        blockchainTxHash: result.txHash,
        blockchainRegisteredAt: new Date(),
        integrityScore: nextMetrics.integrityScore,
        trustConfidence: nextMetrics.trustConfidence
      }).exec();
      }).catch(() => null);
    }

    if (uploadToIpfs && isDatabaseReady()) {
      uploadVaultPayload(
        {
          encryptedData,
          title,
          assetType,
          category: assetCategory,
          beneficiaryEmail,
          willHash
        },
        `vaultis-${req.user._id}-${Date.now()}`
      ).then((result) => {
        if (result.success) {
          return Asset.findByIdAndUpdate(asset._id, {
            ipfsCid: result.cid,
            pinataStatus: 'pinned'
          }).exec();
        }

        return Asset.findByIdAndUpdate(asset._id, { pinataStatus: 'failed' }).exec();
      }).catch(() => {
        Asset.findByIdAndUpdate(asset._id, { pinataStatus: 'failed' }).exec();
      });
    }

    res.status(201).json({
      success: true,
      asset: { ...(asset.toObject ? asset.toObject() : asset), encryptedData: data },
      message: 'Asset created and scheduled for proof registration'
    });
  } catch (error) {
    console.error('POST / error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const asset = isDatabaseReady()
      ? await Asset.findOne({
          _id: req.params.id,
          userId: req.user._id
        })
      : await getLocalAsset(req.user._id, req.params.id);

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const updates = pickAllowedFields(req.body, ASSET_UPDATE_FIELDS);

    if (updates.assetType && !ALLOWED_TYPES.has(updates.assetType)) {
      return res.status(400).json({ success: false, message: 'Unsupported asset type' });
    }

    if (req.body.data) {
      updates.encryptedData = encrypt(req.body.data);
      updates.willHash = hashData(req.body.data);
      updates.fileSize = Buffer.byteLength(String(req.body.data), 'utf8');
      delete updates.data;
    }

    Object.assign(updates, buildTrustMetrics({
      assetType: updates.assetType || asset.assetType,
      priority: updates.priority || asset.priority,
      onChainRegistered: updates.onChainRegistered ?? asset.onChainRegistered,
      hasBeneficiary: Boolean(updates.beneficiaryEmail || asset.beneficiaryEmail),
      pinataStatus: updates.pinataStatus || asset.pinataStatus
    }));

    updates.lastVerifiedAt = new Date();

    const updated = isDatabaseReady()
      ? await Asset.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, updates, { new: true })
      : await updateLocalAsset(req.user._id, req.params.id, updates);

    await recordActivity({
      userId: req.user._id,
      eventType: 'asset_updated',
      title: 'Vault asset updated',
      description: `${updated.title} metadata changed.`,
      severity: 'info',
      metadata: { assetId: updated._id }
    });

    const plainAsset = updated.toObject ? updated.toObject() : updated;
    res.json({
      success: true,
      asset: {
        ...plainAsset,
        encryptedData: decrypt(plainAsset.encryptedData)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const asset = isDatabaseReady()
      ? await Asset.findOneAndUpdate(
          { _id: req.params.id, userId: req.user._id },
          {
            isActive: false,
            encryptedData: encrypt('[securely deleted]')
          },
          { new: true }
        )
      : await archiveAsset(req.user._id, req.params.id, encrypt('[securely deleted]'));

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    await recordActivity({
      userId: req.user._id,
      eventType: 'asset_deleted',
      title: 'Vault asset archived',
      description: `${asset.title} removed from active release monitoring.`,
      severity: 'warning',
      metadata: { assetId: asset._id }
    });

    res.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
