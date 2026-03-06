const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  titleBn: String, // Bangla title
  description: { type: String, required: true },
  descriptionBn: String,
  type: {
    type: String,
    enum: ['welcome', 'deposit', 'cashback', 'reload', 'referral', 'vip', 'daily', 'weekly', 'event'],
    required: true
  },
  image: String,
  bonusPercent: Number, // e.g. 100 for 100% bonus
  maxBonus: Number,
  minDeposit: Number,
  wagerRequirement: { type: Number, default: 1 }, // times to wager before withdraw
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },
  code: String, // promo code
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  applicableGames: [String], // which games qualify
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Promotion', promotionSchema);
