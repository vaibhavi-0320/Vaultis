const mongoose = require('mongoose');

const willDocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  encryptedContent: { type: String, default: '' },
  storageProvider: { type: String, enum: ['mongo', 's3'], default: 'mongo' },
  s3Key: { type: String, default: '', trim: true },
  summary: { type: String, default: '', trim: true },
  sha256Hash: { type: String, required: true, trim: true, index: true },
  blockchainTxHash: { type: String, default: '', trim: true },
  blockNumber: { type: Number, default: null },
  proofRegisteredAt: { type: Date, default: null },
  proofStatus: {
    type: String,
    enum: ['draft', 'registered', 'simulation'],
    default: 'draft'
  }
}, { timestamps: true });

module.exports = mongoose.model('WillDocument', willDocumentSchema);
