import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const KenoGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleNumber = (n) => {
    if (result) { setResult(null); setSelected([]); }
    if (selected.includes(n)) setSelected(prev => prev.filter(x => x !== n));
    else if (selected.length < 10) setSelected(prev => [...prev, n]);
    else toast.error('Maximum 10 numbers');
  };

  const play = async () => {
    if (!user) return toast.error('Please login first');
    if (selected.length < 1) return toast.error('Select at least 1 number');
    setLoading(true);
    try {
      const { data } = await gamesAPI.kenoPlay({ betAmount: parseFloat(betAmount), selectedNumbers: selected, clientSeed: 'keno-' + Date.now() });
      setResult(data);
      updateBalance();
      if (data.winAmount > 0) toast.success(`Won ৳${data.winAmount.toFixed(2)}! (${data.hitCount} hits)`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Keno / কেনো</h1>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card">
          {result && (
            <div style={{ textAlign: 'center', marginBottom: 16, padding: 16, background: result.winAmount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 10, border: `1px solid ${result.winAmount > 0 ? 'var(--success)' : 'var(--danger)'}` }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: result.winAmount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {result.winAmount > 0 ? `Won ৳${result.winAmount.toFixed(2)} (${result.multiplier}x)` : 'No Win'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{result.hitCount} out of {selected.length} matched</div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginBottom: 16 }}>
            {Array.from({ length: 40 }, (_, i) => i + 1).map(n => {
              const isSelected = selected.includes(n);
              const isDrawn = result?.drawnNumbers?.includes(n);
              const isHit = result?.hits?.includes(n);
              return (
                <button key={n} onClick={() => toggleNumber(n)} style={{
                  padding: 10, borderRadius: 8, fontWeight: 700, fontSize: 14, border: '2px solid',
                  borderColor: isHit ? 'var(--success)' : isDrawn ? 'var(--primary)' : isSelected ? 'var(--accent)' : 'var(--border)',
                  background: isHit ? 'rgba(16,185,129,0.3)' : isDrawn ? 'rgba(245,166,35,0.15)' : isSelected ? 'rgba(0,212,255,0.15)' : 'var(--bg-input)',
                  color: isHit ? 'var(--success)' : isSelected ? 'var(--accent)' : 'var(--text-secondary)'
                }}>{n}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} min="10" style={{ flex: 1 }} placeholder="Bet amount" />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Selected: {selected.length}/10</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={play} className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading || selected.length === 0}>
              {loading ? 'Drawing...' : 'Play'}
            </button>
            <button onClick={() => { setSelected([]); setResult(null); }} className="btn btn-secondary btn-lg">Clear</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KenoGame;
