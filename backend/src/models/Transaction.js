const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'bet', 'win', 'bonus', 'referral', 'commission', 'adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  // MFS Payment Details
  paymentMethod: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'bank', 'crypto', 'agent', 'system'],
    required: true
  },
  senderNumber: String, // User's MFS number
  transactionId: String, // MFS transaction ID provided by user
  agentNumber: String, // Our agent number used

  // For withdrawals
  withdrawNumber: String, // Number to send money to
  withdrawAccountName: String,

  // Processing
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  adminNote: String,
  userNote: String,

  // Game related
  game: String,
  gameRound: String,

  // Reference
  reference: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Generate reference
transactionSchema.pre('save', function(next) {
  if (!this.reference) {
    const prefix = this.type === 'deposit' ? 'DEP' :
                   this.type === 'withdraw' ? 'WTH' :
                   this.type === 'bet' ? 'BET' :
                   this.type === 'win' ? 'WIN' : 'TXN';
    this.reference = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  next();
});

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ reference: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
