const express = require('express');
const Promotion = require('../models/Promotion');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get active promotions
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      isActive: true,
      $or: [
        { endDate: { $gte: now } },
        { endDate: null }
      ]
    }).sort({ order: 1 });
    res.json({ promotions });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Create promotion
router.post('/', adminAuth, async (req, res) => {
  try {
    const promo = new Promotion(req.body);
    await promo.save();
    res.status(201).json({ promotion: promo });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Update promotion
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const promo = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ promotion: promo });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Delete promotion
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Promotion deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
