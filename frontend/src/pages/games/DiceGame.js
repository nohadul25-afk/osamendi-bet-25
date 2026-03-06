import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DiceGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [target, setTarget] = useState(50);
  const [condition, setCondition] = useState('over');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const winChance = condition === 'over' ? (100 - target) : target;
  const multiplier = (98 / winChance).toFixed(4);

  const play = async () => {
    if (!user) return toast.error('Please login first');
    setLoading(true);
    try {
      const { data } = await gamesAPI.dicePlay({
        betAmount: parseFloat(betAmount), target, condition,
        clientSeed: 'dice-' + Date.now()
      });
      setResult(data);
      updateBalance();
      setHistory(prev => [{ ...data, timestamp: Date.now() }, ...prev].slice(0, 20));
      if (data.win) {
        toast.success(`Won ৳${data.winAmount.toFixed(2)} at ${data.multiplier.toFixed(2)}x!`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bet failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Dice Game / ডাইস গেম</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Game Area */}
        <div className="card">
          {/* Result Display */}
          <div style={{
            textAlign: 'center', padding: '40px 20px', marginBottom: 20,
            background: 'var(--bg-input)', borderRadius: 12
          }}>
            <div style={{
              fontSize: 72, fontWeight: 900,
              color: result ? (result.win ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)',
              transition: 'all 0.3s'
            }}>
              {result ? result.result.toFixed(2) : '-.--'}
            </div>
            {result && (
              <div style={{
                fontSize: 16, fontWeight: 700, marginTop: 8,
                color: result.win ? 'var(--success)' : 'var(--danger)'
              }}>
                {result.win ? `Won ৳${result.winAmount.toFixed(2)}` : `Lost ৳${betAmount}`}
              </div>
            )}
          </div>

          {/* Slider */}
          <div style={{ padding: '0 10px', marginBottom: 20 }}>
            <input
              type="range" min="2" max="98" value={target}
              onChange={(e) => setTarget(parseInt(e.target.value))}
              style={{
                width: '100%', height: 8, appearance: 'none',
                background: `linear-gradient(to right, ${condition === 'under' ? 'var(--success)' : 'var(--danger)'} ${target}%, ${condition === 'over' ? 'var(--success)' : 'var(--danger)'} ${target}%)`,
                borderRadius: 4, cursor: 'pointer'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>0</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>{target}</span>
              <span>100</span>
            </div>
          </div>

          {/* Roll Over / Under */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button
              onClick={() => setCondition('under')}
              style={{
                flex: 1, padding: 14, borderRadius: 10,
                border: `2px solid ${condition === 'under' ? 'var(--success)' : 'var(--border)'}`,
                background: condition === 'under' ? 'rgba(16,185,129,0.1)' : 'var(--bg-input)',
                color: condition === 'under' ? 'var(--success)' : 'var(--text-secondary)',
                fontWeight: 700, fontSize: 14
              }}>
              Roll Under {target}
            </button>
            <button
              onClick={() => setCondition('over')}
              style={{
                flex: 1, padding: 14, borderRadius: 10,
                border: `2px solid ${condition === 'over' ? 'var(--success)' : 'var(--border)'}`,
                background: condition === 'over' ? 'rgba(16,185,129,0.1)' : 'var(--bg-input)',
                color: condition === 'over' ? 'var(--success)' : 'var(--text-secondary)',
                fontWeight: 700, fontSize: 14
              }}>
              Roll Over {target}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Win Chance</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{winChance.toFixed(2)}%</div>
            </div>
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Multiplier</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{multiplier}x</div>
            </div>
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Profit on Win</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>
                ৳{(parseFloat(betAmount) * (parseFloat(multiplier) - 1)).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Betting Panel */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Bet Amount (৳)
              </label>
              <input className="input" type="number" value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)} min="10" />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[50, 100, 500, 1000].map(amt => (
                  <button key={amt} onClick={() => setBetAmount(amt.toString())}
                    style={{ flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>
                    {amt}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button onClick={() => setBetAmount(prev => Math.max(10, parseFloat(prev) / 2).toString())}
                  style={{ flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>1/2</button>
                <button onClick={() => setBetAmount(prev => (parseFloat(prev) * 2).toString())}
                  style={{ flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>2x</button>
              </div>
            </div>

            <button onClick={play} className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? 'Rolling...' : `Roll ${condition === 'over' ? 'Over' : 'Under'} ${target}`}
            </button>
          </div>

          {/* History */}
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Recent Rolls</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {history.map((h, i) => (
                <span key={i} style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                  background: h.win ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: h.win ? 'var(--success)' : 'var(--danger)'
                }}>
                  {h.result.toFixed(2)}
                </span>
              ))}
              {history.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No rolls yet</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceGame;
