import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const suitSymbol = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const suitColor = (s) => ['hearts', 'diamonds'].includes(s) ? '#ef4444' : '#e2e8f0';

const payTable = [
  { hand: 'Royal Flush', payout: '250x' },
  { hand: 'Straight Flush', payout: '50x' },
  { hand: 'Four of a Kind', payout: '25x' },
  { hand: 'Full House', payout: '9x' },
  { hand: 'Flush', payout: '6x' },
  { hand: 'Straight', payout: '4x' },
  { hand: 'Three of a Kind', payout: '3x' },
  { hand: 'Two Pair', payout: '2x' },
  { hand: 'Jacks or Better', payout: '1x' },
];

const VideoPokerGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [gamePhase, setGamePhase] = useState('idle'); // idle, dealt, complete
  const [cards, setCards] = useState([]);
  const [held, setHeld] = useState([false, false, false, false, false]);
  const [roundId, setRoundId] = useState(null);
  const [result, setResult] = useState(null);
  const [dealing, setDealing] = useState(false);

  const deal = async () => {
    if (!user) return toast.error('Please login first');
    setDealing(true);
    setResult(null);
    setHeld([false, false, false, false, false]);

    try {
      const { data } = await gamesAPI.videoPokerDeal({
        betAmount: parseFloat(betAmount),
        clientSeed: 'vp-' + Date.now()
      });
      setRoundId(data.roundId);
      setTimeout(() => {
        setCards(data.cards || []);
        setGamePhase('dealt');
        setDealing(false);
        updateBalance();
      }, 800);
    } catch (error) {
      setDealing(false);
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const draw = async () => {
    if (gamePhase !== 'dealt') return;
    setDealing(true);

    try {
      const { data } = await gamesAPI.videoPokerDraw({
        roundId, holdPositions: held
      });
      setTimeout(() => {
        setCards(data.finalCards || data.cards || []);
        setResult(data);
        setGamePhase('complete');
        setDealing(false);
        updateBalance();
        if (data.winAmount > 0) toast.success(`${data.handRank || 'Winner'}! Won ৳${data.winAmount.toFixed(2)}`);
        else toast.error('No winning hand');
      }, 800);
    } catch (error) {
      setDealing(false);
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const toggleHold = (idx) => {
    if (gamePhase !== 'dealt') return;
    setHeld(prev => { const n = [...prev]; n[idx] = !n[idx]; return n; });
  };

  const reset = () => {
    setGamePhase('idle');
    setCards([]);
    setHeld([false, false, false, false, false]);
    setRoundId(null);
    setResult(null);
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Video Poker / ভিডিও পোকার
      </h1>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Pay Table */}
        <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {payTable.map(p => (
              <div key={p.hand} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: result?.handRank === p.hand ? 'rgba(245,166,35,0.2)' : 'var(--bg-input)',
                border: `1px solid ${result?.handRank === p.hand ? 'var(--primary)' : 'var(--border)'}`,
                color: result?.handRank === p.hand ? 'var(--primary)' : 'var(--text-muted)'
              }}>
                {p.hand} <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{p.payout}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="card" style={{ marginBottom: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #10b981, #3b82f6)' }} />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', padding: '24px 0', flexWrap: 'wrap' }}>
            {(cards.length > 0 ? cards : [null, null, null, null, null]).map((card, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {held[i] && gamePhase === 'dealt' && (
                  <div style={{
                    position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--primary)', color: '#000', padding: '2px 8px',
                    borderRadius: 4, fontSize: 10, fontWeight: 800, zIndex: 1,
                    animation: 'popIn 0.2s ease'
                  }}>HELD</div>
                )}
                <button onClick={() => toggleHold(i)} style={{
                  width: 80, height: 115, borderRadius: 10, padding: 0, cursor: gamePhase === 'dealt' ? 'pointer' : 'default',
                  background: card ? 'linear-gradient(135deg, #fff, #f5f5f5)' : 'linear-gradient(135deg, #1e293b, #0f172a)',
                  border: `2px solid ${held[i] ? 'var(--primary)' : card ? '#ddd' : 'var(--border)'}`,
                  boxShadow: held[i] ? '0 0 15px rgba(245,166,35,0.4)' : '0 4px 12px rgba(0,0,0,0.2)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  animation: dealing ? `flipCard 0.5s ease ${i * 0.1}s both` : 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}>
                  {card ? (
                    <>
                      <div style={{ fontSize: 26, fontWeight: 900, color: suitColor(card.suit) }}>{card.rank}</div>
                      <div style={{ fontSize: 22, color: suitColor(card.suit) }}>{suitSymbol[card.suit]}</div>
                    </>
                  ) : <div style={{ fontSize: 32 }}>🂠</div>}
                </button>
              </div>
            ))}
          </div>

          {gamePhase === 'dealt' && (
            <div style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, paddingBottom: 12, animation: 'pulse 2s infinite' }}>
              Tap cards to HOLD, then DRAW
            </div>
          )}

          {result && (
            <div style={{
              padding: 16,
              background: result.winAmount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.05)',
              borderTop: `1px solid ${result.winAmount > 0 ? 'var(--success)' : 'var(--border)'}`,
              animation: 'slideUp 0.4s ease'
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: result.winAmount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {result.handRank || (result.winAmount > 0 ? 'WINNER' : 'NO WIN')}
              </div>
              {result.winAmount > 0 && (
                <div style={{ fontSize: 14, color: 'var(--success)', marginTop: 4 }}>Won ৳{result.winAmount.toFixed(2)}</div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Bet Amount (৳)</label>
            <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} disabled={gamePhase !== 'idle'} min="10" />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[50, 100, 500, 1000, 5000].map(amt => (
                <button key={amt} onClick={() => setBetAmount(amt.toString())} disabled={gamePhase !== 'idle'} style={{
                  flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 6, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600
                }}>{amt}</button>
              ))}
            </div>
          </div>

          {gamePhase === 'idle' && (
            <button onClick={deal} className="btn btn-primary btn-lg btn-full" disabled={dealing}>DEAL ৳{betAmount}</button>
          )}
          {gamePhase === 'dealt' && (
            <button onClick={draw} className="btn btn-success btn-lg btn-full" disabled={dealing}>DRAW</button>
          )}
          {gamePhase === 'complete' && (
            <button onClick={reset} className="btn btn-primary btn-lg btn-full">NEW HAND</button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes flipCard { 0% { transform: rotateY(90deg) scale(0.8); opacity:0; } 100% { transform: rotateY(0) scale(1); opacity:1; } }
        @keyframes popIn { from { transform: translateX(-50%) scale(0); } to { transform: translateX(-50%) scale(1); } }
        @keyframes slideUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>
    </div>
  );
};

export default VideoPokerGame;
