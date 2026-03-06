import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const cardDisplay = (card) => {
  if (!card) return '🂠';
  const suits = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  const suitColor = ['hearts', 'diamonds'].includes(card.suit) ? '#ef4444' : '#fff';
  return { value: card.rank, suit: suits[card.suit] || '?', color: suitColor };
};

const CardComponent = ({ card, delay = 0, flipped = false }) => {
  const c = cardDisplay(card);
  if (typeof c === 'string') return (
    <div style={{
      width: 70, height: 100, background: 'linear-gradient(135deg, #1a2332, #0d1117)',
      borderRadius: 10, border: '2px solid var(--border)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontSize: 32,
      animation: `cardDeal 0.5s ease ${delay}s both`, transform: flipped ? 'rotateY(180deg)' : 'none',
      transition: 'transform 0.6s ease'
    }}>🂠</div>
  );
  return (
    <div style={{
      width: 70, height: 100, background: 'linear-gradient(135deg, #fff, #f0f0f0)',
      borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
      animation: `cardDeal 0.5s ease ${delay}s both`
    }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: c.color }}>{c.value}</div>
      <div style={{ fontSize: 18, color: c.color }}>{c.suit}</div>
    </div>
  );
};

const BaccaratGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [betType, setBetType] = useState('player');
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);

  const play = async () => {
    if (!user) return toast.error('Please login first');
    setPlaying(true);
    setResult(null);

    try {
      const { data } = await gamesAPI.baccaratPlay({
        betAmount: parseFloat(betAmount),
        betType,
        clientSeed: 'baccarat-' + Date.now()
      });
      setTimeout(() => {
        setResult(data);
        setPlaying(false);
        updateBalance();
        if (data.winAmount > 0) toast.success(`Won ৳${data.winAmount.toFixed(2)}!`);
        else toast.error('Better luck next time!');
      }, 2000);
    } catch (error) {
      setPlaying(false);
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const betTypes = [
    { id: 'player', label: 'Player', payout: '1:1', color: '#3b82f6' },
    { id: 'banker', label: 'Banker', payout: '0.95:1', color: '#ef4444' },
    { id: 'tie', label: 'Tie', payout: '8:1', color: '#10b981' }
  ];

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg, #f5a623, #e8930c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Baccarat / ব্যাকারাট
      </h1>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 20, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--gradient-gold)' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '24px 16px' }}>
            {/* Player */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#3b82f6', fontWeight: 800, fontSize: 16, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Player</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', minHeight: 100 }}>
                {result ? result.result.playerCards.map((card, i) => (
                  <CardComponent key={i} card={card} delay={i * 0.3} />
                )) : playing ? (
                  <>
                    <div style={{ width: 70, height: 100, background: 'var(--bg-input)', borderRadius: 10, animation: 'pulse 1s infinite' }} />
                    <div style={{ width: 70, height: 100, background: 'var(--bg-input)', borderRadius: 10, animation: 'pulse 1s infinite 0.2s' }} />
                  </>
                ) : null}
              </div>
              {result && <div style={{ fontSize: 28, fontWeight: 900, color: '#3b82f6', marginTop: 12, textShadow: '0 0 20px rgba(59,130,246,0.5)' }}>{result.result.playerScore}</div>}
            </div>

            {/* Banker */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ef4444', fontWeight: 800, fontSize: 16, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Banker</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', minHeight: 100 }}>
                {result ? result.result.bankerCards.map((card, i) => (
                  <CardComponent key={i} card={card} delay={i * 0.3 + 0.6} />
                )) : playing ? (
                  <>
                    <div style={{ width: 70, height: 100, background: 'var(--bg-input)', borderRadius: 10, animation: 'pulse 1s infinite 0.4s' }} />
                    <div style={{ width: 70, height: 100, background: 'var(--bg-input)', borderRadius: 10, animation: 'pulse 1s infinite 0.6s' }} />
                  </>
                ) : null}
              </div>
              {result && <div style={{ fontSize: 28, fontWeight: 900, color: '#ef4444', marginTop: 12, textShadow: '0 0 20px rgba(239,68,68,0.5)' }}>{result.result.bankerScore}</div>}
            </div>
          </div>

          {result && (
            <div style={{
              textAlign: 'center', padding: 16,
              background: result.winAmount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              borderTop: `1px solid ${result.winAmount > 0 ? 'var(--success)' : 'var(--danger)'}`,
              animation: 'fadeIn 0.5s ease'
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: result.winAmount > 0 ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase' }}>
                {result.result.winner === 'tie' ? 'TIE!' : `${result.result.winner} WINS!`}
              </div>
              {result.winAmount > 0 && (
                <div style={{ fontSize: 16, color: 'var(--success)', fontWeight: 700, marginTop: 4 }}>Won ৳{result.winAmount.toFixed(2)}</div>
              )}
            </div>
          )}
        </div>

        {/* Betting */}
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {betTypes.map(bt => (
              <button key={bt.id} onClick={() => setBetType(bt.id)} style={{
                padding: '16px 12px', borderRadius: 12, textAlign: 'center',
                background: betType === bt.id ? `${bt.color}22` : 'var(--bg-input)',
                border: `2px solid ${betType === bt.id ? bt.color : 'var(--border)'}`,
                transition: 'all 0.3s ease', transform: betType === bt.id ? 'scale(1.02)' : 'scale(1)'
              }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: bt.color }}>{bt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Pays {bt.payout}</div>
              </button>
            ))}
          </div>

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
            {playing ? 'DEALING...' : `DEAL ৳${betAmount}`}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cardDeal { from { opacity: 0; transform: translateY(-30px) rotateY(90deg); } to { opacity: 1; transform: translateY(0) rotateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default BaccaratGame;
