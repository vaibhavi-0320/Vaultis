const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true, index: true 
  },
  title: { type: String, required: [true, 'Title is required'], trim: true },
  description: { type: String, default: '', trim: true },
  category: {
    type: String,
    enum: ['documents', 'media', 'financial', 'identity', 'instructions', 'other'],
    default: 'other'
  },
  assetType: { 
    type: String, 
    enum: ['password', 'crypto_wallet', 'document', 'pdf', 'image', 'video',
           'social_account', 'bank_account', 'wallet_note', 'private_instruction', 'note', 'other'],
    required: true 
  },
  encryptedData: { type: String, required: true },
  fileName: { type: String, default: '', trim: true },
  mimeType: { type: String, default: '', trim: true },
  fileSize: { type: Number, default: 0 },
  ipfsCid: { type: String, default: '', trim: true },
  pinataStatus: {
    type: String,
    enum: ['not_requested', 'pending', 'pinned', 'failed'],
    default: 'not_requested'
  },
  aiSummary: { type: String, default: '', trim: true },
  securityRecommendations: [{ type: String, trim: true }],
  suspiciousMetadata: [{ type: String, trim: true }],
  
  // Beneficiary
  beneficiaryName: { type: String, required: true, trim: true },
  beneficiaryEmail: { type: String, required: true, trim: true },
  
  // Release control
  releaseStage: { type: Number, enum: [1, 2, 3], default: 1 },
  isReleased: { type: Boolean, default: false },
  releasedAt: { type: Date, default: null },
  
  // Blockchain proof
  willHash: { type: String, default: '' },
  onChainRegistered: { type: Boolean, default: false },
  blockchainTxHash: { type: String, default: '' },
  blockchainRegisteredAt: { type: Date, default: null },
  
  // Metadata
  tags: [{ type: String }],
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  integrityScore: { type: Number, default: 0, min: 0, max: 100 },
  trustConfidence: { type: Number, default: 0, min: 0, max: 100 },
  encryptionStrength: { type: String, default: 'AES-256-GCM' },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'review_required'],
    default: 'pending'
  },
  riskIndicator: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate'
  },
  lastVerifiedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

assetSchema.index({ userId: 1, isActive: 1, createdAt: -1 });
assetSchema.index({ userId: 1, assetType: 1, category: 1 });
assetSchema.index({ userId: 1, title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Asset', assetSchema);
