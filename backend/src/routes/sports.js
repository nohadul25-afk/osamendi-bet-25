const express = require('express');
const SportEvent = require('../models/SportEvent');
const SportBet = require('../models/SportBet');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get all events
router.get('/events', async (req, res) => {
  try {
    const { sport, status, featured } = req.query;
    const query = {};
    if (sport) query.sport = sport;
    if (status) query.status = status;
    if (featured === 'true') query.featured = true;

    const events = await SportEvent.find(query)
      .sort({ startTime: 1 })
      .limit(100);

    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single event
router.get('/events/:id', async (req, res) => {
  try {
    const event = await SportEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ event });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Place bet
router.post('/bet', auth, async (req, res) => {
  try {
    const { selections, stake } = req.body;
    // selections: [{ eventId, market, selection, odds }]

    if (!selections || selections.length === 0 || !stake) {
      return res.status(400).json({ error: 'Invalid bet data' });
    }

    if (stake < 10) return res.status(400).json({ error: 'Minimum stake is ৳10' });
    if (stake > 100000) return res.status(400).json({ error: 'Maximum stake is ৳100,000' });

    // Check balance
    const user = await User.findById(req.user._id);
    if (user.balance < stake) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Validate events
    const eventIds = selections.map(s => s.eventId);
    const events = await SportEvent.find({ _id: { $in: eventIds }, status: { $in: ['upcoming', 'live'] } });

    if (events.length !== selections.length) {
      return res.status(400).json({ error: 'Some events are no longer available' });
    }

    // Calculate total odds
    const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1);
    const potentialWin = stake * totalOdds;

    // Deduct balance
    user.balance -= stake;
    user.totalBet += stake;
    await user.save();

    const bet = new SportBet({
      user: req.user._id,
      type: selections.length === 1 ? 'single' : 'combo',
      selections: selections.map(s => ({
        event: s.eventId,
        market: s.market,
        selection: s.selection,
        odds: s.odds
      })),
      stake,
      totalOdds,
      potentialWin
    });
    await bet.save();

    res.json({
      betId: bet._id,
      type: bet.type,
      totalOdds,
      potentialWin,
      balance: user.balance
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// My bets
router.get('/my-bets', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const bets = await SportBet.find(query)
      .populate('selections.event', 'teamA teamB sport league startTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SportBet.countDocuments(query);

    res.json({ bets, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Create event
router.post('/admin/event', adminAuth, async (req, res) => {
  try {
    const event = new SportEvent(req.body);
    await event.save();
    res.status(201).json({ event });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Update event
router.put('/admin/event/:id', adminAuth, async (req, res) => {
  try {
    const event = await SportEvent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ event });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Settle event
router.post('/admin/event/:id/settle', adminAuth, async (req, res) => {
  try {
    const { winner, scoreA, scoreB } = req.body;
    const event = await SportEvent.findById(req.params.id);

    if (!event) return res.status(404).json({ error: 'Event not found' });

    event.status = 'finished';
    event.result = { winner, scoreA, scoreB };
    event.isLive = false;
    await event.save();

    // Settle all bets for this event
    const bets = await SportBet.find({
      'selections.event': event._id,
      status: 'pending'
    });

    for (const bet of bets) {
      let allSettled = true;
      let allWon = true;

      for (const selection of bet.selections) {
        if (selection.event.toString() === event._id.toString()) {
          if (selection.market === 'match_winner') {
            selection.result = selection.selection === winner ? 'won' : 'lost';
          }
        }
        if (selection.result === 'pending') allSettled = false;
        if (selection.result === 'lost') allWon = false;
      }

      if (allSettled) {
        if (allWon) {
          bet.status = 'won';
          bet.winAmount = bet.potentialWin;
          const user = await User.findById(bet.user);
          user.balance += bet.potentialWin;
          user.totalWin += bet.potentialWin;
          await user.save();

          const io = req.app.get('io');
          io.notifyUser(user._id, {
            type: 'bet_won',
            message: `Your bet won ৳${bet.potentialWin}!`
          });
        } else {
          bet.status = 'lost';
        }
      }

      await bet.save();
    }

    res.json({ message: 'Event settled', settledBets: bets.length });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
