import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MinesGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [mineCount, setMineCount] = useState(5);
  const [gameState, setGameState] = useState('idle');
  const [roundId, setRoundId] = useState(null);
  const [grid, setGrid] = useState(Array(25).fill('hidden'));
  const [gemsFound, setGemsFound] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [minePositions, setMinePositions] = useState([]);
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    if (!user) return toast.error('Please login first');
    setLoading(true);
    try {
      const { data } = await gamesAPI.minesStart({
        betAmount: parseFloat(betAmount), mineCount,
        clientSeed: 'mines-' + Date.now()
      });
      setRoundId(data.roundId);
      setGameState('playing');
      setGrid(Array(25).fill('hidden'));
      setGemsFound(0);
      setCurrentMultiplier(1);
      setMinePositions([]);
      updateBalance();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start');
    } finally {
      setLoading(false);
    }
  };

  const revealTile = async (position) => {
    if (gameState !== 'playing' || grid[position] !== 'hidden') return;
    try {
      const { data } = await gamesAPI.minesReveal({ roundId, position });
      const newGrid = [...grid];

      if (data.isMine) {
        data.minePositions.forEach(p => { newGrid[p] = 'mine'; });
        newGrid[position] = 'exploded';
        setGrid(newGrid);
        setMinePositions(data.minePositions);
        setGameState('lost');
        updateBalance();
        toast.error('BOOM! You hit a mine!');
      } else {
        newGrid[position] = 'gem';
        setGrid(newGrid);
        setGemsFound(data.gemsFound);
        setCurrentMultiplier(data.currentMultiplier);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error');
    }
  };

  const cashout = async () => {
    if (gameState !== 'playing' || gemsFound === 0) return;
    try {
      const { data } = await gamesAPI.minesCashout({ roundId });
      const newGrid = [...grid];
      data.minePositions.forEach(p => { if (newGrid[p] === 'hidden') newGrid[p] = 'mine'; });
      setGrid(newGrid);
      setMinePositions(data.minePositions);
      setGameState('won');
      updateBalance();
      toast.success(`Cashed out ৳${data.winAmount.toFixed(2)} at ${data.multiplier.toFixed(2)}x!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cashout failed');
    }
  };

  const getTileStyle = (state) => {
    const base = {
      width: '100%', aspectRatio: '1', borderRadius: 8, border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24, cursor: gameState === 'playing' && state === 'hidden' ? 'pointer' : 'default',
      transition: 'all 0.2s'
    };
    switch (state) {
      case 'hidden': return { ...base, background: 'var(--bg-input)', border: '1px solid var(--border)' };
      case 'gem': return { ...base, background: 'rgba(16,185,129,0.2)', border: '2px solid var(--success)' };
      case 'mine': return { ...base, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--border)' };
      case 'exploded': return { ...base, background: 'rgba(239,68,68,0.3)', border: '2px solid var(--danger)' };
      default: return base;
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Mines / মাইনস</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* Grid */}
        <div className="card">
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8,
            maxWidth: 400, margin: '0 auto'
          }}>
            {grid.map((state, i) => (
              <button key={i} onClick={() => revealTile(i)} style={getTileStyle(state)}
                disabled={gameState !== 'playing' || state !== 'hidden'}>
                {state === 'gem' && '💎'}
                {state === 'mine' && '💣'}
                {state === 'exploded' && '💥'}
                {state === 'hidden' && gameState === 'playing' && '?'}
              </button>
            ))}
          </div>

          {gameState === 'playing' && gemsFound > 0 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>
                {currentMultiplier.toFixed(2)}x
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Potential: ৳{(parseFloat(betAmount) * currentMultiplier).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="card">
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Bet Amount (৳)</label>
            <input className="input" type="number" value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={gameState === 'playing'} min="10" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Mines: {mineCount}</label>
            <input type="range" min="1" max="24" value={mineCount}
              onChange={(e) => setMineCount(parseInt(e.target.value))}
              disabled={gameState === 'playing'}
              style={{ width: '100%' }} />
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              {[1, 3, 5, 10, 20].map(n => (
                <button key={n} onClick={() => setMineCount(n)}
                  disabled={gameState === 'playing'}
                  style={{
                    flex: 1, padding: 4, fontSize: 11, fontWeight: 600,
                    background: mineCount === n ? 'var(--primary)' : 'var(--bg-input)',
                    color: mineCount === n ? '#000' : 'var(--text-secondary)',
                    border: '1px solid var(--border)', borderRadius: 4
                  }}>{n}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-input)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Gems Found</span>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>{gemsFound} 💎</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Multiplier</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{currentMultiplier.toFixed(2)}x</span>
            </div>
          </div>

          {gameState === 'idle' && (
            <button onClick={startGame} className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? 'Starting...' : 'Start Game'}
            </button>
          )}
          {gameState === 'playing' && (
            <button onClick={cashout} className="btn btn-success btn-lg btn-full"
              disabled={gemsFound === 0}>
              Cashout ৳{(parseFloat(betAmount) * currentMultiplier).toFixed(2)}
            </button>
          )}
          {(gameState === 'won' || gameState === 'lost') && (
            <button onClick={() => { setGameState('idle'); setGrid(Array(25).fill('hidden')); }}
              className="btn btn-secondary btn-lg btn-full">
              New Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinesGame;
