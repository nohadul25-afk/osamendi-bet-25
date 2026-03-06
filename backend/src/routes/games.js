const express = require('express');
const User = require('../models/User');
const GameRound = require('../models/GameRound');
const Transaction = require('../models/Transaction');
const ProvablyFair = require('../services/provablyFair');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Helper: Process bet
async function processBet(userId, betAmount, game) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.balance < betAmount) throw new Error('Insufficient balance');
  if (betAmount < 10) throw new Error('Minimum bet is ৳10');
  if (betAmount > 50000) throw new Error('Maximum bet is ৳50,000');

  user.balance -= betAmount;
  user.totalBet += betAmount;

  // VIP points: 1 point per 100 BDT bet
  user.vipPoints += Math.floor(betAmount / 100);
  // Auto upgrade VIP
  const vipThresholds = [0, 1000, 5000, 15000, 50000, 150000, 500000, 1500000, 5000000, 15000000, 50000000];
  for (let i = vipThresholds.length - 1; i >= 0; i--) {
    if (user.vipPoints >= vipThresholds[i]) {
      user.vipLevel = i;
      break;
    }
  }

  await user.save();
  return user;
}

// Helper: Process win
async function processWin(userId, winAmount) {
  const user = await User.findById(userId);
  user.balance += winAmount;
  user.totalWin += winAmount;
  await user.save();
  return user;
}

