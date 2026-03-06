import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PlinkoGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [risk, setRisk] = useState('medium');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const play = async () => {
    if (!user) return toast.error('Please login first');
    setLoading(true);
    try {
      const { data } = await gamesAPI.plinkoPlay({
        betAmount: parseFloat(betAmount), risk, rows: 16,
        clientSeed: 'plinko-' + Date.now()
      });
      setResult(data);
      updateBalance();
      setHistory(prev => [data, ...prev].slice(0, 15));
      if (data.winAmount > parseFloat(betAmount)) {
        toast.success(`Won ৳${data.winAmount.toFixed(2)} (${data.multiplier}x)!`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Plinko / প্লিংকো</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          {/* Visual Plinko Board */}
          <div style={{ background: '#0d1117', borderRadius: 16, padding: 24, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {result ? (
              <div>
                <div style={{ fontSize: 64, fontWeight: 900, color: result.multiplier >= 2 ? 'var(--success)' : result.multiplier >= 1 ? 'var(--primary)' : 'var(--danger)' }}>
                  {result.multiplier}x
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: result.profit >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: 8 }}>
                  {result.profit >= 0 ? '+' : ''}৳{result.profit.toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Path: {result.directions?.join(' → ')}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 18 }}>Drop the ball!</div>
            )}
          </div>
          {/* Multiplier slots at bottom */}
          <div style={{ display: 'flex', gap: 2, marginTop: 12, overflow: 'auto' }}>
            {(risk === 'low' ? [5.6, 2.1, 1.1, 1, 0.5, 1, 0.3, 0.3, 0.3, 0.3, 1, 0.5, 1, 1.1, 2.1, 5.6, 16] :
              risk === 'medium' ? [13, 3, 1.3, 0.7, 0.4, 0.3, 0.2, 0.2, 0.2, 0.2, 0.3, 0.4, 0.7, 1.3, 3, 13, 110] :
              [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]).map((m, i) => (
              <div key={i} style={{
                flex: 1, padding: '4px 2px', textAlign: 'center', fontSize: 9, fontWeight: 700,
                borderRadius: 4, color: '#000',
                background: m >= 10 ? '#f5a623' : m >= 2 ? '#2ecc71' : m >= 1 ? '#3498db' : '#e74c3c',
                border: result?.position === i ? '2px solid white' : 'none'
              }}>{m}x</div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Bet Amount (৳)</label>
            <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} min="10" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Risk Level</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['low', 'medium', 'high'].map(r => (
                <button key={r} onClick={() => setRisk(r)} style={{
                  flex: 1, padding: 10, borderRadius: 8, fontWeight: 700, fontSize: 13, textTransform: 'capitalize',
                  background: risk === r ? 'var(--primary)' : 'var(--bg-input)', color: risk === r ? '#000' : 'var(--text-secondary)',
                  border: `1px solid ${risk === r ? 'var(--primary)' : 'var(--border)'}`
                }}>{r}</button>
              ))}
            </div>
          </div>
          <button onClick={play} className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? 'Dropping...' : 'Drop Ball'}
          </button>

          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>History</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {history.map((h, i) => (
              <span key={i} style={{
                padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                background: h.profit >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: h.profit >= 0 ? 'var(--success)' : 'var(--danger)'
              }}>{h.multiplier}x</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlinkoGame;
