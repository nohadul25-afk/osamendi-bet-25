import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CoinFlipGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [choice, setChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const play = async () => {
    if (!user) return toast.error('Please login first');
    setFlipping(true);
    setResult(null);
    try {
      const { data } = await gamesAPI.coinFlipPlay({ betAmount: parseFloat(betAmount), choice, clientSeed: 'coin-' + Date.now() });
      setTimeout(() => {
        setResult(data);
        setFlipping(false);
        updateBalance();
        setHistory(prev => [data, ...prev].slice(0, 20));
        if (data.win) toast.success(`Won ৳${data.winAmount.toFixed(2)}!`);
      }, 1500);
    } catch (error) {
      setFlipping(false);
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Coin Flip / কয়েন ফ্লিপ</h1>
      <div style={{ maxWidth: 450, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ width: 150, height: 150, borderRadius: '50%', margin: '0 auto 24px', background: result ? (result.result === 'heads' ? 'var(--gradient-gold)' : 'linear-gradient(135deg, #bdc3c7, #95a5a6)') : 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 900, border: '4px solid var(--border)', animation: flipping ? 'spin 0.3s linear infinite' : 'none', color: result?.result === 'heads' ? '#000' : '#fff' }}>
            {flipping ? '🪙' : result ? (result.result === 'heads' ? 'H' : 'T') : '?'}
          </div>
          {result && (
            <div style={{ fontSize: 20, fontWeight: 800, color: result.win ? 'var(--success)' : 'var(--danger)', marginBottom: 16 }}>
              {result.win ? `WON ৳${result.winAmount.toFixed(2)}` : 'LOST'}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setChoice('heads')} style={{ flex: 1, padding: 16, borderRadius: 12, border: `2px solid ${choice === 'heads' ? 'var(--primary)' : 'var(--border)'}`, background: choice === 'heads' ? 'rgba(245,166,35,0.1)' : 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>
              🟡 Heads
            </button>
            <button onClick={() => setChoice('tails')} style={{ flex: 1, padding: 16, borderRadius: 12, border: `2px solid ${choice === 'tails' ? 'var(--primary)' : 'var(--border)'}`, background: choice === 'tails' ? 'rgba(245,166,35,0.1)' : 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>
              ⚪ Tails
            </button>
          </div>
          <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} min="10" style={{ marginBottom: 16, textAlign: 'center', fontSize: 18, fontWeight: 700 }} />
          <button onClick={play} className="btn btn-primary btn-lg btn-full" disabled={flipping}>
            {flipping ? 'Flipping...' : `Flip - ${choice.toUpperCase()}`}
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Payout: 1.96x | Win chance: 50%</div>
        </div>
        {history.length > 0 && (
          <div className="card" style={{ marginTop: 16, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>History</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {history.map((h, i) => (
                <span key={i} style={{ padding: '4px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: h.win ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: h.win ? 'var(--success)' : 'var(--danger)' }}>
                  {h.result === 'heads' ? '🟡' : '⚪'} {h.win ? 'W' : 'L'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotateY(360deg); } }`}</style>
    </div>
  );
};

export default CoinFlipGame;
