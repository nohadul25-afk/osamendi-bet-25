import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const BlackjackGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [gameState, setGameState] = useState('idle');
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const cardDisplay = (card) => {
    if (card.value === 'hidden') return '🂠';
    const suitMap = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
    return `${card.value}${suitMap[card.suit] || ''}`;
  };

  const handValue = (hand) => {
    let val = 0, aces = 0;
    hand.forEach(c => {
      if (c.value === 'hidden') return;
      if (c.value === 'A') { aces++; val += 11; }
      else if (['J','Q','K'].includes(c.value)) val += 10;
      else val += parseInt(c.value);
    });
    while (val > 21 && aces > 0) { val -= 10; aces--; }
    return val;
  };

  const deal = async () => {
    if (!user) return toast.error('Please login first');
    setLoading(true);
    try {
      const { data } = await gamesAPI.blackjackDeal({ betAmount: parseFloat(betAmount), clientSeed: 'bj-' + Date.now() });
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      updateBalance();
      if (data.isBlackjack || data.isDealerBlackjack) {
        setGameState('done');
        setResult(data.status === 'blackjack' ? 'Blackjack! You win!' : data.status === 'push' ? 'Push - Tie!' : 'Dealer Blackjack');
      } else {
        setGameState('playing');
        setResult(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setGameState('idle');
    setPlayerHand([]);
    setDealerHand([]);
    setResult(null);
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Blackjack / ব্ল্যাকজ্যাক</h1>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ padding: 32 }}>
          {/* Dealer */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
              Dealer {dealerHand.length > 0 && `(${handValue(dealerHand)})`}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {dealerHand.map((card, i) => (
                <div key={i} style={{ width: 70, height: 100, borderRadius: 8, background: card.value === 'hidden' ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: card.value === 'hidden' ? 28 : 18, fontWeight: 900, color: ['hearts', 'diamonds'].includes(card.suit) ? 'red' : 'black', boxShadow: 'var(--shadow-sm)' }}>
                  {cardDisplay(card)}
                </div>
              ))}
              {dealerHand.length === 0 && <div style={{ width: 70, height: 100, borderRadius: 8, background: 'var(--bg-input)', border: '2px dashed var(--border)' }} />}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

          {/* Player */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>
              Your Hand {playerHand.length > 0 && `(${handValue(playerHand)})`}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {playerHand.map((card, i) => (
                <div key={i} style={{ width: 70, height: 100, borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: ['hearts', 'diamonds'].includes(card.suit) ? 'red' : 'black', boxShadow: 'var(--shadow-sm)', border: '2px solid var(--primary)' }}>
                  {cardDisplay(card)}
                </div>
              ))}
              {playerHand.length === 0 && <div style={{ width: 70, height: 100, borderRadius: 8, background: 'var(--bg-input)', border: '2px dashed var(--primary)' }} />}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div style={{ textAlign: 'center', marginBottom: 16, padding: 12, borderRadius: 10, background: result.includes('win') || result.includes('Blackjack') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.includes('win') || result.includes('Blackjack') ? 'var(--success)' : 'var(--danger)'}` }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: result.includes('win') || result.includes('Blackjack') ? 'var(--success)' : result.includes('Push') ? 'var(--warning)' : 'var(--danger)' }}>{result}</div>
            </div>
          )}

          {/* Controls */}
          {gameState === 'idle' && (
            <>
              <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} min="10" style={{ marginBottom: 16, textAlign: 'center', fontSize: 18, fontWeight: 700 }} />
              <button onClick={deal} className="btn btn-primary btn-lg btn-full" disabled={loading}>
                {loading ? 'Dealing...' : 'Deal'}
              </button>
            </>
          )}

          {gameState === 'playing' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-success btn-lg" style={{ flex: 1 }}>Hit</button>
              <button className="btn btn-danger btn-lg" style={{ flex: 1 }}>Stand</button>
              <button className="btn btn-secondary btn-lg">Double</button>
            </div>
          )}

          {gameState === 'done' && (
            <button onClick={reset} className="btn btn-primary btn-lg btn-full">New Game</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlackjackGame;
