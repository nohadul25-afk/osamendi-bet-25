import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TeenPattiGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const suitSymbol = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  const suitColor = (s) => ['hearts', 'diamonds'].includes(s) ? '#ef4444' : '#e2e8f0';

  const handRankNames = {
    'trail': 'Trail (Three of a Kind)',
    'pure_sequence': 'Pure Sequence',
    'sequence': 'Sequence',
    'color': 'Color (Flush)',
    'pair': 'Pair',
    'high_card': 'High Card'
  };

  const play = async () => {
    if (!user) return toast.error('Please login first');
    setPlaying(true);
    setResult(null);
    setRevealed(false);

    try {
      const { data } = await gamesAPI.teenPattiPlay({
        betAmount: parseFloat(betAmount),
        clientSeed: 'tp-' + Date.now()
      });
      setTimeout(() => setRevealed(true), 800);
      setTimeout(() => {
        setResult(data);
        setPlaying(false);
        updateBalance();
        if (data.winAmount > 0) toast.success(`Won ৳${data.winAmount.toFixed(2)}!`);
        else toast.error('Dealer wins!');
      }, 2500);
    } catch (error) {
      setPlaying(false);
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const renderHand = (cards, label, color, isDealer) => (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 12, letterSpacing: 2, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', minHeight: 110 }}>
        {(cards || [null, null, null]).map((card, i) => (
          <div key={i} style={{
            width: 65, height: 95, borderRadius: 10,
            background: card && revealed ? 'linear-gradient(135deg, #fff, #f5f5f5)' : 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: `1px solid ${color}40`, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 15px ${color}15`,
            animation: card && revealed ? `dealCard 0.4s ease ${i * 0.2 + (isDealer ? 0.6 : 0)}s both` : playing ? 'shimmer 1.5s infinite' : 'none'
          }}>
            {card && revealed ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 900, color: suitColor(card.suit) }}>{card.rank}</div>
                <div style={{ fontSize: 16, color: suitColor(card.suit) }}>{suitSymbol[card.suit]}</div>
              </>
            ) : <div style={{ fontSize: 28 }}>🂠</div>}
          </div>
        ))}
      </div>
      {result && (
        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color, opacity: 0.8 }}>
          {isDealer ? handRankNames[result.result?.dealerRank] || result.result?.dealerRank :
            handRankNames[result.result?.playerRank] || result.result?.playerRank}
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Teen Patti / তিন পাত্তি
      </h1>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />

          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 2 }}>
              {playing ? 'DEALING...' : result ? (result.winAmount > 0 ? 'YOU WIN!' : 'DEALER WINS') : 'TEEN PATTI'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 20, padding: '16px', alignItems: 'flex-start' }}>
            {renderHand(result?.result?.playerCards, 'Your Hand', '#3b82f6', false)}
            <div style={{ alignSelf: 'center', fontSize: 24, fontWeight: 900, color: 'var(--primary)', padding: '0 8px' }}>VS</div>
            {renderHand(result?.result?.dealerCards, 'Dealer', '#ef4444', true)}
          </div>

          {result && (
            <div style={{
              textAlign: 'center', padding: 16,
              background: result.winAmount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.05)',
              borderTop: `1px solid ${result.winAmount > 0 ? 'var(--success)' : 'var(--border)'}`,
              animation: 'slideUp 0.4s ease'
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: result.winAmount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {result.winAmount > 0 ? `WON ৳${result.winAmount.toFixed(2)}` : 'LOST'}
              </div>
              {result.multiplier > 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{result.multiplier}x multiplier</div>}
            </div>
          )}
        </div>

        <div className="card">
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

        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>Hand Rankings</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            Trail (3 of a kind) &gt; Pure Sequence &gt; Sequence &gt; Color (Flush) &gt; Pair &gt; High Card
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dealCard { from { opacity:0; transform: translateY(-40px) rotateY(90deg); } to { opacity:1; transform: translateY(0) rotateY(0); } }
        @keyframes slideUp { from { opacity:0; transform: translateY(15px); } to { opacity:1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:0.4; } 50% { opacity:0.7; } }
      `}</style>
    </div>
  );
};

export default TeenPattiGame;
