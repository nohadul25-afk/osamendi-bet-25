import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CrashGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [autoCashout, setAutoCashout] = useState('2.00');
  const [gameState, setGameState] = useState('idle'); // idle, betting, playing, crashed, cashedout
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(null);
  const [roundId, setRoundId] = useState(null);
  const [result, setResult] = useState(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startTime = useRef(null);

  const placeBet = async () => {
    if (!user) return toast.error('Please login first');
    if (gameState !== 'idle') return;

    try {
      const { data } = await gamesAPI.crashBet({
        betAmount: parseFloat(betAmount),
        autoCashout: parseFloat(autoCashout),
        clientSeed: 'osamendi-' + Date.now()
      });
      setRoundId(data.roundId);
      setGameState('playing');
      setMultiplier(1.00);
      setResult(null);
      updateBalance();
      startAnimation();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place bet');
    }
  };

  const cashout = async () => {
    if (gameState !== 'playing' || !roundId) return;

    try {
      const { data } = await gamesAPI.crashCashout({
        roundId,
        multiplier: multiplier
      });
      setGameState('cashedout');
      setResult(data);
      updateBalance();
      toast.success(`Cashed out at ${multiplier.toFixed(2)}x! Won ৳${data.winAmount.toFixed(2)}`);
      stopAnimation();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cashout failed');
      setGameState('crashed');
      stopAnimation();
    }
  };

  const startAnimation = () => {
    startTime.current = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const newMultiplier = Math.pow(Math.E, elapsed * 0.1);
      setMultiplier(parseFloat(newMultiplier.toFixed(2)));

      // Auto crash simulation (in real app, server sends this)
      if (newMultiplier > 50) {
        setGameState('crashed');
        setCrashPoint(newMultiplier);
        return;
      }

      // Auto cashout
      if (autoCashout && newMultiplier >= parseFloat(autoCashout)) {
        cashout();
        return;
      }

      drawCanvas(newMultiplier);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const drawCanvas = (mult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = '#1a1f2e';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (h / 10) * i);
      ctx.lineTo(w, (h / 10) * i);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((w / 10) * i, 0);
      ctx.lineTo((w / 10) * i, h);
      ctx.stroke();
    }

    // Curve
    ctx.beginPath();
    ctx.strokeStyle = gameState === 'crashed' ? '#ef4444' : '#f5a623';
    ctx.lineWidth = 3;
    ctx.moveTo(0, h);

    const points = 100;
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * w;
      const t = (i / points) * Math.log(mult);
      const y = h - (Math.exp(t) - 1) / (mult - 1) * h * 0.8;
      ctx.lineTo(x, Math.max(0, y));
    }
    ctx.stroke();

    // Gradient fill under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, gameState === 'crashed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,166,35,0.1)');
    gradient.addColorStop(1, 'transparent');
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fillStyle = gradient;
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = 300;
    }
    return () => stopAnimation();
  }, []);

  const reset = () => {
    setGameState('idle');
    setMultiplier(1.00);
    setRoundId(null);
    setResult(null);
    setCrashPoint(null);
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Crash Game</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Game Area */}
        <div className="card" style={{ position: 'relative' }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: 300, borderRadius: 10, background: '#0d1117' }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 64, fontWeight: 900,
                color: gameState === 'crashed' ? 'var(--danger)' :
                       gameState === 'cashedout' ? 'var(--success)' : 'var(--primary)',
                textShadow: '0 0 30px rgba(245,166,35,0.5)'
              }}>
                {multiplier.toFixed(2)}x
              </div>
              {gameState === 'crashed' && (
                <div style={{ color: 'var(--danger)', fontSize: 18, fontWeight: 700 }}>CRASHED!</div>
              )}
              {gameState === 'cashedout' && result && (
                <div style={{ color: 'var(--success)', fontSize: 18, fontWeight: 700 }}>
                  Won ৳{result.winAmount.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Game Result */}
          {result && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)',
              borderRadius: 10, padding: 16, textAlign: 'center'
            }}>
              <div style={{ fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>
                Won ৳{result.winAmount.toFixed(2)} at {result.multiplier.toFixed(2)}x
              </div>
            </div>
          )}
        </div>

        {/* Betting Panel */}
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Bet Amount (৳)
            </label>
            <input className="input" type="number" value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={gameState === 'playing'} min="10" />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[50, 100, 500, 1000, 5000].map(amt => (
                <button key={amt} onClick={() => setBetAmount(amt.toString())}
                  style={{
                    flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)',
                    borderRadius: 6, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600
                  }}>
                  {amt}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button onClick={() => setBetAmount(prev => (parseFloat(prev) / 2).toString())}
                style={{ flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                1/2
              </button>
              <button onClick={() => setBetAmount(prev => (parseFloat(prev) * 2).toString())}
                style={{ flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                2x
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Auto Cashout (x)
            </label>
            <input className="input" type="number" value={autoCashout}
              onChange={(e) => setAutoCashout(e.target.value)}
              disabled={gameState === 'playing'} min="1.01" step="0.01" />
          </div>

          {gameState === 'idle' && (
            <button onClick={placeBet} className="btn btn-primary btn-lg btn-full">
              Place Bet ৳{betAmount}
            </button>
          )}

          {gameState === 'playing' && (
            <button onClick={cashout} className="btn btn-success btn-lg btn-full" style={{ animation: 'glow 1s infinite' }}>
              Cashout at {multiplier.toFixed(2)}x (৳{(parseFloat(betAmount) * multiplier).toFixed(2)})
            </button>
          )}

          {(gameState === 'crashed' || gameState === 'cashedout') && (
            <button onClick={reset} className="btn btn-secondary btn-lg btn-full">
              New Bet
            </button>
          )}

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-input)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Potential Win</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                ৳{(parseFloat(betAmount || 0) * parseFloat(autoCashout || 2)).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Profit</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                ৳{(parseFloat(betAmount || 0) * (parseFloat(autoCashout || 2) - 1)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .animate-fadeIn > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CrashGame;
