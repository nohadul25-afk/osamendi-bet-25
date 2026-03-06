const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password, referralCode } = req.body;

    // Validation
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check existing
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { phone }]
    });
    if (existingUser) {
      if (existingUser.email === email) return res.status(400).json({ error: 'Email already registered' });
      if (existingUser.username === username) return res.status(400).json({ error: 'Username already taken' });
      if (existingUser.phone === phone) return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Create user
    const user = new User({ username, email, phone, password });

    // Handle referral
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        user.referredBy = referrer._id;
      }
    }

    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        bonusBalance: user.bonusBalance,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Find by email, username, or phone
    const user = await User.findOne({
      $or: [
        { email: login.toLowerCase() },
        { username: login },
        { phone: login }
      ]
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Account is banned', reason: user.banReason });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    const ip = req.ip || req.headers['x-forwarded-for'];
    if (ip && !user.loginIps.includes(ip)) {
      user.loginIps.push(ip);
    }
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        bonusBalance: user.bonusBalance,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -loginIps');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
