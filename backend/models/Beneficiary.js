const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  walletAddress: { type: String, default: '', trim: true },
  relationship: { type: String, default: 'beneficiary', trim: true },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'review_required'],
    default: 'pending'
  },
  releaseAccessStatus: {
    type: String,
    enum: ['locked', 'eligible', 'released'],
    default: 'locked'
  },
  accessToken: { type: String, default: '' },
  accessTokenExpiresAt: { type: Date, default: null },
  lastAccessAt: { type: Date, default: null },
  notes: { type: String, default: '', trim: true }
}, { timestamps: true });

beneficiarySchema.index({ userId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
