const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, required: [true, 'Name is required'], trim: true 
  },
  email: { 
    type: String, required: [true, 'Email is required'], 
    unique: true, lowercase: true, trim: true 
  },
  password: { 
    type: String, required: [true, 'Password is required'], minlength: 6 
  },
  walletAddress: { type: String, default: '', trim: true },
  walletType: {
    type: String,
    enum: ['metamask', 'none'],
    default: 'none'
  },
  ethereumAddress: { type: String, default: '', trim: true },
  primaryBeneficiaryEmail: { type: String, default: '', trim: true, lowercase: true },
  
  // Dead man switch fields
  lastCheckIn: { type: Date, default: Date.now },
  checkInIntervalDays: { type: Number, default: 45 },
  status: { 
    type: String, 
    enum: ['active', 'warning', 'triggered', 'released'],
    default: 'active' 
  },
  
  // Token fields
  lvtBalance: { type: Number, default: 0 },
  stakedAmount: { type: Number, default: 0 },
  stakeStartTime: { type: Date, default: null },
  totalRewardsEarned: { type: Number, default: 0 },
  checkInStreak: { type: Number, default: 0 },
  
  // Profile
  profileComplete: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  lastLogin: { type: Date, default: Date.now },
  
  // Blockchain
  onChainRegistered: { type: Boolean, default: false },
  inheritanceTxHash: { type: String, default: '' }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

userSchema.index({ walletAddress: 1 }, { sparse: true });

userSchema.virtual('daysSinceCheckIn').get(function() {
  return Math.floor((Date.now() - this.lastCheckIn) / (1000*60*60*24));
});

userSchema.virtual('daysUntilWarning').get(function() {
  return Math.max(0, this.checkInIntervalDays - this.daysSinceCheckIn);
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toJSON();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