// ==================== CRASH GAME ====================
router.post('/crash/bet', auth, async (req, res) => {
  try {
    const { betAmount, autoCashout } = req.body;
    const user = await processBet(req.user._id, betAmount, 'crash');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const crashPoint = ProvablyFair.getCrashResult(serverSeed, clientSeed, nonce);

    const round = new GameRound({
      game: 'crash',
      user: req.user._id,
      betAmount,
      result: { crashPoint, autoCashout: autoCashout || null },
      seed: {
        serverSeed,
        clientSeed,
        nonce,
        hash: ProvablyFair.hashServerSeed(serverSeed)
      },
      status: 'active'
    });
    await round.save();

    res.json({
      roundId: round._id,
      hash: round.seed.hash,
      balance: user.balance
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/crash/cashout', auth, async (req, res) => {
  try {
    const { roundId, multiplier } = req.body;
    const round = await GameRound.findOne({ _id: roundId, user: req.user._id, status: 'active' });

    if (!round) return res.status(404).json({ error: 'Round not found' });

    const crashPoint = round.result.crashPoint;
    if (multiplier > crashPoint) {
      return res.status(400).json({ error: 'Already crashed!' });
    }

    const winAmount = round.betAmount * multiplier;
    round.winAmount = winAmount;
    round.multiplier = multiplier;
    round.profit = winAmount - round.betAmount;
    round.status = 'completed';
    await round.save();

    const user = await processWin(req.user._id, winAmount);

    const io = req.app.get('io');
    io.broadcastBet({
      username: req.user.username,
      game: 'Crash',
      amount: round.betAmount,
      multiplier,
      profit: round.profit
    });

    if (round.profit > 10000) {
      io.broadcastBigWin({ username: req.user.username, game: 'Crash', amount: winAmount, multiplier });
    }

    res.json({
      winAmount,
      multiplier,
      profit: round.profit,
      balance: user.balance,
      serverSeed: round.seed.serverSeed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== DICE GAME ====================
router.post('/dice/play', auth, async (req, res) => {
  try {
    const { betAmount, target, condition } = req.body; // condition: 'over' or 'under'

    if (!target || !condition || !['over', 'under'].includes(condition)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const user = await processBet(req.user._id, betAmount, 'dice');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const result = ProvablyFair.getDiceResult(serverSeed, clientSeed, nonce);

    const win = condition === 'over' ? result > target : result < target;
    const winChance = condition === 'over' ? (100 - target) : target;
    const multiplier = win ? (98 / winChance) : 0; // 2% house edge
    const winAmount = win ? betAmount * multiplier : 0;

    if (win) await processWin(req.user._id, winAmount);

    const round = new GameRound({
      game: 'dice',
      user: req.user._id,
      betAmount,
      winAmount,
      multiplier: win ? multiplier : 0,
      profit: winAmount - betAmount,
      result: { roll: result, target, condition, win },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'completed'
    });
    await round.save();

    const updatedUser = await User.findById(req.user._id);

    const io = req.app.get('io');
    io.broadcastBet({
      username: req.user.username, game: 'Dice',
      amount: betAmount, multiplier: win ? multiplier : 0,
      profit: winAmount - betAmount
    });

    res.json({
      result: result,
      win,
      multiplier: win ? multiplier : 0,
      winAmount,
      profit: winAmount - betAmount,
      balance: updatedUser.balance,
      serverSeed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== MINES GAME ====================
router.post('/mines/start', auth, async (req, res) => {
  try {
    const { betAmount, mineCount } = req.body;

    if (!mineCount || mineCount < 1 || mineCount > 24) {
      return res.status(400).json({ error: 'Mine count must be between 1 and 24' });
    }

    const user = await processBet(req.user._id, betAmount, 'mines');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const minePositions = ProvablyFair.getMinePositions(serverSeed, clientSeed, nonce, 25, mineCount);

    const round = new GameRound({
      game: 'mines',
      user: req.user._id,
      betAmount,
      result: { minePositions, mineCount, revealed: [], gemsFound: 0 },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'active'
    });
    await round.save();

    res.json({
      roundId: round._id,
      hash: round.seed.hash,
      mineCount,
      balance: user.balance
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/mines/reveal', auth, async (req, res) => {
  try {
    const { roundId, position } = req.body;
    const round = await GameRound.findOne({ _id: roundId, user: req.user._id, status: 'active' });

    if (!round) return res.status(404).json({ error: 'Round not found' });
    if (round.result.revealed.includes(position)) {
      return res.status(400).json({ error: 'Already revealed' });
    }

    const isMine = round.result.minePositions.includes(position);

    if (isMine) {
      round.status = 'completed';
      round.winAmount = 0;
      round.profit = -round.betAmount;
      round.result.revealed.push(position);
      await round.save();

      return res.json({
        isMine: true,
        minePositions: round.result.minePositions,
        winAmount: 0,
        balance: (await User.findById(req.user._id)).balance,
        serverSeed: round.seed.serverSeed
      });
    }

    round.result.revealed.push(position);
    round.result.gemsFound += 1;

    // Calculate current multiplier
    const totalTiles = 25;
    const mineCount = round.result.mineCount;
    const gemsFound = round.result.gemsFound;
    let multiplier = 1;
    for (let i = 0; i < gemsFound; i++) {
      multiplier *= (totalTiles - mineCount - i) / (totalTiles - i);
    }
    multiplier = 0.97 / multiplier; // 3% house edge

    round.multiplier = multiplier;
    await round.save();

    res.json({
      isMine: false,
      gemsFound,
      currentMultiplier: multiplier,
      potentialWin: round.betAmount * multiplier
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/mines/cashout', auth, async (req, res) => {
  try {
    const { roundId } = req.body;
    const round = await GameRound.findOne({ _id: roundId, user: req.user._id, status: 'active' });

    if (!round) return res.status(404).json({ error: 'Round not found' });
    if (round.result.gemsFound === 0) return res.status(400).json({ error: 'Reveal at least one tile' });

    const winAmount = round.betAmount * round.multiplier;
    round.winAmount = winAmount;
    round.profit = winAmount - round.betAmount;
    round.status = 'completed';
    await round.save();

    const user = await processWin(req.user._id, winAmount);

    res.json({
      winAmount,
      multiplier: round.multiplier,
      profit: round.profit,
      balance: user.balance,
      minePositions: round.result.minePositions,
      serverSeed: round.seed.serverSeed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== PLINKO ====================
router.post('/plinko/play', auth, async (req, res) => {
  try {
    const { betAmount, risk, rows } = req.body; // risk: low, medium, high; rows: 8-16

    const plinkoRows = Math.min(16, Math.max(8, rows || 16));
    const user = await processBet(req.user._id, betAmount, 'plinko');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const directions = ProvablyFair.getPlinkoResult(serverSeed, clientSeed, nonce, plinkoRows);

    // Calculate final position
    let position = 0;
    directions.forEach(d => { position += d === 'R' ? 1 : 0; });

    // Plinko multipliers by risk
    const multipliers = {
      low: {
        16: [5.6, 2.1, 1.1, 1, 0.5, 1, 0.3, 0.3, 0.3, 0.3, 1, 0.5, 1, 1.1, 2.1, 5.6, 16]
      },
      medium: {
        16: [13, 3, 1.3, 0.7, 0.4, 0.3, 0.2, 0.2, 0.2, 0.2, 0.3, 0.4, 0.7, 1.3, 3, 13, 110]
      },
      high: {
        16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
      }
    };

    const riskLevel = risk || 'medium';
    const mults = multipliers[riskLevel]?.[plinkoRows] || multipliers.medium[16];
    const multiplier = mults[Math.min(position, mults.length - 1)];
    const winAmount = betAmount * multiplier;

    if (winAmount > 0) await processWin(req.user._id, winAmount);

    const round = new GameRound({
      game: 'plinko',
      user: req.user._id,
      betAmount,
      winAmount,
      multiplier,
      profit: winAmount - betAmount,
      result: { directions, position, risk: riskLevel, rows: plinkoRows },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'completed'
    });
    await round.save();

    const updatedUser = await User.findById(req.user._id);

    res.json({
      directions,
      position,
      multiplier,
      winAmount,
      profit: winAmount - betAmount,
      balance: updatedUser.balance,
      serverSeed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ROULETTE ====================
router.post('/roulette/play', auth, async (req, res) => {
  try {
    const { betAmount, bets } = req.body;
    // bets: [{ type: 'red'|'black'|'green'|'odd'|'even'|'number', value: number, amount: number }]

    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    const user = await processBet(req.user._id, totalBet, 'roulette');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const result = ProvablyFair.getRouletteResult(serverSeed, clientSeed, nonce);

    // Determine color
    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const color = result === 0 ? 'green' : redNumbers.includes(result) ? 'red' : 'black';
    const isEven = result !== 0 && result % 2 === 0;

    let totalWin = 0;
    const betResults = bets.map(bet => {
      let win = false;
      let payout = 0;

      switch (bet.type) {
        case 'red': win = color === 'red'; payout = win ? bet.amount * 2 : 0; break;
        case 'black': win = color === 'black'; payout = win ? bet.amount * 2 : 0; break;
        case 'green': win = color === 'green'; payout = win ? bet.amount * 36 : 0; break;
        case 'even': win = isEven && result !== 0; payout = win ? bet.amount * 2 : 0; break;
        case 'odd': win = !isEven && result !== 0; payout = win ? bet.amount * 2 : 0; break;
        case 'number': win = result === bet.value; payout = win ? bet.amount * 36 : 0; break;
        case '1-18': win = result >= 1 && result <= 18; payout = win ? bet.amount * 2 : 0; break;
        case '19-36': win = result >= 19 && result <= 36; payout = win ? bet.amount * 2 : 0; break;
        case '1st12': win = result >= 1 && result <= 12; payout = win ? bet.amount * 3 : 0; break;
        case '2nd12': win = result >= 13 && result <= 24; payout = win ? bet.amount * 3 : 0; break;
        case '3rd12': win = result >= 25 && result <= 36; payout = win ? bet.amount * 3 : 0; break;
      }
      totalWin += payout;
      return { ...bet, win, payout };
    });

    if (totalWin > 0) await processWin(req.user._id, totalWin);

    const round = new GameRound({
      game: 'roulette',
      user: req.user._id,
      betAmount: totalBet,
      winAmount: totalWin,
      multiplier: totalWin / totalBet || 0,
      profit: totalWin - totalBet,
      result: { number: result, color, bets: betResults },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'completed'
    });
    await round.save();

    const updatedUser = await User.findById(req.user._id);

    res.json({
      number: result,
      color,
      betResults,
      totalWin,
      profit: totalWin - totalBet,
      balance: updatedUser.balance,
      serverSeed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== SLOTS ====================
router.post('/slots/spin', auth, async (req, res) => {
  try {
    const { betAmount, lines } = req.body;
    const numLines = lines || 20;

    const user = await processBet(req.user._id, betAmount, 'slots');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    // 5x3 slot grid
    const symbols = ['7', 'BAR', 'CHERRY', 'BELL', 'LEMON', 'ORANGE', 'PLUM', 'GRAPE', 'STAR', 'DIAMOND'];
    const grid = [];
    for (let row = 0; row < 3; row++) {
      const reelResult = ProvablyFair.getSlotResult(serverSeed, clientSeed + row, nonce, 5, symbols.length);
      grid.push(reelResult.map(i => symbols[i]));
    }

    // Check wins
    let totalMultiplier = 0;
    const winLines = [];

    // Payline check (simplified - horizontal lines)
    for (let row = 0; row < 3; row++) {
      const line = grid[row];
      if (line[0] === line[1] && line[1] === line[2] && line[2] === line[3] && line[3] === line[4]) {
        // 5 of a kind
        const sym = line[0];
        const mult = sym === 'DIAMOND' ? 100 : sym === '7' ? 50 : sym === 'STAR' ? 25 : sym === 'BAR' ? 15 : 10;
        totalMultiplier += mult;
        winLines.push({ line: row, symbols: line, count: 5, multiplier: mult });
      } else if (line[0] === line[1] && line[1] === line[2] && line[2] === line[3]) {
        const sym = line[0];
        const mult = sym === 'DIAMOND' ? 25 : sym === '7' ? 15 : sym === 'STAR' ? 8 : sym === 'BAR' ? 5 : 3;
        totalMultiplier += mult;
        winLines.push({ line: row, symbols: line.slice(0, 4), count: 4, multiplier: mult });
      } else if (line[0] === line[1] && line[1] === line[2]) {
        const sym = line[0];
        const mult = sym === 'DIAMOND' ? 10 : sym === '7' ? 5 : sym === 'STAR' ? 3 : sym === 'BAR' ? 2 : 1;
        totalMultiplier += mult;
        winLines.push({ line: row, symbols: line.slice(0, 3), count: 3, multiplier: mult });
      }
    }

    // Scatter check (STAR on any 3+ positions)
    let scatterCount = 0;
    grid.forEach(row => row.forEach(sym => { if (sym === 'STAR') scatterCount++; }));
    const freeSpins = scatterCount >= 3 ? scatterCount * 5 : 0;

    const winAmount = betAmount * totalMultiplier;
    if (winAmount > 0) await processWin(req.user._id, winAmount);

    const round = new GameRound({
      game: 'slots',
      user: req.user._id,
      betAmount,
      winAmount,
      multiplier: totalMultiplier,
      profit: winAmount - betAmount,
      result: { grid, winLines, freeSpins, scatterCount },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'completed'
    });
    await round.save();

    const updatedUser = await User.findById(req.user._id);

    const io = req.app.get('io');
    if (winAmount > 5000) {
      io.broadcastBigWin({ username: req.user.username, game: 'Slots', amount: winAmount, multiplier: totalMultiplier });
    }

    res.json({
      grid,
      winLines,
      totalMultiplier,
      winAmount,
      profit: winAmount - betAmount,
      freeSpins,
      balance: updatedUser.balance,
      serverSeed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== WHEEL OF FORTUNE ====================
router.post('/wheel/spin', auth, async (req, res) => {
  try {
    const { betAmount } = req.body;
    const user = await processBet(req.user._id, betAmount, 'wheel');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const segments = [
      { label: '0x', multiplier: 0, color: '#333', count: 1 },
      { label: '0.5x', multiplier: 0.5, color: '#e74c3c', count: 8 },
      { label: '1x', multiplier: 1, color: '#f39c12', count: 15 },
      { label: '1.5x', multiplier: 1.5, color: '#2ecc71', count: 10 },
      { label: '2x', multiplier: 2, color: '#3498db', count: 8 },
      { label: '3x', multiplier: 3, color: '#9b59b6', count: 5 },
      { label: '5x', multiplier: 5, color: '#e67e22', count: 3 },
      { label: '10x', multiplier: 10, color: '#1abc9c', count: 2 },
      { label: '20x', multiplier: 20, color: '#e74c3c', count: 1 },
      { label: '50x', multiplier: 50, color: '#f1c40f', count: 1 }
    ];

    // Build full wheel
    const wheel = [];
    segments.forEach(seg => {
      for (let i = 0; i < seg.count; i++) wheel.push(seg);
    });

    const resultIndex = ProvablyFair.getWheelResult(serverSeed, clientSeed, nonce, wheel.length);
    const winSegment = wheel[resultIndex];
    const winAmount = betAmount * winSegment.multiplier;

    if (winAmount > 0) await processWin(req.user._id, winAmount);

    const round = new GameRound({
      game: 'wheel',
      user: req.user._id,
      betAmount,
      winAmount,
      multiplier: winSegment.multiplier,
      profit: winAmount - betAmount,
      result: { segment: winSegment, index: resultIndex },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'completed'
    });
    await round.save();

    const updatedUser = await User.findById(req.user._id);

    res.json({
      segment: winSegment,
      index: resultIndex,
      multiplier: winSegment.multiplier,
      winAmount,
      profit: winAmount - betAmount,
      balance: updatedUser.balance,
      serverSeed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== COIN FLIP ====================
router.post('/coinflip/play', auth, async (req, res) => {
  try {
    const { betAmount, choice } = req.body; // choice: 'heads' or 'tails'
    if (!['heads', 'tails'].includes(choice)) {
      return res.status(400).json({ error: 'Choose heads or tails' });
    }

    const user = await processBet(req.user._id, betAmount, 'coinflip');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const result = ProvablyFair.getCoinFlipResult(serverSeed, clientSeed, nonce);
    const win = result === choice;
    const winAmount = win ? betAmount * 1.96 : 0; // 2% house edge

    if (win) await processWin(req.user._id, winAmount);

    const round = new GameRound({
      game: 'coinflip',
      user: req.user._id,
      betAmount,
      winAmount,
      multiplier: win ? 1.96 : 0,
      profit: winAmount - betAmount,
      result: { result, choice, win },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'completed'
    });
    await round.save();

    const updatedUser = await User.findById(req.user._id);

    res.json({
      result,
      choice,
      win,
      winAmount,
      profit: winAmount - betAmount,
      balance: updatedUser.balance,
      serverSeed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== LIMBO ====================
router.post('/limbo/play', auth, async (req, res) => {
  try {
    const { betAmount, targetMultiplier } = req.body;
    if (!targetMultiplier || targetMultiplier < 1.01) {
      return res.status(400).json({ error: 'Target must be at least 1.01x' });
    }

    const user = await processBet(req.user._id, betAmount, 'limbo');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const result = ProvablyFair.getLimboResult(serverSeed, clientSeed, nonce);
    const win = result >= targetMultiplier;
    const winAmount = win ? betAmount * targetMultiplier : 0;

    if (win) await processWin(req.user._id, winAmount);

    const round = new GameRound({
      game: 'limbo',
      user: req.user._id,
      betAmount,
      winAmount,
      multiplier: win ? targetMultiplier : 0,
      profit: winAmount - betAmount,
      result: { result: Math.floor(result * 100) / 100, target: targetMultiplier, win },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'completed'
    });
    await round.save();

    const updatedUser = await User.findById(req.user._id);

    res.json({
      result: Math.floor(result * 100) / 100,
      target: targetMultiplier,
      win,
      winAmount,
      profit: winAmount - betAmount,
      balance: updatedUser.balance,
      serverSeed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== KENO ====================
router.post('/keno/play', auth, async (req, res) => {
  try {
    const { betAmount, selectedNumbers } = req.body;

    if (!selectedNumbers || selectedNumbers.length < 1 || selectedNumbers.length > 10) {
      return res.status(400).json({ error: 'Select 1-10 numbers' });
    }

    const user = await processBet(req.user._id, betAmount, 'keno');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const drawnNumbers = ProvablyFair.getKenoResult(serverSeed, clientSeed, nonce, 10, 40);
    const hits = selectedNumbers.filter(n => drawnNumbers.includes(n));

    // Keno payouts based on selections and hits
    const payouts = {
      1: { 0: 0, 1: 3.96 },
      2: { 0: 0, 1: 1, 2: 9 },
      3: { 0: 0, 1: 0, 2: 2, 3: 25 },
      4: { 0: 0, 1: 0, 2: 1.5, 3: 5, 4: 80 },
      5: { 0: 0, 1: 0, 2: 1, 3: 3, 4: 12, 5: 300 },
      6: { 0: 0, 1: 0, 2: 0, 3: 2, 4: 7, 5: 50, 6: 1000 },
      7: { 0: 0, 1: 0, 2: 0, 3: 1, 4: 4, 5: 20, 6: 100, 7: 3000 },
      8: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 3, 5: 10, 6: 50, 7: 500, 8: 10000 },
      9: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 2, 5: 5, 6: 25, 7: 200, 8: 2000, 9: 30000 },
      10: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 1, 5: 3, 6: 15, 7: 100, 8: 1000, 9: 10000, 10: 100000 }
    };

    const multiplier = payouts[selectedNumbers.length]?.[hits.length] || 0;
    const winAmount = betAmount * multiplier;

    if (winAmount > 0) await processWin(req.user._id, winAmount);

    const round = new GameRound({
      game: 'keno',
      user: req.user._id,
      betAmount,
      winAmount,
      multiplier,
      profit: winAmount - betAmount,
      result: { drawnNumbers, selectedNumbers, hits, hitCount: hits.length },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'completed'
    });
    await round.save();

    const updatedUser = await User.findById(req.user._id);

    res.json({
      drawnNumbers,
      hits,
      hitCount: hits.length,
      multiplier,
      winAmount,
      profit: winAmount - betAmount,
      balance: updatedUser.balance,
      serverSeed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== HI-LO ====================
router.post('/hilo/play', auth, async (req, res) => {
  try {
    const { betAmount, guess } = req.body; // guess: 'higher' or 'lower'
    if (!['higher', 'lower'].includes(guess)) {
      return res.status(400).json({ error: 'Choose higher or lower' });
    }

    const user = await processBet(req.user._id, betAmount, 'hilo');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const cards = ProvablyFair.getCards(serverSeed, clientSeed, nonce, 2);
    const card1Value = (cards[0] % 13) + 1;
    const card2Value = (cards[1] % 13) + 1;

    const win = guess === 'higher' ? card2Value >= card1Value : card2Value <= card1Value;
    const winAmount = win ? betAmount * 1.96 : 0;

    if (win) await processWin(req.user._id, winAmount);

    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];

    const round = new GameRound({
      game: 'hilo',
      user: req.user._id,
      betAmount,
      winAmount,
      multiplier: win ? 1.96 : 0,
      profit: winAmount - betAmount,
      result: {
        card1: { value: card1Value, suit: suits[Math.floor(cards[0] / 13)] },
        card2: { value: card2Value, suit: suits[Math.floor(cards[1] / 13)] },
        guess, win
      },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'completed'
    });
    await round.save();

    const updatedUser = await User.findById(req.user._id);

    res.json({
      card1: { value: card1Value, suit: suits[Math.floor(cards[0] / 13)] },
      card2: { value: card2Value, suit: suits[Math.floor(cards[1] / 13)] },
      guess,
      win,
      winAmount,
      profit: winAmount - betAmount,
      balance: updatedUser.balance,
      serverSeed
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== BLACKJACK ====================
router.post('/blackjack/deal', auth, async (req, res) => {
  try {
    const { betAmount } = req.body;
    const user = await processBet(req.user._id, betAmount, 'blackjack');

    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const cards = ProvablyFair.getCards(serverSeed, clientSeed, nonce, 8); // Pre-generate cards
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    const toCard = (idx) => ({
      suit: suits[Math.floor(cards[idx] / 13)],
      value: values[cards[idx] % 13],
      numValue: Math.min((cards[idx] % 13) + 1, 10) || 10
    });

    const playerHand = [toCard(0), toCard(1)];
    const dealerHand = [toCard(2), toCard(3)];

    const getHandValue = (hand) => {
      let value = 0, aces = 0;
      hand.forEach(c => {
        if (c.value === 'A') { aces++; value += 11; }
        else if (['J','Q','K'].includes(c.value)) value += 10;
        else value += parseInt(c.value);
      });
      while (value > 21 && aces > 0) { value -= 10; aces--; }
      return value;
    };

    const playerValue = getHandValue(playerHand);
    const dealerValue = getHandValue(dealerHand);

    // Check for blackjack
    const playerBlackjack = playerValue === 21;
    const dealerBlackjack = dealerValue === 21;

    const round = new GameRound({
      game: 'blackjack',
      user: req.user._id,
      betAmount,
      result: {
        playerHand, dealerHand, cardIndex: 4,
        allCards: cards, status: 'playing'
      },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'active'
    });

    if (playerBlackjack && dealerBlackjack) {
      round.status = 'completed';
      round.result.status = 'push';
      round.winAmount = betAmount;
      round.profit = 0;
      await processWin(req.user._id, betAmount);
    } else if (playerBlackjack) {
      round.status = 'completed';
      round.result.status = 'blackjack';
      const winAmount = betAmount * 2.5;
      round.winAmount = winAmount;
      round.multiplier = 2.5;
      round.profit = winAmount - betAmount;
      await processWin(req.user._id, winAmount);
    }

    await round.save();

    res.json({
      roundId: round._id,
      playerHand,
      dealerHand: [dealerHand[0], { suit: 'hidden', value: 'hidden' }], // Hide dealer's second card
      playerValue,
      isBlackjack: playerBlackjack,
      isDealerBlackjack: dealerBlackjack,
      status: round.result.status,
      balance: (await User.findById(req.user._id)).balance
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== BACCARAT ====================
router.post('/baccarat/play', auth, async (req, res) => {
  try {
    const { betAmount, betOn } = req.body; // betOn: 'player', 'banker', 'tie'
    if (!['player', 'banker', 'tie'].includes(betOn)) {
      return res.status(400).json({ error: 'Bet on player, banker or tie' });
    }

    const user = await processBet(req.user._id, betAmount, 'baccarat');
    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    const cards = ProvablyFair.getCards(serverSeed, clientSeed, nonce, 6);
    const cardValue = (c) => { const v = (c % 13) + 1; return v >= 10 ? 0 : v; };
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const names = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const toCard = (i) => ({ suit: suits[Math.floor(cards[i]/13)], name: names[cards[i]%13], value: cardValue(cards[i]) });

    let playerCards = [toCard(0), toCard(1)];
    let bankerCards = [toCard(2), toCard(3)];
    let playerTotal = (playerCards[0].value + playerCards[1].value) % 10;
    let bankerTotal = (bankerCards[0].value + bankerCards[1].value) % 10;

    // Third card rules
    let playerThird = null, bankerThird = null;
    if (playerTotal <= 5) { playerThird = toCard(4); playerCards.push(playerThird); playerTotal = (playerTotal + playerThird.value) % 10; }
    if (bankerTotal <= 5 && !playerThird) { bankerThird = toCard(5); bankerCards.push(bankerThird); bankerTotal = (bankerTotal + bankerThird.value) % 10; }
    else if (playerThird && bankerTotal <= 2) { bankerThird = toCard(5); bankerCards.push(bankerThird); bankerTotal = (bankerTotal + bankerThird.value) % 10; }

    let winner = playerTotal > bankerTotal ? 'player' : bankerTotal > playerTotal ? 'banker' : 'tie';
    let multiplier = 0;
    if (betOn === winner) {
      multiplier = betOn === 'player' ? 2 : betOn === 'banker' ? 1.95 : 8;
    }
    const winAmount = betAmount * multiplier;
    if (winAmount > 0) await processWin(req.user._id, winAmount);

    const round = new GameRound({
      game: 'baccarat', user: req.user._id, betAmount, winAmount, multiplier,
      profit: winAmount - betAmount,
      result: { playerCards, bankerCards, playerTotal, bankerTotal, winner, betOn },
      seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) },
      status: 'completed'
    });
    await round.save();
    const updatedUser = await User.findById(req.user._id);
    const io = req.app.get('io');
    io.broadcastBet({ username: req.user.username, game: 'Baccarat', amount: betAmount, multiplier, profit: winAmount - betAmount });

    res.json({ playerCards, bankerCards, playerTotal, bankerTotal, winner, betOn, win: betOn === winner, multiplier, winAmount, profit: winAmount - betAmount, balance: updatedUser.balance, serverSeed });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==================== DRAGON TIGER ====================
router.post('/dragon-tiger/play', auth, async (req, res) => {
  try {
    const { betAmount, betOn } = req.body;
    if (!['dragon', 'tiger', 'tie'].includes(betOn)) {
      return res.status(400).json({ error: 'Bet on dragon, tiger or tie' });
    }
    const user = await processBet(req.user._id, betAmount, 'dragon-tiger');
    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();
    const cards = ProvablyFair.getCards(serverSeed, clientSeed, nonce, 2);
    const suits = ['hearts','diamonds','clubs','spades'];
    const names = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const dragonCard = { suit: suits[Math.floor(cards[0]/13)], name: names[cards[0]%13], value: (cards[0]%13)+1 };
    const tigerCard = { suit: suits[Math.floor(cards[1]/13)], name: names[cards[1]%13], value: (cards[1]%13)+1 };
    let winner = dragonCard.value > tigerCard.value ? 'dragon' : tigerCard.value > dragonCard.value ? 'tiger' : 'tie';
    let multiplier = 0;
    if (betOn === winner) { multiplier = betOn === 'tie' ? 8 : 1.96; }
    const winAmount = betAmount * multiplier;
    if (winAmount > 0) await processWin(req.user._id, winAmount);
    const round = new GameRound({ game: 'dragon-tiger', user: req.user._id, betAmount, winAmount, multiplier, profit: winAmount - betAmount, result: { dragonCard, tigerCard, winner, betOn }, seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) }, status: 'completed' });
    await round.save();
    const updatedUser = await User.findById(req.user._id);
    res.json({ dragonCard, tigerCard, winner, betOn, win: betOn === winner, multiplier, winAmount, profit: winAmount - betAmount, balance: updatedUser.balance, serverSeed });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==================== TEEN PATTI ====================
router.post('/teen-patti/play', auth, async (req, res) => {
  try {
    const { betAmount, betOn } = req.body;
    if (!['playerA', 'playerB'].includes(betOn)) return res.status(400).json({ error: 'Bet on playerA or playerB' });
    const user = await processBet(req.user._id, betAmount, 'teen-patti');
    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();
    const cards = ProvablyFair.getCards(serverSeed, clientSeed, nonce, 6);
    const suits = ['hearts','diamonds','clubs','spades'];
    const names = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const toCard = (i) => ({ suit: suits[Math.floor(cards[i]/13)], name: names[cards[i]%13], value: (cards[i]%13)+1 });
    const handA = [toCard(0), toCard(1), toCard(2)];
    const handB = [toCard(3), toCard(4), toCard(5)];
    const handScore = (h) => h.reduce((s,c) => s + c.value, 0);
    const scoreA = handScore(handA);
    const scoreB = handScore(handB);
    const winner = scoreA >= scoreB ? 'playerA' : 'playerB';
    const win = betOn === winner;
    const multiplier = win ? 1.96 : 0;
    const winAmount = win ? betAmount * multiplier : 0;
    if (winAmount > 0) await processWin(req.user._id, winAmount);
    const round = new GameRound({ game: 'teen-patti', user: req.user._id, betAmount, winAmount, multiplier, profit: winAmount - betAmount, result: { handA, handB, scoreA, scoreB, winner, betOn }, seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) }, status: 'completed' });
    await round.save();
    const updatedUser = await User.findById(req.user._id);
    res.json({ handA, handB, scoreA, scoreB, winner, betOn, win, multiplier, winAmount, profit: winAmount - betAmount, balance: updatedUser.balance, serverSeed });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==================== ANDAR BAHAR ====================
router.post('/andar-bahar/play', auth, async (req, res) => {
  try {
    const { betAmount, betOn } = req.body;
    if (!['andar', 'bahar'].includes(betOn)) return res.status(400).json({ error: 'Bet on andar or bahar' });
    const user = await processBet(req.user._id, betAmount, 'andar-bahar');
    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();
    const allCards = ProvablyFair.getCards(serverSeed, clientSeed, nonce, 30);
    const suits = ['hearts','diamonds','clubs','spades'];
    const names = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const toCard = (i) => ({ suit: suits[Math.floor(allCards[i]/13)], name: names[allCards[i]%13], value: (allCards[i]%13)+1 });
    const joker = toCard(0);
    let andarCards = [], baharCards = [], winner = null, cardIdx = 1;
    for (let i = 0; i < 14; i++) {
      const card = toCard(cardIdx++);
      if (i % 2 === 0) { andarCards.push(card); if (card.value === joker.value) { winner = 'andar'; break; } }
      else { baharCards.push(card); if (card.value === joker.value) { winner = 'bahar'; break; } }
    }
    if (!winner) winner = Math.random() > 0.5 ? 'andar' : 'bahar';
    const win = betOn === winner;
    const multiplier = win ? 1.96 : 0;
    const winAmount = win ? betAmount * multiplier : 0;
    if (winAmount > 0) await processWin(req.user._id, winAmount);
    const round = new GameRound({ game: 'andar-bahar', user: req.user._id, betAmount, winAmount, multiplier, profit: winAmount - betAmount, result: { joker, andarCards, baharCards, winner, betOn, totalRounds: andarCards.length + baharCards.length }, seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) }, status: 'completed' });
    await round.save();
    const updatedUser = await User.findById(req.user._id);
    res.json({ joker, andarCards, baharCards, winner, betOn, win, multiplier, winAmount, profit: winAmount - betAmount, balance: updatedUser.balance, serverSeed });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==================== TOWER ====================
router.post('/tower/start', auth, async (req, res) => {
  try {
    const { betAmount, difficulty } = req.body;
    const cols = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 2 : 3;
    const user = await processBet(req.user._id, betAmount, 'tower');
    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();
    const safeColumns = ProvablyFair.getTowerResult(serverSeed, clientSeed, nonce, 10, cols);
    const round = new GameRound({ game: 'tower', user: req.user._id, betAmount, result: { safeColumns, difficulty, cols, currentRow: 0 }, seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) }, status: 'active' });
    await round.save();
    res.json({ roundId: round._id, hash: round.seed.hash, difficulty, cols, rows: 10, balance: user.balance });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

router.post('/tower/climb', auth, async (req, res) => {
  try {
    const { roundId, column } = req.body;
    const round = await GameRound.findOne({ _id: roundId, user: req.user._id, status: 'active', game: 'tower' });
    if (!round) return res.status(404).json({ error: 'Round not found' });
    const currentRow = round.result.currentRow;
    const safe = round.result.safeColumns[currentRow] === column;
    if (!safe) {
      round.status = 'completed'; round.winAmount = 0; round.profit = -round.betAmount;
      round.result.currentRow = currentRow;
      await round.save();
      return res.json({ safe: false, correctColumn: round.result.safeColumns[currentRow], allSafe: round.result.safeColumns, winAmount: 0, balance: (await User.findById(req.user._id)).balance, serverSeed: round.seed.serverSeed });
    }
    round.result.currentRow = currentRow + 1;
    const multipliers = { easy: [1, 1.31, 1.74, 2.32, 3.09, 4.12, 5.49, 7.32, 9.76, 13.01], hard: [1, 1.96, 3.84, 7.53, 14.75, 28.91, 56.66, 111.05, 217.65, 426.80], medium: [1, 1.47, 2.17, 3.18, 4.68, 6.88, 10.12, 14.88, 21.89, 32.18] };
    const mult = multipliers[round.result.difficulty || 'medium'][currentRow];
    round.multiplier = mult;
    await round.save();
    res.json({ safe: true, currentRow: currentRow + 1, multiplier: mult, potentialWin: round.betAmount * mult });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

router.post('/tower/cashout', auth, async (req, res) => {
  try {
    const { roundId } = req.body;
    const round = await GameRound.findOne({ _id: roundId, user: req.user._id, status: 'active', game: 'tower' });
    if (!round || round.result.currentRow === 0) return res.status(400).json({ error: 'Climb at least one level' });
    const winAmount = round.betAmount * round.multiplier;
    round.winAmount = winAmount; round.profit = winAmount - round.betAmount; round.status = 'completed';
    await round.save();
    const user = await processWin(req.user._id, winAmount);
    res.json({ winAmount, multiplier: round.multiplier, profit: round.profit, balance: user.balance, allSafe: round.result.safeColumns, serverSeed: round.seed.serverSeed });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==================== AVIATOR (Crash Variant) ====================
router.post('/aviator/bet', auth, async (req, res) => {
  try {
    const { betAmount } = req.body;
    const user = await processBet(req.user._id, betAmount, 'aviator');
    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();
    const flyAwayAt = ProvablyFair.getCrashResult(serverSeed, clientSeed, nonce);
    const round = new GameRound({ game: 'aviator', user: req.user._id, betAmount, result: { flyAwayAt }, seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) }, status: 'active' });
    await round.save();
    res.json({ roundId: round._id, hash: round.seed.hash, balance: user.balance });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

router.post('/aviator/cashout', auth, async (req, res) => {
  try {
    const { roundId, multiplier } = req.body;
    const round = await GameRound.findOne({ _id: roundId, user: req.user._id, status: 'active', game: 'aviator' });
    if (!round) return res.status(404).json({ error: 'Round not found' });
    if (multiplier > round.result.flyAwayAt) return res.status(400).json({ error: 'Plane flew away!' });
    const winAmount = round.betAmount * multiplier;
    round.winAmount = winAmount; round.multiplier = multiplier; round.profit = winAmount - round.betAmount; round.status = 'completed';
    await round.save();
    const user = await processWin(req.user._id, winAmount);
    const io = req.app.get('io');
    io.broadcastBet({ username: req.user.username, game: 'Aviator', amount: round.betAmount, multiplier, profit: round.profit });
    res.json({ winAmount, multiplier, profit: round.profit, balance: user.balance, serverSeed: round.seed.serverSeed });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==================== COLOR GAME ====================
router.post('/color-game/play', auth, async (req, res) => {
  try {
    const { betAmount, color } = req.body;
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];
    if (!colors.includes(color)) return res.status(400).json({ error: 'Invalid color' });
    const user = await processBet(req.user._id, betAmount, 'color-game');
    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();
    const hash = ProvablyFair.generateHash(serverSeed, clientSeed, nonce);
    const float = ProvablyFair.hashToFloat(hash);
    const dice = [colors[Math.floor(float * 6)], colors[Math.floor(ProvablyFair.hashToFloat(ProvablyFair.generateHash(serverSeed, clientSeed+'1', nonce)) * 6)], colors[Math.floor(ProvablyFair.hashToFloat(ProvablyFair.generateHash(serverSeed, clientSeed+'2', nonce)) * 6)]];
    const matches = dice.filter(d => d === color).length;
    const multipliers = { 0: 0, 1: 1.8, 2: 3.5, 3: 8 };
    const multiplier = multipliers[matches];
    const winAmount = betAmount * multiplier;
    if (winAmount > 0) await processWin(req.user._id, winAmount);
    const round = new GameRound({ game: 'color-game', user: req.user._id, betAmount, winAmount, multiplier, profit: winAmount - betAmount, result: { dice, color, matches }, seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) }, status: 'completed' });
    await round.save();
    const updatedUser = await User.findById(req.user._id);
    res.json({ dice, color, matches, win: matches > 0, multiplier, winAmount, profit: winAmount - betAmount, balance: updatedUser.balance, serverSeed });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==================== VIDEO POKER ====================
router.post('/video-poker/play', auth, async (req, res) => {
  try {
    const { betAmount } = req.body;
    const user = await processBet(req.user._id, betAmount, 'video-poker');
    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();
    const cardIndexes = ProvablyFair.getCards(serverSeed, clientSeed, nonce, 10);
    const suits = ['hearts','diamonds','clubs','spades'];
    const names = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const toCard = (i) => ({ suit: suits[Math.floor(cardIndexes[i]/13)], name: names[cardIndexes[i]%13], value: (cardIndexes[i]%13)+1 });
    const hand = [toCard(0), toCard(1), toCard(2), toCard(3), toCard(4)];
    const values = hand.map(c => c.value).sort((a,b) => a-b);
    const suitSet = new Set(hand.map(c => c.suit));
    const isFlush = suitSet.size === 1;
    const isStraight = values[4]-values[0]===4 && new Set(values).size===5;
    const counts = {};
    values.forEach(v => counts[v] = (counts[v]||0)+1);
    const freq = Object.values(counts).sort((a,b)=>b-a);
    let handName = 'High Card', multiplier = 0;
    if (isFlush && isStraight && values[4]===13) { handName='Royal Flush'; multiplier=250; }
    else if (isFlush && isStraight) { handName='Straight Flush'; multiplier=50; }
    else if (freq[0]===4) { handName='Four of a Kind'; multiplier=25; }
    else if (freq[0]===3 && freq[1]===2) { handName='Full House'; multiplier=9; }
    else if (isFlush) { handName='Flush'; multiplier=6; }
    else if (isStraight) { handName='Straight'; multiplier=4; }
    else if (freq[0]===3) { handName='Three of a Kind'; multiplier=3; }
    else if (freq[0]===2 && freq[1]===2) { handName='Two Pair'; multiplier=2; }
    else if (freq[0]===2 && values.find(v=>counts[v]===2)>=11) { handName='Jacks or Better'; multiplier=1; }
    const winAmount = betAmount * multiplier;
    if (winAmount > 0) await processWin(req.user._id, winAmount);
    const round = new GameRound({ game: 'video-poker', user: req.user._id, betAmount, winAmount, multiplier, profit: winAmount-betAmount, result: { hand, handName }, seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) }, status: 'completed' });
    await round.save();
    const updatedUser = await User.findById(req.user._id);
    res.json({ hand, handName, win: multiplier>0, multiplier, winAmount, profit: winAmount-betAmount, balance: updatedUser.balance, serverSeed });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==================== SCRATCH CARD ====================
router.post('/scratch-card/play', auth, async (req, res) => {
  try {
    const { betAmount } = req.body;
    const user = await processBet(req.user._id, betAmount, 'scratch-card');
    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();
    const symbols = ['cherry','lemon','orange','grape','bell','star','seven','diamond'];
    const grid = [];
    for (let i = 0; i < 9; i++) {
      const hash = ProvablyFair.generateHash(serverSeed, clientSeed+i, nonce);
      const float = ProvablyFair.hashToFloat(hash);
      grid.push(symbols[Math.floor(float * symbols.length)]);
    }
    // Count matches
    const counts = {};
    grid.forEach(s => counts[s] = (counts[s]||0)+1);
    const maxMatch = Math.max(...Object.values(counts));
    const matchSymbol = Object.keys(counts).find(k => counts[k] === maxMatch);
    const multipliers = { 3: 1.5, 4: 3, 5: 8, 6: 20, 7: 50, 8: 100, 9: 500 };
    const multiplier = multipliers[maxMatch] || 0;
    const winAmount = betAmount * multiplier;
    if (winAmount > 0) await processWin(req.user._id, winAmount);
    const round = new GameRound({ game: 'scratch-card', user: req.user._id, betAmount, winAmount, multiplier, profit: winAmount-betAmount, result: { grid, maxMatch, matchSymbol }, seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) }, status: 'completed' });
    await round.save();
    const updatedUser = await User.findById(req.user._id);
    res.json({ grid, maxMatch, matchSymbol, win: multiplier>0, multiplier, winAmount, profit: winAmount-betAmount, balance: updatedUser.balance, serverSeed });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==================== THEMED SLOTS ENGINE ====================
router.post('/themed-slots/spin', auth, async (req, res) => {
  try {
    const { betAmount, slotId } = req.body;
    const slotConfigs = {
      'golden-dragon': { symbols: ['🐉','🔥','💰','🏮','🎎','🀄','🧧','💎','⭐','🌟'], name: 'Golden Dragon', maxMultiplier: 500 },
      'fortune-tiger': { symbols: ['🐅','🎋','🏮','💰','🧧','🎎','🔮','💎','⭐','🌙'], name: 'Fortune Tiger', maxMultiplier: 888 },
      'lucky-neko': { symbols: ['🐱','🎏','🏮','💰','🐟','🎎','🔔','💎','⭐','🍀'], name: 'Lucky Neko', maxMultiplier: 300 },
      'money-coming': { symbols: ['💵','💰','🤑','💎','🏦','💳','🪙','👑','⭐','🔥'], name: 'Money Coming', maxMultiplier: 1000 },
      'treasure-hunt': { symbols: ['🗺️','💎','🏴‍☠️','⚓','🦜','🗡️','💰','👑','⭐','🌊'], name: 'Treasure Hunt', maxMultiplier: 600 },
      'wild-west': { symbols: ['🤠','🐎','💰','🌵','🔫','🏜️','⭐','💎','🎯','🦅'], name: 'Wild West Gold', maxMultiplier: 500 },
      'pharaoh-gold': { symbols: ['👁️','🏛️','🐍','💰','🪲','⚱️','🔮','💎','⭐','☀️'], name: 'Pharaoh Gold', maxMultiplier: 750 },
      'diamond-rush': { symbols: ['💎','💠','🔷','🔹','✨','👑','💰','⭐','🌟','🔥'], name: 'Diamond Rush', maxMultiplier: 400 },
      'fruit-party': { symbols: ['🍒','🍋','🍊','🍇','🍉','🍓','🍌','💎','⭐','🔥'], name: 'Fruit Party', maxMultiplier: 200 },
      'mega-jackpot': { symbols: ['7️⃣','💎','👑','🔔','🍀','💰','⭐','🎰','🔥','🌟'], name: 'Mega Jackpot', maxMultiplier: 2000 },
      'sweet-bonanza': { symbols: ['🍭','🍬','🧁','🍩','🍪','🎂','💎','⭐','🔥','💰'], name: 'Sweet Bonanza', maxMultiplier: 500 },
      'gates-of-olympus': { symbols: ['⚡','🏛️','👑','🔱','🦅','💎','💰','⭐','🔥','🌊'], name: 'Gates of Olympus', maxMultiplier: 1000 },
      'starlight-princess': { symbols: ['👸','🌟','💖','🦋','🌸','💎','💰','⭐','✨','🔮'], name: 'Starlight Princess', maxMultiplier: 500 },
      'sugar-rush': { symbols: ['🍭','🍬','🧁','🍩','🍪','🍫','💎','⭐','🔥','💰'], name: 'Sugar Rush', maxMultiplier: 300 },
      'big-bass': { symbols: ['🐟','🎣','🐠','🦈','🐡','🌊','💎','💰','⭐','🔥'], name: 'Big Bass Bonanza', maxMultiplier: 400 },
      'hot-fiesta': { symbols: ['🌶️','🎸','💃','🌮','🎺','🎭','💎','💰','⭐','🔥'], name: 'Hot Fiesta', maxMultiplier: 500 },
      'zeus': { symbols: ['⚡','🏛️','👑','🦅','🔱','🌩️','💎','💰','⭐','🔥'], name: 'Zeus', maxMultiplier: 700 },
      'buffalo-king': { symbols: ['🦬','🦅','🐺','🏔️','🌅','🪶','💎','💰','⭐','🔥'], name: 'Buffalo King', maxMultiplier: 600 },
      'wolf-gold': { symbols: ['🐺','🌕','🦅','🐎','🏜️','🌵','💎','💰','⭐','🔥'], name: 'Wolf Gold', maxMultiplier: 500 },
      'book-of-ra': { symbols: ['📖','👁️','🏛️','🐍','⚱️','🪲','💎','💰','⭐','🔥'], name: 'Book of Ra', maxMultiplier: 750 }
    };

    const config = slotConfigs[slotId];
    if (!config) return res.status(400).json({ error: 'Invalid slot game' });

    const user = await processBet(req.user._id, betAmount, 'slots');
    const serverSeed = ProvablyFair.generateServerSeed();
    const clientSeed = req.body.clientSeed || 'default';
    const nonce = Date.now();

    // Generate 5x3 grid
    const grid = [];
    for (let row = 0; row < 3; row++) {
      const reelResult = ProvablyFair.getSlotResult(serverSeed, clientSeed + row, nonce, 5, config.symbols.length);
      grid.push(reelResult.map(i => config.symbols[i]));
    }

    // Check wins across rows + diagonals
    let totalMultiplier = 0;
    const winLines = [];
    const checkLine = (line, lineIdx) => {
      if (line[0]===line[1] && line[1]===line[2] && line[2]===line[3] && line[3]===line[4]) {
        const sym = line[0];
        const idx = config.symbols.indexOf(sym);
        const mult = idx <= 1 ? 100 : idx <= 3 ? 25 : idx <= 5 ? 10 : 5;
        totalMultiplier += mult;
        winLines.push({ line: lineIdx, symbols: line, count: 5, multiplier: mult });
      } else if (line[0]===line[1] && line[1]===line[2] && line[2]===line[3]) {
        const idx = config.symbols.indexOf(line[0]);
        const mult = idx <= 1 ? 25 : idx <= 3 ? 8 : idx <= 5 ? 4 : 2;
        totalMultiplier += mult;
        winLines.push({ line: lineIdx, symbols: line.slice(0,4), count: 4, multiplier: mult });
      } else if (line[0]===line[1] && line[1]===line[2]) {
        const idx = config.symbols.indexOf(line[0]);
        const mult = idx <= 1 ? 10 : idx <= 3 ? 4 : idx <= 5 ? 2 : 1;
        totalMultiplier += mult;
        winLines.push({ line: lineIdx, symbols: line.slice(0,3), count: 3, multiplier: mult });
      }
    };

    // 3 rows + 2 diagonals
    for (let r = 0; r < 3; r++) checkLine(grid[r], r);
    checkLine([grid[0][0], grid[1][1], grid[2][2], grid[1][3], grid[0][4]], 'diag1');
    checkLine([grid[2][0], grid[1][1], grid[0][2], grid[1][3], grid[2][4]], 'diag2');

    // Scatter bonus
    let scatterCount = 0;
    const scatterSym = config.symbols[config.symbols.length - 2]; // Star is scatter
    grid.forEach(row => row.forEach(sym => { if (sym === scatterSym) scatterCount++; }));
    const freeSpins = scatterCount >= 3 ? scatterCount * 5 : 0;
    if (freeSpins > 0) totalMultiplier += scatterCount * 2;

    const winAmount = betAmount * totalMultiplier;
    if (winAmount > 0) await processWin(req.user._id, winAmount);

    const round = new GameRound({ game: 'slots', user: req.user._id, betAmount, winAmount, multiplier: totalMultiplier, profit: winAmount - betAmount, result: { grid, winLines, freeSpins, scatterCount, slotId, slotName: config.name }, seed: { serverSeed, clientSeed, nonce, hash: ProvablyFair.hashServerSeed(serverSeed) }, status: 'completed' });
    await round.save();
    const updatedUser = await User.findById(req.user._id);
    const io = req.app.get('io');
    if (winAmount > 5000) io.broadcastBigWin({ username: req.user.username, game: config.name, amount: winAmount, multiplier: totalMultiplier });
    io.broadcastBet({ username: req.user.username, game: config.name, amount: betAmount, multiplier: totalMultiplier, profit: winAmount - betAmount });

    res.json({ grid, winLines, totalMultiplier, winAmount, profit: winAmount - betAmount, freeSpins, slotName: config.name, balance: updatedUser.balance, serverSeed });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// Game history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, game } = req.query;
    const query = { user: req.user._id };
    if (game) query.game = game;

    const rounds = await GameRound.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-seed.serverSeed -result.minePositions -result.allCards');

    const total = await GameRound.countDocuments(query);

    res.json({ rounds, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
