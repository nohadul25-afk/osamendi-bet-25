import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const slotThemes = {
  'golden-dragon': {
    name: 'Golden Dragon', emoji: '🐉', bg: 'linear-gradient(135deg, #b8860b, #8b6914)',
    accent: '#f5a623', symbols: ['🐉', '🏮', '🧧', '💰', '🎋', '🔔', '⭐', '💎', '7️⃣']
  },
  'fortune-tiger': {
    name: 'Fortune Tiger', emoji: '🐯', bg: 'linear-gradient(135deg, #ff6b35, #c44d25)',
    accent: '#ff6b35', symbols: ['🐯', '🎍', '🧧', '💰', '🏵️', '🔥', '⭐', '💎', '7️⃣']
  },
  'lucky-neko': {
    name: 'Lucky Neko', emoji: '🐱', bg: 'linear-gradient(135deg, #e91e63, #c2185b)',
    accent: '#e91e63', symbols: ['🐱', '🎏', '🍣', '🌸', '🏯', '🔔', '⭐', '💎', '7️⃣']
  },
  'money-coming': {
    name: 'Money Coming', emoji: '💸', bg: 'linear-gradient(135deg, #4caf50, #2e7d32)',
    accent: '#4caf50', symbols: ['💸', '💰', '🤑', '💵', '💳', '🔔', '⭐', '💎', '7️⃣']
  },
  'treasure-hunt': {
    name: 'Treasure Hunt', emoji: '🏴‍☠️', bg: 'linear-gradient(135deg, #795548, #5d4037)',
    accent: '#ff9800', symbols: ['🏴‍☠️', '🗺️', '💎', '🔱', '⚓', '🔔', '⭐', '💰', '7️⃣']
  },
  'wild-west': {
    name: 'Wild West', emoji: '🤠', bg: 'linear-gradient(135deg, #8d6e63, #6d4c41)',
    accent: '#ff8f00', symbols: ['🤠', '🐎', '🌵', '💰', '🔫', '🔔', '⭐', '💎', '7️⃣']
  },
  'pharaoh-gold': {
    name: 'Pharaoh Gold', emoji: '🏛️', bg: 'linear-gradient(135deg, #c9b037, #a08629)',
    accent: '#ffd700', symbols: ['🏛️', '👁️', '🐍', '🪲', '⚱️', '🔔', '⭐', '💎', '7️⃣']
  },
  'diamond-rush': {
    name: 'Diamond Rush', emoji: '💎', bg: 'linear-gradient(135deg, #00bcd4, #0097a7)',
    accent: '#00e5ff', symbols: ['💎', '💠', '🔷', '🔹', '✨', '🔔', '⭐', '💰', '7️⃣']
  },
  'fruit-party': {
    name: 'Fruit Party', emoji: '🍓', bg: 'linear-gradient(135deg, #e91e63, #ff5722)',
    accent: '#ff4081', symbols: ['🍓', '🍒', '🍋', '🍊', '🍇', '🍉', '🍌', '💎', '7️⃣']
  },
  'mega-jackpot': {
    name: 'Mega Jackpot', emoji: '🎰', bg: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
    accent: '#e040fb', symbols: ['🎰', '💰', '🤑', '💎', '👑', '🔔', '⭐', '7️⃣', '🃏']
  },
  'book-of-ra': {
    name: 'Book of Ra', emoji: '📜', bg: 'linear-gradient(135deg, #bf8f30, #8d6a1e)',
    accent: '#d4a437', symbols: ['📜', '🏺', '🐪', '👁️', '🏛️', '🔔', '⭐', '💎', '7️⃣']
  },
  'sweet-bonanza': {
    name: 'Sweet Bonanza', emoji: '🍬', bg: 'linear-gradient(135deg, #e91e63, #ff80ab)',
    accent: '#f50057', symbols: ['🍬', '🍭', '🧁', '🍩', '🎂', '🔔', '⭐', '💎', '7️⃣']
  },
  'gates-of-olympus': {
    name: 'Gates of Olympus', emoji: '⚡', bg: 'linear-gradient(135deg, #1565c0, #0d47a1)',
    accent: '#42a5f5', symbols: ['⚡', '👑', '🏛️', '🔱', '💎', '🔔', '⭐', '💰', '7️⃣']
  },
  'starlight-princess': {
    name: 'Starlight Princess', emoji: '👸', bg: 'linear-gradient(135deg, #ab47bc, #8e24aa)',
    accent: '#ce93d8', symbols: ['👸', '🌟', '💫', '🦋', '💎', '🔔', '⭐', '💰', '7️⃣']
  },
  'sugar-rush': {
    name: 'Sugar Rush', emoji: '🍫', bg: 'linear-gradient(135deg, #d81b60, #ff6090)',
    accent: '#f48fb1', symbols: ['🍫', '🍬', '🍭', '🧁', '🍪', '🔔', '⭐', '💎', '7️⃣']
  },
  'big-bass': {
    name: 'Big Bass', emoji: '🐟', bg: 'linear-gradient(135deg, #0277bd, #01579b)',
    accent: '#29b6f6', symbols: ['🐟', '🎣', '🐠', '🪱', '🌊', '🔔', '⭐', '💎', '7️⃣']
  },
  'hot-fiesta': {
    name: 'Hot Fiesta', emoji: '🌶️', bg: 'linear-gradient(135deg, #e64a19, #bf360c)',
    accent: '#ff6e40', symbols: ['🌶️', '🎸', '🪅', '🌮', '💃', '🔔', '⭐', '💎', '7️⃣']
  },
  'zeus': {
    name: 'Zeus', emoji: '⚡', bg: 'linear-gradient(135deg, #37474f, #263238)',
    accent: '#78909c', symbols: ['⚡', '🦅', '🏛️', '🔱', '👁️', '🔔', '⭐', '💎', '7️⃣']
  },
  'buffalo-king': {
    name: 'Buffalo King', emoji: '🦬', bg: 'linear-gradient(135deg, #4e342e, #3e2723)',
    accent: '#8d6e63', symbols: ['🦬', '🦅', '🐺', '🌄', '💰', '🔔', '⭐', '💎', '7️⃣']
  },
  'wolf-gold': {
    name: 'Wolf Gold', emoji: '🐺', bg: 'linear-gradient(135deg, #f57f17, #e65100)',
    accent: '#ffb300', symbols: ['🐺', '🦅', '🐎', '🌙', '💰', '🔔', '⭐', '💎', '7️⃣']
  }
};

