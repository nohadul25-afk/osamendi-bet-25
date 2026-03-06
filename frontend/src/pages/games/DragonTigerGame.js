import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DragonTigerGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [betType, setBetType] = useState('dragon');
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [showCards, setShowCards] = useState(false);

  const suitSymbol = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  const suitColor = (s) => ['hearts', 'diamonds'].includes(s) ? '#ef4444' : '#fff';

  const play = async () => {
    if (!user) return toast.error('Please login first');
    setPlaying(true);
    setResult(null);
    setShowCards(false);

    try {
      const { data } = await gamesAPI.dragonTigerPlay({
        betAmount: parseFloat(betAmount), betType,
        clientSeed: 'dt-' + Date.now()
      });
      setTimeout(() => setShowCards(true), 500);
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

  const renderCard = (card, label, color, delay) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 3 }}>{label}</div>
      <div style={{
        width: 100, height: 140, margin: '0 auto', borderRadius: 12,
        background: card && showCards ? 'linear-gradient(135deg, #fff, #f0f0f0)' : 'linear-gradient(135deg, #1a2332, #0d1117)',
        border: `2px solid ${color}40`, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 8px 30px ${color}20`, transition: 'all 0.6s ease',
        animation: showCards ? `flipCard 0.6s ease ${delay}s both` : playing ? 'pulse 1s infinite' : 'none',
        transform: showCards && card ? 'rotateY(0)' : ''
      }}>
        {card && showCards ? (
          <>
            <div style={{ fontSize: 32, fontWeight: 900, color: suitColor(card.suit) }}>{card.rank}</div>
            <div style={{ fontSize: 24, color: suitColor(card.suit) }}>{suitSymbol[card.suit]}</div>
          </>
        ) : (
          <div style={{ fontSize: 40 }}>🂠</div>
        )}
      </div>
      {result && <div style={{ fontSize: 20, fontWeight: 900, color, marginTop: 12, textShadow: `0 0 20px ${color}80` }}>
        {label === 'Dragon' ? result.result?.dragonValue : result.result?.tigerValue}
      </div>}
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Dragon Tiger / ড্রাগন টাইগার
      </h1>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #ef4444, #f59e0b)' }} />

          <div style={{ textAlign: 'center', padding: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
              {playing ? 'Dealing Cards...' : result ? (result.result?.winner === 'tie' ? 'TIE!' : `${result.result?.winner?.toUpperCase()} WINS!`) : 'Place Your Bet'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '20px 0', minHeight: 200 }}>
            {renderCard(result?.result?.dragonCard, 'Dragon', '#ef4444', 0)}
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>VS</div>
            {renderCard(result?.result?.tigerCard, 'Tiger', '#f59e0b', 0.3)}
          </div>

          {result && result.winAmount > 0 && (
            <div style={{
              textAlign: 'center', padding: 16, background: 'rgba(16,185,129,0.1)',
              borderTop: '1px solid var(--success)', animation: 'slideUp 0.5s ease'
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>WON ৳{result.winAmount.toFixed(2)}</div>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { id: 'dragon', label: 'Dragon', color: '#ef4444', pay: '1:1' },
              { id: 'tie', label: 'Tie', color: '#10b981', pay: '8:1' },
              { id: 'tiger', label: 'Tiger', color: '#f59e0b', pay: '1:1' }
            ].map(bt => (
              <button key={bt.id} onClick={() => setBetType(bt.id)} style={{
                padding: '16px 12px', borderRadius: 12, textAlign: 'center',
                background: betType === bt.id ? `${bt.color}22` : 'var(--bg-input)',
                border: `2px solid ${betType === bt.id ? bt.color : 'var(--border)'}`,
                transition: 'all 0.3s ease', transform: betType === bt.id ? 'scale(1.05)' : 'scale(1)'
              }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: bt.color }}>{bt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Pays {bt.pay}</div>
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
            {playing ? 'DEALING...' : `PLAY ৳${betAmount}`}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes flipCard { from { opacity: 0; transform: rotateY(90deg) scale(0.8); } to { opacity: 1; transform: rotateY(0) scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  );
};

export default DragonTigerGame;
