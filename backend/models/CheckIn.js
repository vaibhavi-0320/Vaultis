const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true, index: true 
  },
  timestamp: { type: Date, default: Date.now },
  lvtRewarded: { type: Number, default: 10 },
  streakBonus: { type: Number, default: 0 },
  txHash: { type: String, default: '' },
  blockNumber: { type: Number, default: 0 },
  network: { type: String, default: 'Sepolia Testnet' },
  method: { type: String, default: 'checkInAndEarn' },
  etherscanUrl: { type: String, default: '' },
  gasUsed: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['confirmed', 'simulated', 'pending'],
    default: 'simulated'
  },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' }
});

module.exports = mongoose.model('CheckIn', checkInSchema);
