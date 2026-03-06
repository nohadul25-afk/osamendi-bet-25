import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SlotsGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState([
    ['❓', '❓', '❓', '❓', '❓'],
    ['❓', '❓', '❓', '❓', '❓'],
    ['❓', '❓', '❓', '❓', '❓']
  ]);
  const [result, setResult] = useState(null);
  const [winLines, setWinLines] = useState([]);

  const symbolEmoji = {
    'DIAMOND': '💎', '7': '7️⃣', 'STAR': '⭐', 'BAR': '🍫', 'BELL': '🔔',
    'CHERRY': '🍒', 'LEMON': '🍋', 'ORANGE': '🍊', 'PLUM': '🍇', 'GRAPE': '🍇'
  };

  const spin = async () => {
    if (!user) return toast.error('Please login first');
    setSpinning(true);
    setWinLines([]);
    setResult(null);

    // Spin animation
    const animInterval = setInterval(() => {
      const symbols = Object.values(symbolEmoji);
      setGrid([
        Array(5).fill(0).map(() => symbols[Math.floor(Math.random() * symbols.length)]),
        Array(5).fill(0).map(() => symbols[Math.floor(Math.random() * symbols.length)]),
        Array(5).fill(0).map(() => symbols[Math.floor(Math.random() * symbols.length)])
      ]);
    }, 100);

    try {
      const { data } = await gamesAPI.slotsSpin({
        betAmount: parseFloat(betAmount),
        clientSeed: 'slots-' + Date.now()
      });

      setTimeout(() => {
        clearInterval(animInterval);
        const displayGrid = data.grid.map(row => row.map(sym => symbolEmoji[sym] || sym));
        setGrid(displayGrid);
        setResult(data);
        setWinLines(data.winLines);
        setSpinning(false);
        updateBalance();

        if (data.winAmount > 0) {
          toast.success(`Won ৳${data.winAmount.toFixed(2)}! (${data.totalMultiplier}x)`);
        }
      }, 1500);
    } catch (error) {
      clearInterval(animInterval);
      setSpinning(false);
      toast.error(error.response?.data?.error || 'Spin failed');
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Slots / স্লটস</h1>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
          {/* Slot Machine */}
          <div style={{
            background: '#0d1117', borderRadius: 16, padding: 24, marginBottom: 20,
            border: '3px solid var(--primary)', boxShadow: 'var(--shadow-gold)'
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 16 }}>
              OSAMENDI BET 25 SLOTS
            </div>
            {grid.map((row, ri) => (
              <div key={ri} style={{
                display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8,
                background: winLines.some(w => w.line === ri) ? 'rgba(245,166,35,0.1)' : 'transparent',
                borderRadius: 8, padding: '8px 4px'
              }}>
                {row.map((sym, ci) => (
                  <div key={ci} style={{
                    width: 70, height: 70, background: 'var(--bg-card)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, border: '1px solid var(--border)',
                    animation: spinning ? 'pulse 0.2s infinite' : 'none'
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
              background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)',
              borderRadius: 10, padding: 16, marginBottom: 16
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>
                WON ৳{result.winAmount.toFixed(2)}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {result.totalMultiplier}x multiplier | {result.winLines.length} winning line(s)
              </div>
              {result.freeSpins > 0 && (
                <div style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 4 }}>
                  +{result.freeSpins} Free Spins!
                </div>
              )}
            </div>
          )}

          {/* Bet Controls */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <button onClick={() => setBetAmount(prev => Math.max(10, parseFloat(prev) - 50).toString())}
              style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>-</button>
            <div style={{
              padding: '8px 24px', background: 'var(--bg-input)', borderRadius: 10,
              border: '1px solid var(--border)', minWidth: 120, textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>BET AMOUNT</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>৳{betAmount}</div>
            </div>
            <button onClick={() => setBetAmount(prev => (parseFloat(prev) + 50).toString())}
              style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>+</button>
          </div>

          <button onClick={spin} className="btn btn-primary btn-lg btn-full" disabled={spinning}
            style={{ fontSize: 18, padding: '16px 32px' }}>
            {spinning ? 'SPINNING...' : 'SPIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlotsGame;