const ThemedSlotsGame = () => {
  const { slotId } = useParams();
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState([
    ['❓', '❓', '❓', '❓', '❓'],
    ['❓', '❓', '❓', '❓', '❓'],
    ['❓', '❓', '❓', '❓', '❓']
  ]);
  const [result, setResult] = useState(null);

  const theme = slotThemes[slotId];
  if (!theme) {
    return (
      <div className="animate-fadeIn" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎰</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>Slot Not Found</h2>
        <button onClick={() => navigate('/casino')} className="btn btn-primary">Back to Casino</button>
      </div>
    );
  }

  const spin = async () => {
    if (!user) return toast.error('Please login first');
    setSpinning(true);
    setResult(null);

    const animInterval = setInterval(() => {
      setGrid([
        Array(5).fill(0).map(() => theme.symbols[Math.floor(Math.random() * theme.symbols.length)]),
        Array(5).fill(0).map(() => theme.symbols[Math.floor(Math.random() * theme.symbols.length)]),
        Array(5).fill(0).map(() => theme.symbols[Math.floor(Math.random() * theme.symbols.length)])
      ]);
    }, 80);

    try {
      const { data } = await gamesAPI.themedSlotsSpin({
        slotId: `slots-${slotId}`,
        betAmount: parseFloat(betAmount),
        clientSeed: `ts-${slotId}-${Date.now()}`
      });

      setTimeout(() => {
        clearInterval(animInterval);
        // Map server symbols to emojis
        const symbolMap = { 'DIAMOND': '💎', '7': '7️⃣', 'STAR': '⭐', 'BAR': '🍫', 'BELL': '🔔',
          'CHERRY': '🍒', 'LEMON': '🍋', 'ORANGE': '🍊', 'PLUM': '🍇', 'GRAPE': '🍇',
          'WILD': '🃏', 'SCATTER': '✨', 'BONUS': '🎁' };
        const displayGrid = data.grid
          ? data.grid.map(row => row.map(sym => symbolMap[sym] || theme.symbols[Math.floor(Math.random() * theme.symbols.length)]))
          : grid;
        setGrid(displayGrid);
        setResult(data);
        setSpinning(false);
        updateBalance();
        if (data.winAmount > 0) toast.success(`Won ৳${data.winAmount.toFixed(2)}! (${data.totalMultiplier}x)`);
      }, 1800);
    } catch (error) {
      clearInterval(animInterval);
      setSpinning(false);
      toast.error(error.response?.data?.error || 'Spin failed');
    }
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/casino')} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 14
        }}>← Back</button>
        <h1 style={{ fontSize: 24, fontWeight: 700, background: theme.bg, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {theme.emoji} {theme.name}
        </h1>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: theme.bg }} />

          {/* Slot Machine */}
          <div style={{
            background: '#0d1117', borderRadius: 16, padding: 20, marginBottom: 16,
            border: `3px solid ${theme.accent}`, boxShadow: `0 0 30px ${theme.accent}30`
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: theme.accent, marginBottom: 12, letterSpacing: 2 }}>
              {theme.name.toUpperCase()}
            </div>

            {grid.map((row, ri) => (
              <div key={ri} style={{
                display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 6,
                background: result?.winLines?.some(w => w.line === ri) ? `${theme.accent}15` : 'transparent',
                borderRadius: 8, padding: '6px 4px',
                transition: 'background 0.3s ease'
              }}>
                {row.map((sym, ci) => (
                  <div key={ci} style={{
                    width: 65, height: 65, background: 'var(--bg-card)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 30, border: `1px solid ${result?.winLines?.some(w => w.line === ri) ? theme.accent : 'var(--border)'}`,
                    animation: spinning ? `slotSpin 0.15s infinite ${ci * 0.05}s` : result?.winLines?.some(w => w.line === ri) ? 'winPop 0.5s ease' : 'none',
                    transition: 'border-color 0.3s ease'
                  }}>
                    {sym}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Result */}
          {result && result.winAmount > 0 && (
            <div style={{
              background: `${theme.accent}15`, border: `1px solid ${theme.accent}`,
              borderRadius: 12, padding: 16, marginBottom: 12, animation: 'slideUp 0.4s ease'
            }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: theme.accent, textShadow: `0 0 20px ${theme.accent}40` }}>
                WON ৳{result.winAmount.toFixed(2)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {result.totalMultiplier}x multiplier
                {result.freeSpins > 0 && ` | +${result.freeSpins} Free Spins!`}
              </div>
            </div>
          )}

          {/* Bet Controls */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <button onClick={() => setBetAmount(prev => Math.max(10, parseFloat(prev) - 50).toString())}
              style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>-</button>
            <div style={{
              padding: '8px 24px', background: 'var(--bg-input)', borderRadius: 10,
              border: '1px solid var(--border)', minWidth: 120, textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>BET</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: theme.accent }}>৳{betAmount}</div>
            </div>
            <button onClick={() => setBetAmount(prev => (parseFloat(prev) + 50).toString())}
              style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>+</button>
          </div>

          <button onClick={spin} className="btn btn-primary btn-lg btn-full" disabled={spinning}
            style={{ fontSize: 18, padding: '16px 32px', background: theme.bg, border: 'none' }}>
            {spinning ? 'SPINNING...' : 'SPIN'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slotSpin { 0% { transform: translateY(-4px); } 50% { transform: translateY(4px); } 100% { transform: translateY(-4px); } }
        @keyframes winPop { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
        @keyframes slideUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export { slotThemes };
export default ThemedSlotsGame;
