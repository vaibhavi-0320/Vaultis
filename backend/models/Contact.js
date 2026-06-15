const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true, index: true 
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, default: '' },
  relationship: { 
    type: String, 
    enum: ['family', 'friend', 'colleague', 'lawyer', 'other'],
    default: 'other' 
  },
  trustWeight: { 
    type: String, 
    enum: ['high', 'medium', 'low'], 
    default: 'medium' 
  },
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'failed'], 
    default: 'pending' 
  },
  verificationToken: { type: String, default: '' },
  verificationRequestedAt: { type: Date, default: null },
  voteStatus: { 
    type: String, 
    enum: ['none', 'confirmed', 'denied'], 
    default: 'none' 
  },
  votedAt: { type: Date, default: null },
  notificationsSent: { type: Number, default: 0 },
  lastNotified: { type: Date, default: null }
}, { timestamps: true });

contactSchema.index({ userId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Contact', contactSchema);
