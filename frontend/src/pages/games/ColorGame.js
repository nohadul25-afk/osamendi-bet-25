import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const colors = [
  { id: 'red', label: 'Red', color: '#ef4444', pay: '2x' },
  { id: 'green', label: 'Green', color: '#10b981', pay: '3x' },
  { id: 'blue', label: 'Blue', color: '#3b82f6', pay: '2x' },
  { id: 'yellow', label: 'Yellow', color: '#f59e0b', pay: '3x' },
  { id: 'purple', label: 'Purple', color: '#8b5cf6', pay: '5x' },
  { id: 'white', label: 'White', color: '#e2e8f0', pay: '10x' }
];

const ColorGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [selectedColor, setSelectedColor] = useState('red');
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [diceResults, setDiceResults] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState([]);

  const play = async () => {
    if (!user) return toast.error('Please login first');
    setPlaying(true);
    setResult(null);
    setRolling(true);
    setDiceResults([]);

    // Rolling animation
    const rollInterval = setInterval(() => {
      setDiceResults([
        colors[Math.floor(Math.random() * 6)],
        colors[Math.floor(Math.random() * 6)],
        colors[Math.floor(Math.random() * 6)]
      ]);
    }, 100);

    try {
      const { data } = await gamesAPI.colorGamePlay({
        betAmount: parseFloat(betAmount), selectedColor,
        clientSeed: 'color-' + Date.now()
      });

      setTimeout(() => {
        clearInterval(rollInterval);
        setRolling(false);
        const resultColors = (data.result?.diceColors || []).map(c => colors.find(cl => cl.id === c) || colors[0]);
        setDiceResults(resultColors);
        setResult(data);
        setHistory(prev => [data.result?.diceColors || [], ...prev.slice(0, 9)]);
        setPlaying(false);
        updateBalance();
        if (data.winAmount > 0) toast.success(`Won ৳${data.winAmount.toFixed(2)}! (${data.multiplier}x)`);
        else toast.error('No match! Try again.');
      }, 2000);
    } catch (error) {
      clearInterval(rollInterval);
      setRolling(false);
      setPlaying(false);
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg, #ef4444, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Color Game / কালার গেম
      </h1>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #ef4444, #f59e0b, #10b981, #3b82f6, #8b5cf6)' }} />

          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 16 }}>
            {rolling ? 'ROLLING...' : result ? 'RESULT' : '3 DICE ROLL'}
          </div>

          {/* Dice Display */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 20 }}>
            {(diceResults.length > 0 ? diceResults : [null, null, null]).map((dice, i) => (
              <div key={i} style={{
                width: 90, height: 90, borderRadius: 16,
                background: dice ? dice.color : 'var(--bg-input)',
                border: `3px solid ${dice ? dice.color + '80' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: dice ? `0 8px 30px ${dice.color}40` : 'none',
                animation: rolling ? `diceRoll 0.3s infinite ${i * 0.1}s` : dice ? 'diceLand 0.4s ease' : 'none',
                transition: 'all 0.3s ease'
              }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: dice?.id === 'white' ? '#000' : '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  {dice ? dice.label : '?'}
                </span>
              </div>
            ))}
          </div>

          {/* Match count */}
          {result && (
            <div style={{
              padding: 16, borderRadius: 12,
              background: result.winAmount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.05)',
              border: `1px solid ${result.winAmount > 0 ? 'var(--success)' : 'var(--border)'}`,
              animation: 'slideUp 0.4s ease'
            }}>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
                {result.result?.matches || 0} match{(result.result?.matches || 0) !== 1 ? 'es' : ''} found
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: result.winAmount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {result.winAmount > 0 ? `WON ৳${result.winAmount.toFixed(2)}` : 'NO MATCH'}
              </div>
            </div>
          )}
        </div>

        {/* Color Selection */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>Choose Your Color</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {colors.map(c => (
              <button key={c.id} onClick={() => setSelectedColor(c.id)} style={{
                padding: '16px 8px', borderRadius: 12, textAlign: 'center',
                background: selectedColor === c.id ? `${c.color}25` : 'var(--bg-input)',
                border: `2px solid ${selectedColor === c.id ? c.color : 'var(--border)'}`,
                transition: 'all 0.3s ease', transform: selectedColor === c.id ? 'scale(1.05)' : 'scale(1)'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: c.color,
                  margin: '0 auto 6px', boxShadow: `0 4px 12px ${c.color}40`
                }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.pay}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Bet Amount (৳)</label>
            <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} min="10" />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[50, 100, 500, 1000, 5000].map(amt => (
                <button key={amt} onClick={() => setBetAmount(amt.toString())} style={{
                  flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 6, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600
                }}>{amt}</button>
              ))}
            </div>
          </div>
          <button onClick={play} className="btn btn-primary btn-lg btn-full" disabled={playing}>
            {playing ? 'ROLLING...' : `ROLL ৳${betAmount}`}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes diceRoll { 0% { transform: rotateX(0) scale(1); } 50% { transform: rotateX(180deg) scale(0.9); } 100% { transform: rotateX(360deg) scale(1); } }
        @keyframes diceLand { from { transform: scale(1.3) rotateZ(10deg); } to { transform: scale(1) rotateZ(0); } }
        @keyframes slideUp { from { opacity:0; transform: translateY(15px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ColorGame;
