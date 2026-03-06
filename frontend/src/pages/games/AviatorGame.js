import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AviatorGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [gameState, setGameState] = useState('idle');
  const [multiplier, setMultiplier] = useState(1.00);
  const [roundId, setRoundId] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([2.45, 1.12, 5.67, 1.89, 3.21, 1.02, 12.5, 1.45, 2.78, 1.67]);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startTime = useRef(null);
  const planeY = useRef(0);

  const placeBet = async () => {
    if (!user) return toast.error('Please login first');
    if (gameState !== 'idle') return;
    try {
      const { data } = await gamesAPI.aviatorBet({
        betAmount: parseFloat(betAmount),
        clientSeed: 'aviator-' + Date.now()
      });
      setRoundId(data.roundId);
      setGameState('flying');
      setMultiplier(1.00);
      setResult(null);
      updateBalance();
      startFlight();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const cashout = async () => {
    if (gameState !== 'flying' || !roundId) return;
    try {
      const { data } = await gamesAPI.aviatorCashout({ roundId, multiplier });
      setGameState('cashedout');
      setResult(data);
      updateBalance();
      setHistory(prev => [multiplier, ...prev.slice(0, 9)]);
      toast.success(`Flew away with ৳${data.winAmount.toFixed(2)}!`);
      stopFlight();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cashout failed');
      setGameState('crashed');
      stopFlight();
    }
  };

  const startFlight = () => {
    startTime.current = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const newMult = Math.pow(Math.E, elapsed * 0.08);
      setMultiplier(parseFloat(newMult.toFixed(2)));

      if (newMult > 100) {
        setGameState('crashed');
        setHistory(prev => [newMult, ...prev.slice(0, 9)]);
        drawFlight(newMult, true);
        return;
      }

      drawFlight(newMult, false);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  };

  const stopFlight = () => { if (animRef.current) cancelAnimationFrame(animRef.current); };

  const drawFlight = (mult, crashed) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0a0e1a');
    skyGrad.addColorStop(1, '#1a1f35');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (let i = 0; i < 30; i++) {
      const sx = (i * 37 + mult * 10) % w;
      const sy = (i * 23) % (h * 0.7);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(mult + i) * 0.2})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flight path
    ctx.beginPath();
    ctx.strokeStyle = crashed ? '#ef4444' : '#f5a623';
    ctx.lineWidth = 3;
    ctx.shadowColor = crashed ? '#ef4444' : '#f5a623';
    ctx.shadowBlur = 10;
    ctx.moveTo(30, h - 30);
    const points = 80;
    let lastX = 30, lastY = h - 30;
    for (let i = 1; i <= points; i++) {
      const progress = i / points;
      const x = 30 + progress * (w - 60);
      const normalizedMult = Math.min(mult, 20);
      const y = h - 30 - (Math.log(1 + progress * (normalizedMult - 1)) / Math.log(normalizedMult)) * (h - 60);
      ctx.lineTo(x, Math.max(10, y));
      lastX = x;
      lastY = Math.max(10, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Area fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, crashed ? 'rgba(239,68,68,0.15)' : 'rgba(245,166,35,0.15)');
    grad.addColorStop(1, 'transparent');
    ctx.lineTo(lastX, h - 30);
    ctx.lineTo(30, h - 30);
    ctx.fillStyle = grad;
    ctx.fill();

    // Plane emoji
    if (!crashed) {
      ctx.font = '28px serif';
      ctx.save();
      ctx.translate(lastX, lastY);
      ctx.rotate(-0.3);
      ctx.fillText('✈️', -14, 10);
      ctx.restore();

      // Trail particles
      for (let i = 0; i < 5; i++) {
        const px = lastX - 20 - i * 8 + Math.random() * 4;
        const py = lastY + 5 + Math.random() * 10;
        ctx.fillStyle = `rgba(245,166,35,${0.5 - i * 0.1})`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.font = '32px serif';
      ctx.fillText('💥', lastX - 16, lastY + 10);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = 300;
    }
    return () => stopFlight();
  }, []);

  const reset = () => { setGameState('idle'); setMultiplier(1.00); setRoundId(null); setResult(null); };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg, #f59e0b, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Aviator / এভিয়েটর
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #f59e0b, #3b82f6)' }} />

          {/* History */}
          <div style={{ display: 'flex', gap: 6, padding: '12px 0', overflowX: 'auto' }}>
            {history.map((h, i) => (
              <span key={i} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                background: h >= 2 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: h >= 2 ? '#10b981' : '#ef4444'
              }}>{h.toFixed(2)}x</span>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: 300, borderRadius: 10 }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none'
            }}>
              <div style={{
                fontSize: 56, fontWeight: 900,
                color: gameState === 'crashed' ? '#ef4444' : gameState === 'cashedout' ? '#10b981' : '#f5a623',
                textShadow: `0 0 40px ${gameState === 'crashed' ? 'rgba(239,68,68,0.5)' : 'rgba(245,166,35,0.5)'}`,
                animation: gameState === 'flying' ? 'pulse 1s infinite' : 'none'
              }}>
                {multiplier.toFixed(2)}x
              </div>
              {gameState === 'crashed' && <div style={{ color: '#ef4444', fontSize: 18, fontWeight: 800 }}>FLEW AWAY!</div>}
              {gameState === 'cashedout' && result && (
                <div style={{ color: '#10b981', fontSize: 18, fontWeight: 800 }}>WON ৳{result.winAmount.toFixed(2)}</div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Bet Amount (৳)</label>
            <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} disabled={gameState === 'flying'} min="10" />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[50, 100, 500, 1000, 5000].map(amt => (
                <button key={amt} onClick={() => setBetAmount(amt.toString())} style={{
                  flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 6, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600
                }}>{amt}</button>
              ))}
            </div>
          </div>

          {gameState === 'idle' && (
            <button onClick={placeBet} className="btn btn-primary btn-lg btn-full">
              FLY ৳{betAmount}
            </button>
          )}
          {gameState === 'flying' && (
            <button onClick={cashout} className="btn btn-success btn-lg btn-full" style={{ animation: 'glow 1s infinite' }}>
              CASHOUT {multiplier.toFixed(2)}x (৳{(parseFloat(betAmount) * multiplier).toFixed(2)})
            </button>
          )}
          {(gameState === 'crashed' || gameState === 'cashedout') && (
            <button onClick={reset} className="btn btn-secondary btn-lg btn-full">NEW FLIGHT</button>
          )}

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-input)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Bet</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>৳{betAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Potential</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>৳{(parseFloat(betAmount || 0) * multiplier).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.8; } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 10px rgba(16,185,129,0.3); } 50% { box-shadow: 0 0 25px rgba(16,185,129,0.6); } }
        @media (max-width: 768px) { .animate-fadeIn > div:nth-child(2) { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
};

export default AviatorGame;
