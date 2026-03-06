import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const cardTiers = [
  { id: 'bronze', label: 'Bronze', price: 50, maxWin: '500', color: '#cd7f32', bg: 'linear-gradient(135deg, #cd7f32, #8b5e3c)' },
  { id: 'silver', label: 'Silver', price: 200, maxWin: '5,000', color: '#c0c0c0', bg: 'linear-gradient(135deg, #c0c0c0, #808080)' },
  { id: 'gold', label: 'Gold', price: 500, maxWin: '25,000', color: '#f5a623', bg: 'linear-gradient(135deg, #f5a623, #d4880f)' },
  { id: 'diamond', label: 'Diamond', price: 1000, maxWin: '100,000', color: '#60a5fa', bg: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }
];

const ScratchCardGame = () => {
  const { user, updateBalance } = useAuth();
  const [selectedTier, setSelectedTier] = useState('gold');
  const [gameState, setGameState] = useState('idle'); // idle, bought, scratching, revealed
  const [roundId, setRoundId] = useState(null);
  const [cells, setCells] = useState(Array(9).fill({ symbol: '?', scratched: false }));
  const [result, setResult] = useState(null);
  const [scratchCount, setScratchCount] = useState(0);

  const tier = cardTiers.find(t => t.id === selectedTier);

  const buyCard = async () => {
    if (!user) return toast.error('Please login first');
    try {
      const { data } = await gamesAPI.scratchCardBuy({
        tier: selectedTier,
        clientSeed: 'scratch-' + Date.now()
      });
      setRoundId(data.roundId);
      setCells(Array(9).fill({ symbol: '?', scratched: false }));
      setScratchCount(0);
      setResult(null);
      setGameState('bought');
      updateBalance();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to buy');
    }
  };

  const scratchCell = async (idx) => {
    if (gameState !== 'bought' || cells[idx].scratched) return;

    const newCells = [...cells];
    newCells[idx] = { ...newCells[idx], scratched: true, scratching: true };
    setCells(newCells);
    const newCount = scratchCount + 1;
    setScratchCount(newCount);

    // When all scratched, reveal result
    if (newCount >= 9) {
      try {
        const { data } = await gamesAPI.scratchCardReveal({ roundId });
        setTimeout(() => {
          const finalCells = (data.result?.grid || []).map((sym, i) => ({
            symbol: sym, scratched: true, winning: data.result?.winningPositions?.includes(i)
          }));
          setCells(finalCells.length === 9 ? finalCells : newCells);
          setResult(data);
          setGameState('revealed');
          updateBalance();
          if (data.winAmount > 0) toast.success(`Won ৳${data.winAmount.toFixed(2)}!`);
          else toast.error('No prize this time!');
        }, 500);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed');
      }
    } else {
      // Show scratch animation then reveal a placeholder
      setTimeout(() => {
        newCells[idx] = { ...newCells[idx], scratching: false, symbol: '✨' };
        setCells([...newCells]);
      }, 300);
    }
  };

  const revealAll = async () => {
    if (gameState !== 'bought') return;
    const newCells = cells.map(c => ({ ...c, scratched: true, scratching: true }));
    setCells(newCells);

    try {
      const { data } = await gamesAPI.scratchCardReveal({ roundId });
      setTimeout(() => {
        const finalCells = (data.result?.grid || []).map((sym, i) => ({
          symbol: sym, scratched: true, winning: data.result?.winningPositions?.includes(i)
        }));
        setCells(finalCells.length === 9 ? finalCells : newCells);
        setResult(data);
        setGameState('revealed');
        updateBalance();
        if (data.winAmount > 0) toast.success(`Won ৳${data.winAmount.toFixed(2)}!`);
        else toast.error('No prize this time!');
      }, 800);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const symbols = ['💎', '7️⃣', '⭐', '🔔', '🍒', '🍀', '💰', '👑', '🎯'];

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg, #f5a623, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Scratch Card / স্ক্র্যাচ কার্ড
      </h1>

      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Tier Selection */}
        {gameState === 'idle' && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>Choose Card Tier</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {cardTiers.map(t => (
                <button key={t.id} onClick={() => setSelectedTier(t.id)} style={{
                  padding: '14px 10px', borderRadius: 12, textAlign: 'center',
                  background: selectedTier === t.id ? `${t.color}20` : 'var(--bg-input)',
                  border: `2px solid ${selectedTier === t.id ? t.color : 'var(--border)'}`,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: t.color }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>৳{t.price}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Max ৳{t.maxWin}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scratch Card */}
        <div className="card" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: tier.bg }} />

          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: tier.color, letterSpacing: 2 }}>
              {tier.label.toUpperCase()} CARD
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 300, margin: '0 auto' }}>
            {cells.map((cell, i) => (
              <button key={i} onClick={() => scratchCell(i)} style={{
                width: '100%', aspectRatio: '1', borderRadius: 12,
                background: cell.scratched
                  ? (cell.winning ? 'rgba(245,166,35,0.2)' : 'var(--bg-input)')
                  : tier.bg,
                border: `2px solid ${cell.winning ? 'var(--primary)' : cell.scratched ? 'var(--border)' : tier.color + '60'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: cell.scratched ? 28 : 20, cursor: cell.scratched ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                animation: cell.scratching ? 'scratchAnim 0.3s ease' : cell.winning ? 'winGlow 1s infinite' : 'none',
                boxShadow: cell.winning ? `0 0 20px ${tier.color}40` : 'none'
              }}>
                {cell.scratched ? (cell.symbol || '✨') : (
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700 }}>?</span>
                )}
              </button>
            ))}
          </div>

          {gameState === 'bought' && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button onClick={revealAll} style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', transition: 'all 0.2s'
              }}>Reveal All</button>
            </div>
          )}

          {result && (
            <div style={{
              textAlign: 'center', padding: 16, marginTop: 12,
              background: result.winAmount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.05)',
              borderRadius: 10, border: `1px solid ${result.winAmount > 0 ? 'var(--success)' : 'var(--border)'}`,
              animation: 'slideUp 0.4s ease'
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: result.winAmount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {result.winAmount > 0 ? `WON ৳${result.winAmount.toFixed(2)}` : 'TRY AGAIN'}
              </div>
              {result.multiplier > 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{result.multiplier}x multiplier</div>}
            </div>
          )}
        </div>

        {/* Buy / Reset */}
        <div className="card">
          {gameState === 'idle' && (
            <button onClick={buyCard} className="btn btn-primary btn-lg btn-full">
              BUY {tier.label} CARD ৳{tier.price}
            </button>
          )}
          {gameState === 'revealed' && (
            <button onClick={() => { setGameState('idle'); setResult(null); setCells(Array(9).fill({ symbol: '?', scratched: false })); }}
              className="btn btn-primary btn-lg btn-full">
              BUY ANOTHER CARD
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scratchAnim { 0% { transform: scale(1); } 50% { transform: scale(0.85) rotate(5deg); } 100% { transform: scale(1) rotate(0); } }
        @keyframes winGlow { 0%,100% { box-shadow: 0 0 10px rgba(245,166,35,0.2); } 50% { box-shadow: 0 0 25px rgba(245,166,35,0.5); } }
        @keyframes slideUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ScratchCardGame;
