const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'agent', 'admin', 'superadmin'],
    default: 'user'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  bonusBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeposit: {
    type: Number,
    default: 0
  },
  totalWithdraw: {
    type: Number,
    default: 0
  },
  totalBet: {
    type: Number,
    default: 0
  },
  totalWin: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralEarnings: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  lastLogin: Date,
  loginIps: [String],
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  vipLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  vipPoints: {
    type: Number,
    default: 0
  },
  preferences: {
    language: { type: String, default: 'bn' },
    currency: { type: String, default: 'BDT' },
    notifications: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate referral code
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = 'OB25-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
