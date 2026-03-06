import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const WheelGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);

  const spin = async () => {
    if (!user) return toast.error('Please login first');
    setSpinning(true);
    setResult(null);
    try {
      const { data } = await gamesAPI.wheelSpin({ betAmount: parseFloat(betAmount), clientSeed: 'wheel-' + Date.now() });
      setTimeout(() => {
        setResult(data);
        setSpinning(false);
        updateBalance();
        if (data.winAmount > 0) toast.success(`Won ৳${data.winAmount.toFixed(2)} (${data.multiplier}x)!`);
        else toast.error('Better luck next time!');
      }, 3000);
    } catch (error) {
      setSpinning(false);
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Wheel of Fortune / হুইল</h1>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: 280, height: 280, borderRadius: '50%', margin: '0 auto 24px', background: 'conic-gradient(#e74c3c 0deg 90deg, #f39c12 90deg 180deg, #2ecc71 180deg 270deg, #3498db 270deg 360deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '6px solid var(--primary)', animation: spinning ? 'spin 0.5s linear infinite' : 'none' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              {result ? (
                <>
                  <div style={{ fontSize: 24, fontWeight: 900, color: result.multiplier > 1 ? 'var(--success)' : 'var(--danger)' }}>{result.multiplier}x</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>৳{result.winAmount.toFixed(0)}</div>
                </>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>SPIN</div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} min="10" style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }} />
          </div>
          <button onClick={spin} className="btn btn-primary btn-lg btn-full" disabled={spinning}>
            {spinning ? 'Spinning...' : 'SPIN THE WHEEL'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default WheelGame;
