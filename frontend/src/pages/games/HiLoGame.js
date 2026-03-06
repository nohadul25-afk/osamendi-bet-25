import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const HiLoGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const cardName = (val) => val === 1 ? 'A' : val === 11 ? 'J' : val === 12 ? 'Q' : val === 13 ? 'K' : val;
  const suitEmoji = (s) => s === 'hearts' ? '♥️' : s === 'diamonds' ? '♦️' : s === 'clubs' ? '♣️' : '♠️';

  const play = async (guess) => {
    if (!user) return toast.error('Please login first');
    setLoading(true);
    try {
      const { data } = await gamesAPI.hiloPlay({ betAmount: parseFloat(betAmount), guess, clientSeed: 'hilo-' + Date.now() });
      setResult(data);
      updateBalance();
      setHistory(prev => [data, ...prev].slice(0, 15));
      if (data.win) toast.success(`Won ৳${data.winAmount.toFixed(2)}!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Hi-Lo / হাই-লো</h1>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 24 }}>
            {/* Card 1 */}
            <div style={{ width: 120, height: 170, borderRadius: 12, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
              {result ? (
                <>
                  <div style={{ fontSize: 14, color: ['hearts', 'diamonds'].includes(result.card1.suit) ? 'red' : 'black' }}>{suitEmoji(result.card1.suit)}</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#000' }}>{cardName(result.card1.value)}</div>
                  <div style={{ fontSize: 14, color: ['hearts', 'diamonds'].includes(result.card1.suit) ? 'red' : 'black' }}>{suitEmoji(result.card1.suit)}</div>
                </>
              ) : <div style={{ fontSize: 36, color: '#ccc' }}>?</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, fontWeight: 700, color: 'var(--text-muted)' }}>VS</div>
            {/* Card 2 */}
            <div style={{ width: 120, height: 170, borderRadius: 12, background: result ? 'white' : 'var(--bg-input)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', border: result ? 'none' : '2px solid var(--border)' }}>
              {result ? (
                <>
                  <div style={{ fontSize: 14, color: ['hearts', 'diamonds'].includes(result.card2.suit) ? 'red' : 'black' }}>{suitEmoji(result.card2.suit)}</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#000' }}>{cardName(result.card2.value)}</div>
                  <div style={{ fontSize: 14, color: ['hearts', 'diamonds'].includes(result.card2.suit) ? 'red' : 'black' }}>{suitEmoji(result.card2.suit)}</div>
                </>
              ) : <div style={{ fontSize: 36, color: '#666' }}>?</div>}
            </div>
          </div>
          {result && (
            <div style={{ fontSize: 20, fontWeight: 800, color: result.win ? 'var(--success)' : 'var(--danger)', marginBottom: 16 }}>
              {result.win ? `WON ৳${result.winAmount.toFixed(2)}` : 'LOST'}
            </div>
          )}
          <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} min="10" style={{ marginBottom: 16, textAlign: 'center', fontSize: 18, fontWeight: 700 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => play('higher')} className="btn btn-success btn-lg" style={{ flex: 1 }} disabled={loading}>
              ⬆️ Higher
            </button>
            <button onClick={() => play('lower')} className="btn btn-danger btn-lg" style={{ flex: 1 }} disabled={loading}>
              ⬇️ Lower
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Payout: 1.96x</div>
        </div>
      </div>
    </div>
  );
};

export default HiLoGame;
