const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GameRound = require('../models/GameRound');
const SportBet = require('../models/SportBet');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// Dashboard stats
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      todayUsers,
      totalDeposits,
      todayDeposits,
      totalWithdrawals,
      todayWithdrawals,
      pendingDeposits,
      pendingWithdrawals,
      totalGameBets,
      todayGameBets,
      totalSportBets
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      Transaction.aggregate([{ $match: { type: 'deposit', status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { type: 'deposit', status: 'approved', createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { type: 'withdraw', status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { type: 'withdraw', status: 'approved', createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
      Transaction.countDocuments({ type: 'withdraw', status: 'pending' }),
      GameRound.aggregate([{ $group: { _id: null, totalBet: { $sum: '$betAmount' }, totalWin: { $sum: '$winAmount' }, count: { $sum: 1 } } }]),
      GameRound.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, totalBet: { $sum: '$betAmount' }, totalWin: { $sum: '$winAmount' }, count: { $sum: 1 } } }]),
      SportBet.aggregate([{ $group: { _id: null, totalStake: { $sum: '$stake' }, totalPayout: { $sum: '$winAmount' }, count: { $sum: 1 } } }])
    ]);

    const gameBets = totalGameBets[0] || { totalBet: 0, totalWin: 0, count: 0 };
    const todayGames = todayGameBets[0] || { totalBet: 0, totalWin: 0, count: 0 };
    const sports = totalSportBets[0] || { totalStake: 0, totalPayout: 0, count: 0 };

    res.json({
      users: { total: totalUsers, today: todayUsers },
      deposits: {
        total: totalDeposits[0]?.total || 0,
        today: todayDeposits[0]?.total || 0,
        pending: pendingDeposits
      },
      withdrawals: {
        total: totalWithdrawals[0]?.total || 0,
        today: todayWithdrawals[0]?.total || 0,
        pending: pendingWithdrawals
      },
      games: {
        totalBets: gameBets.count,
        totalWagered: gameBets.totalBet,
        totalPayout: gameBets.totalWin,
        houseProfit: gameBets.totalBet - gameBets.totalWin,
        todayBets: todayGames.count,
        todayWagered: todayGames.totalBet,
        todayPayout: todayGames.totalWin,
        todayProfit: todayGames.totalBet - todayGames.totalWin
      },
      sports: {
        totalBets: sports.count,
        totalStake: sports.totalStake,
        totalPayout: sports.totalPayout,
        profit: sports.totalStake - sports.totalPayout
      },
      netProfit: (gameBets.totalBet - gameBets.totalWin) + (sports.totalStake - sports.totalPayout)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User management
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Ban/Unban user
router.put('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const { isBanned, banReason } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned, banReason }, { new: true }).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Adjust user balance
router.put('/users/:id/balance', adminAuth, async (req, res) => {
  try {
    const { amount, type, note } = req.body; // type: 'add' or 'subtract'
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const balanceBefore = user.balance;
    if (type === 'add') {
      user.balance += amount;
    } else {
      if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
      user.balance -= amount;
    }
    await user.save();

    await new Transaction({
      user: user._id,
      type: 'adjustment',
      amount: type === 'add' ? amount : -amount,
      balanceBefore,
      balanceAfter: user.balance,
      paymentMethod: 'system',
      status: 'completed',
      processedBy: req.user._id,
      adminNote: note || `Balance ${type} by admin`
    }).save();

    res.json({ user: { balance: user.balance }, message: `Balance ${type}ed successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Set user role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Transaction history (all users)
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, userId } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (userId) query.user = userId;

    const transactions = await Transaction.find(query)
      .populate('user', 'username phone')
      .populate('processedBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({ transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Game rounds (all)
router.get('/game-rounds', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, game, userId } = req.query;
    const query = {};
    if (game) query.game = game;
    if (userId) query.user = userId;

    const rounds = await GameRound.find(query)
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await GameRound.countDocuments(query);

    res.json({ rounds, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Site settings
router.get('/settings', adminAuth, async (req, res) => {
  res.json({
    siteName: 'Osamendi Bet 25',
    currency: 'BDT',
    minDeposit: parseInt(process.env.MIN_DEPOSIT) || 100,
    maxDeposit: parseInt(process.env.MAX_DEPOSIT) || 50000,
    minWithdraw: parseInt(process.env.MIN_WITHDRAW) || 500,
    maxWithdraw: parseInt(process.env.MAX_WITHDRAW) || 25000,
    bkashAgent: process.env.BKASH_AGENT_NUMBER,
    nagadAgent: process.env.NAGAD_AGENT_NUMBER,
    rocketAgent: process.env.ROCKET_AGENT_NUMBER,
    houseEdges: {
      slots: process.env.HOUSE_EDGE_SLOTS,
      crash: process.env.HOUSE_EDGE_CRASH,
      dice: process.env.HOUSE_EDGE_DICE,
      roulette: process.env.HOUSE_EDGE_ROULETTE,
      blackjack: process.env.HOUSE_EDGE_BLACKJACK,
      plinko: process.env.HOUSE_EDGE_PLINKO,
      mines: process.env.HOUSE_EDGE_MINES
    }
  });
});

module.exports = router;
