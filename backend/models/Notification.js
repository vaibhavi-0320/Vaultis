const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true, index: true 
  },
  type: { 
    type: String, 
    enum: ['checkin_reminder', 'warning', 'triggered', 
           'asset_released', 'contact_confirmed', 'reward_earned',
           'stake_update', 'system', 'security_alert'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
