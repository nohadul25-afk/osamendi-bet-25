import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LimboGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [target, setTarget] = useState('2.00');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const winChance = (97 / parseFloat(target || 2)) ;
  const play = async () => {
    if (!user) return toast.error('Please login first');
    setLoading(true);
    try {
      const { data } = await gamesAPI.limboPlay({ betAmount: parseFloat(betAmount), targetMultiplier: parseFloat(target), clientSeed: 'limbo-' + Date.now() });
      setResult(data);
      updateBalance();
      setHistory(prev => [data, ...prev].slice(0, 20));
      if (data.win) toast.success(`Won ৳${data.winAmount.toFixed(2)}!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Limbo / লিম্বো</h1>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: result ? (result.win ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)', marginBottom: 8 }}>
            {result ? `${result.result}x` : '-.--x'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            {result ? (result.win ? `Won ৳${result.winAmount.toFixed(2)}` : 'Lost') : 'Set target and play'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--text-muted)' }}>Bet Amount (৳)</label>
              <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} min="10" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--text-muted)' }}>Target (x)</label>
              <input className="input" type="number" value={target} onChange={(e) => setTarget(e.target.value)} min="1.01" step="0.01" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {['1.5', '2', '3', '5', '10', '50', '100'].map(t => (
              <button key={t} onClick={() => setTarget(t)} style={{ flex: 1, padding: 6, borderRadius: 6, background: target === t ? 'var(--primary)' : 'var(--bg-input)', color: target === t ? '#000' : 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700 }}>{t}x</button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 16 }}>
            <span style={{ color: 'var(--text-muted)' }}>Win Chance: <b style={{ color: 'var(--primary)' }}>{winChance.toFixed(2)}%</b></span>
            <span style={{ color: 'var(--text-muted)' }}>Profit: <b style={{ color: 'var(--success)' }}>৳{(parseFloat(betAmount) * (parseFloat(target) - 1)).toFixed(2)}</b></span>
          </div>
          <button onClick={play} className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? 'Playing...' : 'Play'}
          </button>
        </div>
        {history.length > 0 && (
          <div className="card" style={{ marginTop: 16, padding: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {history.map((h, i) => (
                <span key={i} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: h.win ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: h.win ? 'var(--success)' : 'var(--danger)' }}>{h.result}x</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LimboGame;
