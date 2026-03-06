const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { auth, agentAuth } = require('../middleware/auth');
const router = express.Router();

// Get wallet info
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('balance bonusBalance totalDeposit totalWithdraw totalBet totalWin');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get MFS agent numbers
router.get('/payment-methods', auth, async (req, res) => {
  res.json({
    methods: [
      {
        id: 'bkash',
        name: 'bKash',
        type: 'mfs',
        agentNumber: process.env.BKASH_AGENT_NUMBER || '01XXXXXXXXX',
        logo: '/images/bkash.png',
        instructions: 'Send Money to the bKash number below, then submit the Transaction ID.',
        instructionsBn: 'নিচের বিকাশ নম্বরে টাকা পাঠান, তারপর ট্রানজেকশন আইডি দিন।',
        minDeposit: parseInt(process.env.MIN_DEPOSIT) || 100,
        maxDeposit: parseInt(process.env.MAX_DEPOSIT) || 50000
      },
      {
        id: 'nagad',
        name: 'Nagad',
        type: 'mfs',
        agentNumber: process.env.NAGAD_AGENT_NUMBER || '01XXXXXXXXX',
        logo: '/images/nagad.png',
        instructions: 'Send Money to the Nagad number below, then submit the Transaction ID.',
        instructionsBn: 'নিচের নগদ নম্বরে টাকা পাঠান, তারপর ট্রানজেকশন আইডি দিন।',
        minDeposit: parseInt(process.env.MIN_DEPOSIT) || 100,
        maxDeposit: parseInt(process.env.MAX_DEPOSIT) || 50000
      },
      {
        id: 'rocket',
        name: 'Rocket (DBBL)',
        type: 'mfs',
        agentNumber: process.env.ROCKET_AGENT_NUMBER || '01XXXXXXXXX',
        logo: '/images/rocket.png',
        instructions: 'Send Money to the Rocket number below, then submit the Transaction ID.',
        instructionsBn: 'নিচের রকেট নম্বরে টাকা পাঠান, তারপর ট্রানজেকশন আইডি দিন।',
        minDeposit: parseInt(process.env.MIN_DEPOSIT) || 100,
        maxDeposit: parseInt(process.env.MAX_DEPOSIT) || 50000
      }
    ]
  });
});

