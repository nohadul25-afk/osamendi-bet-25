const mongoose = require('mongoose');

const sportBetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['single', 'combo', 'system'],
    default: 'single'
  },
  selections: [{
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'SportEvent' },
    market: String,
    selection: String,
    odds: Number,
    result: { type: String, enum: ['pending', 'won', 'lost', 'void'], default: 'pending' }
  }],
  stake: {
    type: Number,
    required: true,
    min: 10
  },
  totalOdds: {
    type: Number,
    required: true
  },
  potentialWin: {
    type: Number,
    required: true
  },
  winAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost', 'void', 'cashout'],
    default: 'pending'
  },
  cashoutAmount: Number,
  cashoutAt: Date
}, {
  timestamps: true
});

sportBetSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('SportBet', sportBetSchema);
