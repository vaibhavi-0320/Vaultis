const mongoose = require('mongoose');

const inheritanceWorkflowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'warning', 'triggered', 'released'],
    default: 'active'
  },
  warningAt: { type: Date, default: null },
  triggeredAt: { type: Date, default: null },
  releaseAt: { type: Date, default: null },
  confirmationsRequired: { type: Number, default: 2, min: 1, max: 10 },
  confirmationsReceived: { type: Number, default: 0, min: 0 },
  lastHeartbeatAt: { type: Date, default: Date.now },
  lastEvaluationAt: { type: Date, default: Date.now },
  emergencyPaused: { type: Boolean, default: false },
  pauseReason: { type: String, default: '', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('InheritanceWorkflow', inheritanceWorkflowSchema);