// Request Deposit
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount, paymentMethod, senderNumber, transactionId } = req.body;

    const minDeposit = parseInt(process.env.MIN_DEPOSIT) || 100;
    const maxDeposit = parseInt(process.env.MAX_DEPOSIT) || 50000;

    if (!amount || !paymentMethod || !senderNumber || !transactionId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (amount < minDeposit || amount > maxDeposit) {
      return res.status(400).json({ error: `Amount must be between ৳${minDeposit} and ৳${maxDeposit}` });
    }

    if (!['bkash', 'nagad', 'rocket'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Check duplicate transaction ID
    const duplicate = await Transaction.findOne({ transactionId, type: 'deposit' });
    if (duplicate) {
      return res.status(400).json({ error: 'This Transaction ID has already been used' });
    }

    const agentNumbers = {
      bkash: process.env.BKASH_AGENT_NUMBER,
      nagad: process.env.NAGAD_AGENT_NUMBER,
      rocket: process.env.ROCKET_AGENT_NUMBER
    };

    const transaction = new Transaction({
      user: req.user._id,
      type: 'deposit',
      amount,
      balanceBefore: req.user.balance,
      balanceAfter: req.user.balance, // Will update when approved
      paymentMethod,
      senderNumber,
      transactionId,
      agentNumber: agentNumbers[paymentMethod],
      status: 'pending'
    });

    await transaction.save();

    // Notify admin via socket
    const io = req.app.get('io');
    io.emit('admin:newDeposit', {
      reference: transaction.reference,
      username: req.user.username,
      amount,
      method: paymentMethod,
      txnId: transactionId
    });

    res.json({
      message: 'Deposit request submitted. Please wait for agent approval.',
      messageBn: 'ডিপোজিট রিকোয়েস্ট জমা হয়েছে। এজেন্ট অনুমোদনের জন্য অপেক্ষা করুন।',
      reference: transaction.reference,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Request Withdrawal
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount, paymentMethod, withdrawNumber, withdrawAccountName } = req.body;

    const minWithdraw = parseInt(process.env.MIN_WITHDRAW) || 500;
    const maxWithdraw = parseInt(process.env.MAX_WITHDRAW) || 25000;

    if (!amount || !paymentMethod || !withdrawNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (amount < minWithdraw || amount > maxWithdraw) {
      return res.status(400).json({ error: `Amount must be between ৳${minWithdraw} and ৳${maxWithdraw}` });
    }

    // Check balance
    const user = await User.findById(req.user._id);
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check pending withdrawals
    const pendingWithdraw = await Transaction.findOne({
      user: req.user._id,
      type: 'withdraw',
      status: 'pending'
    });
    if (pendingWithdraw) {
      return res.status(400).json({ error: 'You already have a pending withdrawal' });
    }

    // Deduct balance immediately
    user.balance -= amount;
    await user.save();

    const transaction = new Transaction({
      user: req.user._id,
      type: 'withdraw',
      amount,
      balanceBefore: user.balance + amount,
      balanceAfter: user.balance,
      paymentMethod,
      withdrawNumber,
      withdrawAccountName,
      status: 'pending'
    });

    await transaction.save();

    const io = req.app.get('io');
    io.emit('admin:newWithdraw', {
      reference: transaction.reference,
      username: req.user.username,
      amount,
      method: paymentMethod,
      number: withdrawNumber
    });

    res.json({
      message: 'Withdrawal request submitted. Processing within 10-30 minutes.',
      messageBn: 'উত্তোলন রিকোয়েস্ট জমা হয়েছে। ১০-৩০ মিনিটের মধ্যে প্রসেস হবে।',
      reference: transaction.reference,
      status: 'pending',
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({ transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Agent: Approve/Reject deposit
router.put('/agent/deposit/:id', agentAuth, async (req, res) => {
  try {
    const { action, note } = req.body; // action: 'approve' or 'reject'
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.type !== 'deposit' || transaction.status !== 'pending') {
      return res.status(404).json({ error: 'Transaction not found or already processed' });
    }

    if (action === 'approve') {
      const user = await User.findById(transaction.user);
      user.balance += transaction.amount;
      user.totalDeposit += transaction.amount;
      transaction.balanceAfter = user.balance;
      transaction.status = 'approved';

      // Check for first deposit bonus
      if (user.totalDeposit === transaction.amount) {
        const bonus = Math.min(transaction.amount, 5000); // Max 5000 BDT welcome bonus
        user.bonusBalance += bonus;
      }

      await user.save();

      // Referral bonus
      if (user.referredBy) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          const referralBonus = transaction.amount * 0.05; // 5% referral
          referrer.balance += referralBonus;
          referrer.referralEarnings += referralBonus;
          await referrer.save();

          await new Transaction({
            user: referrer._id,
            type: 'referral',
            amount: referralBonus,
            balanceBefore: referrer.balance - referralBonus,
            balanceAfter: referrer.balance,
            paymentMethod: 'system',
            status: 'completed',
            adminNote: `Referral bonus from ${user.username}`
          }).save();
        }
      }

      // Notify user
      const io = req.app.get('io');
      io.notifyUser(user._id, {
        type: 'deposit_approved',
        message: `Your deposit of ৳${transaction.amount} has been approved!`,
        messageBn: `আপনার ৳${transaction.amount} ডিপোজিট অনুমোদিত হয়েছে!`
      });

    } else if (action === 'reject') {
      transaction.status = 'rejected';
      transaction.adminNote = note || 'Rejected by agent';

      const io = req.app.get('io');
      io.notifyUser(transaction.user, {
        type: 'deposit_rejected',
        message: `Your deposit of ৳${transaction.amount} has been rejected. Reason: ${note || 'N/A'}`,
        messageBn: `আপনার ৳${transaction.amount} ডিপোজিট বাতিল হয়েছে।`
      });
    }

    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    await transaction.save();

    res.json({ message: `Deposit ${action}d successfully`, transaction });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Agent: Approve/Reject withdrawal
router.put('/agent/withdraw/:id', agentAuth, async (req, res) => {
  try {
    const { action, note } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.type !== 'withdraw' || transaction.status !== 'pending') {
      return res.status(404).json({ error: 'Transaction not found or already processed' });
    }

    if (action === 'approve') {
      const user = await User.findById(transaction.user);
      user.totalWithdraw += transaction.amount;
      transaction.status = 'approved';
      await user.save();

      const io = req.app.get('io');
      io.notifyUser(user._id, {
        type: 'withdraw_approved',
        message: `Your withdrawal of ৳${transaction.amount} has been sent to ${transaction.withdrawNumber}!`,
        messageBn: `আপনার ৳${transaction.amount} উত্তোলন ${transaction.withdrawNumber} এ পাঠানো হয়েছে!`
      });

    } else if (action === 'reject') {
      // Refund balance
      const user = await User.findById(transaction.user);
      user.balance += transaction.amount;
      transaction.balanceAfter = user.balance;
      transaction.status = 'rejected';
      transaction.adminNote = note || 'Rejected by agent';
      await user.save();

      const io = req.app.get('io');
      io.notifyUser(user._id, {
        type: 'withdraw_rejected',
        message: `Your withdrawal of ৳${transaction.amount} has been rejected and refunded.`,
        messageBn: `আপনার ৳${transaction.amount} উত্তোলন বাতিল এবং ফেরত দেওয়া হয়েছে।`
      });
    }

    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    await transaction.save();

    res.json({ message: `Withdrawal ${action}d successfully`, transaction });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Agent: Get pending transactions
router.get('/agent/pending', agentAuth, async (req, res) => {
  try {
    const deposits = await Transaction.find({ type: 'deposit', status: 'pending' })
      .populate('user', 'username phone')
      .sort({ createdAt: 1 });

    const withdrawals = await Transaction.find({ type: 'withdraw', status: 'pending' })
      .populate('user', 'username phone')
      .sort({ createdAt: 1 });

    res.json({ deposits, withdrawals });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
