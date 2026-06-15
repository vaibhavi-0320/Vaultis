const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  actorType: {
    type: String,
    enum: ['system', 'user', 'contact', 'beneficiary'],
    default: 'user'
  },
  actorId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  eventType: {
    type: String,
    enum: [
      'account_created',
      'wallet_connected',
      'asset_created',
      'asset_updated',
      'asset_deleted',
      'contact_created',
      'contact_updated',
      'contact_deleted',
      'contact_verified',
      'checkin_completed',
      'will_saved',
      'will_registered',
      'inheritance_warning',
      'inheritance_triggered',
      'beneficiary_release',
      'security_alert'
    ],
    required: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  severity: {
    type: String,
    enum: ['info', 'success', 'warning', 'critical'],
    default: 'info'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, eventType: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
