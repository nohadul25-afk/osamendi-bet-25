import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AndarBaharGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [betSide, setBetSide] = useState('andar');
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [dealPhase, setDealPhase] = useState(0);

  const suitSymbol = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  const suitColor = (s) => ['hearts', 'diamonds'].includes(s) ? '#ef4444' : '#e2e8f0';

  const MiniCard = ({ card, delay = 0 }) => (
    <div style={{
      width: 48, height: 68, borderRadius: 8,
      background: 'linear-gradient(135deg, #fff, #f0f0f0)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)', animation: `popIn 0.3s ease ${delay}s both`,
      flexShrink: 0
    }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: suitColor(card.suit) }}>{card.rank}</div>
      <div style={{ fontSize: 12, color: suitColor(card.suit) }}>{suitSymbol[card.suit]}</div>
    </div>
  );

  const play = async () => {
    if (!user) return toast.error('Please login first');
    setPlaying(true);
    setResult(null);
    setDealPhase(0);

    try {
      const { data } = await gamesAPI.andarBaharPlay({
        betAmount: parseFloat(betAmount), betSide,
        clientSeed: 'ab-' + Date.now()
      });
      setDealPhase(1);
      setTimeout(() => setDealPhase(2), 800);
      setTimeout(() => {
        setResult(data);
        setPlaying(false);
        updateBalance();
        if (data.winAmount > 0) toast.success(`Won ৳${data.winAmount.toFixed(2)}!`);
        else toast.error('Better luck next time!');
      }, 2500);
    } catch (error) {
      setPlaying(false);
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Andar Bahar / আন্দর বাহার
      </h1>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }} />

          {/* Joker Card */}
          <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 10 }}>JOKER CARD</div>
            {result?.result?.jokerCard ? (
              <div style={{
                width: 80, height: 110, margin: '0 auto', borderRadius: 12,
                background: 'linear-gradient(135deg, #fff, #f5f5f5)',
                border: '3px solid var(--primary)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 30px rgba(245,166,35,0.3)', animation: 'popIn 0.4s ease'
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: suitColor(result.result.jokerCard.suit) }}>{result.result.jokerCard.rank}</div>
                <div style={{ fontSize: 22, color: suitColor(result.result.jokerCard.suit) }}>{suitSymbol[result.result.jokerCard.suit]}</div>
              </div>
            ) : (
              <div style={{
                width: 80, height: 110, margin: '0 auto', borderRadius: 12,
                background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
                animation: playing ? 'pulse 1s infinite' : 'none'
              }}>🂠</div>
            )}
          </div>

          {/* Andar / Bahar sides */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px' }}>
            <div style={{
              textAlign: 'center', padding: 16, borderRadius: 12,
              background: betSide === 'andar' ? 'rgba(139,92,246,0.1)' : 'transparent',
              border: `1px solid ${betSide === 'andar' ? '#8b5cf6' : 'var(--border)'}`
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#8b5cf6', marginBottom: 10, letterSpacing: 2 }}>ANDAR</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', minHeight: 68 }}>
                {result?.result?.andarCards?.map((card, i) => (
                  <MiniCard key={i} card={card} delay={i * 0.15} />
                ))}
              </div>
              {result && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{result.result?.andarCards?.length || 0} cards</div>}
            </div>

            <div style={{
              textAlign: 'center', padding: 16, borderRadius: 12,
              background: betSide === 'bahar' ? 'rgba(236,72,153,0.1)' : 'transparent',
              border: `1px solid ${betSide === 'bahar' ? '#ec4899' : 'var(--border)'}`
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ec4899', marginBottom: 10, letterSpacing: 2 }}>BAHAR</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', minHeight: 68 }}>
                {result?.result?.baharCards?.map((card, i) => (
                  <MiniCard key={i} card={card} delay={i * 0.15 + 0.1} />
                ))}
              </div>
              {result && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{result.result?.baharCards?.length || 0} cards</div>}
            </div>
          </div>

          {result && (
            <div style={{
              textAlign: 'center', padding: 16,
              background: result.winAmount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.05)',
              borderTop: `1px solid ${result.winAmount > 0 ? 'var(--success)' : 'var(--border)'}`,
              animation: 'slideUp 0.4s ease'
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: result.winAmount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {result.result?.winningSide?.toUpperCase()} - {result.winAmount > 0 ? `WON ৳${result.winAmount.toFixed(2)}` : 'LOST'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Match found in {result.result?.totalCards || 0} cards
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { id: 'andar', label: 'Andar', color: '#8b5cf6', pay: '1.9:1' },
              { id: 'bahar', label: 'Bahar', color: '#ec4899', pay: '2:1' }
            ].map(bt => (
              <button key={bt.id} onClick={() => setBetSide(bt.id)} style={{
                padding: '18px 12px', borderRadius: 12, textAlign: 'center',
                background: betSide === bt.id ? `${bt.color}22` : 'var(--bg-input)',
                border: `2px solid ${betSide === bt.id ? bt.color : 'var(--border)'}`,
                transition: 'all 0.3s ease', transform: betSide === bt.id ? 'scale(1.03)' : 'scale(1)'
              }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: bt.color }}>{bt.label}</div>
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
        @keyframes popIn { from { opacity:0; transform: scale(0.5); } to { opacity:1; transform: scale(1); } }
        @keyframes slideUp { from { opacity:0; transform: translateY(15px); } to { opacity:1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:0.7; } }
      `}</style>
    </div>
  );
};

export default AndarBaharGame;
