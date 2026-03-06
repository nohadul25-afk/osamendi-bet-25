const express = require('express');
const User = require('../models/User');
const GameRound = require('../models/GameRound');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -loginIps');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { avatar, preferences } = req.body;
    const updates = {};
    if (avatar) updates.avatar = avatar;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const gameStats = await GameRound.aggregate([
      { $match: { user: user._id } },
      { $group: {
        _id: '$game',
        totalBets: { $sum: 1 },
        totalWagered: { $sum: '$betAmount' },
        totalWon: { $sum: '$winAmount' },
        totalProfit: { $sum: '$profit' },
        maxWin: { $max: '$winAmount' },
        maxMultiplier: { $max: '$multiplier' }
      }}
    ]);

    res.json({
      totalBet: user.totalBet,
      totalWin: user.totalWin,
      totalDeposit: user.totalDeposit,
      totalWithdraw: user.totalWithdraw,
      vipLevel: user.vipLevel,
      vipPoints: user.vipPoints,
      referralCode: user.referralCode,
      referralEarnings: user.referralEarnings,
      gameStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get referral info
router.get('/referrals', auth, async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.user._id })
      .select('username createdAt totalDeposit')
      .sort({ createdAt: -1 });

    res.json({
      referralCode: req.user.referralCode,
      referralLink: `${process.env.FRONTEND_URL}/register?ref=${req.user.referralCode}`,
      totalReferrals: referrals.length,
      referralEarnings: req.user.referralEarnings,
      referrals
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// VIP info
router.get('/vip', auth, async (req, res) => {
  const vipLevels = [
    { level: 0, name: 'Bronze', minPoints: 0, cashbackRate: 0, bonusBdt: 0 },
    { level: 1, name: 'Silver', minPoints: 1000, cashbackRate: 0.5, bonusBdt: 100 },
    { level: 2, name: 'Gold', minPoints: 5000, cashbackRate: 1, bonusBdt: 500 },
    { level: 3, name: 'Platinum', minPoints: 15000, cashbackRate: 1.5, bonusBdt: 1500 },
    { level: 4, name: 'Diamond', minPoints: 50000, cashbackRate: 2, bonusBdt: 5000 },
    { level: 5, name: 'Ruby', minPoints: 150000, cashbackRate: 2.5, bonusBdt: 15000 },
    { level: 6, name: 'Emerald', minPoints: 500000, cashbackRate: 3, bonusBdt: 50000 },
    { level: 7, name: 'Sapphire', minPoints: 1500000, cashbackRate: 3.5, bonusBdt: 100000 },
    { level: 8, name: 'Crown', minPoints: 5000000, cashbackRate: 4, bonusBdt: 300000 },
    { level: 9, name: 'Royal', minPoints: 15000000, cashbackRate: 4.5, bonusBdt: 500000 },
    { level: 10, name: 'Legend', minPoints: 50000000, cashbackRate: 5, bonusBdt: 1000000 }
  ];

  res.json({
    currentLevel: req.user.vipLevel,
    currentPoints: req.user.vipPoints,
    levels: vipLevels,
    currentLevelInfo: vipLevels[req.user.vipLevel],
    nextLevel: vipLevels[req.user.vipLevel + 1] || null
  });
});

module.exports = router;
