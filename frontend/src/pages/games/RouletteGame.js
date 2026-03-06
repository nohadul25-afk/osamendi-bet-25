import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const RouletteGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [bets, setBets] = useState([]);
  const [result, setResult] = useState(null);
  const [spinning, setSpinning] = useState(false);

  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

  const addBet = (type, value = null) => {
    setBets(prev => [...prev, { type, value, amount: parseFloat(betAmount) }]);
  };

  const clearBets = () => setBets([]);

  const spin = async () => {
    if (!user) return toast.error('Please login first');
    if (bets.length === 0) return toast.error('Place at least one bet');
    setSpinning(true);
    try {
      const { data } = await gamesAPI.roulettePlay({
        betAmount: parseFloat(betAmount), bets,
        clientSeed: 'roulette-' + Date.now()
      });
      setTimeout(() => {
        setResult(data);
        setSpinning(false);
        updateBalance();
        setBets([]);
        if (data.totalWin > 0) toast.success(`Won ৳${data.totalWin.toFixed(2)}!`);
        else toast.error('No win this round');
      }, 2000);
    } catch (error) {
      setSpinning(false);
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const getColor = (num) => num === 0 ? '#2ecc71' : redNumbers.includes(num) ? '#e74c3c' : '#333';

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Roulette / রুলেট</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div className="card">
          {/* Result */}
          <div style={{ textAlign: 'center', padding: 32, background: '#0d1117', borderRadius: 12, marginBottom: 16 }}>
            {spinning ? (
              <div style={{ fontSize: 48, animation: 'pulse 0.5s infinite' }}>🎡</div>
            ) : result ? (
              <div>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: getColor(result.number), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 32, fontWeight: 900 }}>
                  {result.number}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12, color: result.totalWin > 0 ? 'var(--success)' : 'var(--danger)', textTransform: 'capitalize' }}>
                  {result.color} {result.number}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  {result.totalWin > 0 ? `Won ৳${result.totalWin.toFixed(2)}` : 'No win'}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>Place your bets</div>
            )}
          </div>

          {/* Betting Grid */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            <button onClick={() => addBet('green')} style={{ padding: '10px 20px', borderRadius: 6, background: '#2ecc71', color: 'white', fontWeight: 700, border: 'none' }}>0</button>
            {Array.from({ length: 36 }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => addBet('number', n)} style={{
                padding: '8px 12px', borderRadius: 4, fontWeight: 700, fontSize: 12, border: 'none',
                background: redNumbers.includes(n) ? '#e74c3c' : '#333', color: 'white', minWidth: 36
              }}>{n}</button>
            ))}
          </div>

          {/* Quick Bets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            <button onClick={() => addBet('red')} style={{ padding: 10, borderRadius: 8, background: '#e74c3c', color: 'white', fontWeight: 700, border: 'none' }}>Red</button>
            <button onClick={() => addBet('black')} style={{ padding: 10, borderRadius: 8, background: '#333', color: 'white', fontWeight: 700, border: 'none' }}>Black</button>
            <button onClick={() => addBet('green')} style={{ padding: 10, borderRadius: 8, background: '#2ecc71', color: 'white', fontWeight: 700, border: 'none' }}>Green</button>
            <button onClick={() => addBet('odd')} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 700, border: '1px solid var(--border)' }}>Odd</button>
            <button onClick={() => addBet('even')} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 700, border: '1px solid var(--border)' }}>Even</button>
            <button onClick={() => addBet('1-18')} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 700, border: '1px solid var(--border)' }}>1-18</button>
            <button onClick={() => addBet('19-36')} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 700, border: '1px solid var(--border)' }}>19-36</button>
            <button onClick={() => addBet('1st12')} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 700, border: '1px solid var(--border)' }}>1st 12</button>
            <button onClick={() => addBet('2nd12')} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 700, border: '1px solid var(--border)' }}>2nd 12</button>
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Chip Value (৳)</label>
            <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} min="10" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Your Bets ({bets.length})</div>
            {bets.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No bets placed</div>}
            {bets.slice(-5).map((b, i) => (
              <div key={i} style={{ fontSize: 12, padding: '4px 0', color: 'var(--text-secondary)' }}>
                {b.type} {b.value || ''} - ৳{b.amount}
              </div>
            ))}
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8, color: 'var(--primary)' }}>
              Total: ৳{bets.reduce((s, b) => s + b.amount, 0)}
            </div>
          </div>
          <button onClick={spin} className="btn btn-primary btn-lg btn-full" disabled={spinning || bets.length === 0}>
            {spinning ? 'Spinning...' : 'Spin'}
          </button>
          <button onClick={clearBets} className="btn btn-secondary btn-full" style={{ marginTop: 8 }}>Clear Bets</button>
        </div>
      </div>
    </div>
  );
};

export default RouletteGame;
