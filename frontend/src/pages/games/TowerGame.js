import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TowerGame = () => {
  const { user, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState('100');
  const [difficulty, setDifficulty] = useState('medium');
  const [gameState, setGameState] = useState('idle');
  const [roundId, setRoundId] = useState(null);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [revealedFloors, setRevealedFloors] = useState({});
  const [towerConfig, setTowerConfig] = useState(null);

  const difficulties = { easy: { cols: 4, safe: 3 }, medium: { cols: 3, safe: 2 }, hard: { cols: 3, safe: 1 } };
  const totalFloors = 10;

  const startGame = async () => {
    if (!user) return toast.error('Please login first');
    try {
      const { data } = await gamesAPI.towerStart({
        betAmount: parseFloat(betAmount), difficulty,
        clientSeed: 'tower-' + Date.now()
      });
      setRoundId(data.roundId);
      setGameState('playing');
      setCurrentFloor(0);
      setMultiplier(1);
      setRevealedFloors({});
      setTowerConfig(difficulties[difficulty]);
      updateBalance();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start');
    }
  };

  const climbFloor = async (floor, position) => {
    if (gameState !== 'playing' || floor !== currentFloor) return;
    try {
      const { data } = await gamesAPI.towerClimb({ roundId, floor, position });
      const newRevealed = { ...revealedFloors };
      newRevealed[floor] = { position, safe: data.safe };

      if (data.safe) {
        setRevealedFloors(newRevealed);
        setCurrentFloor(floor + 1);
        setMultiplier(data.nextMultiplier || multiplier * 1.5);
        if (floor + 1 >= totalFloors) {
          setGameState('won');
          updateBalance();
          toast.success(`Tower conquered! Won ৳${data.winAmount?.toFixed(2)}!`);
        }
      } else {
        newRevealed[floor] = { position, safe: false };
        if (data.minePositions) {
          Object.entries(data.minePositions).forEach(([f, pos]) => {
            newRevealed[f] = { ...newRevealed[f], mines: pos };
          });
        }
        setRevealedFloors(newRevealed);
        setGameState('lost');
        updateBalance();
        toast.error('BOOM! You hit a trap!');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const cashout = async () => {
    if (gameState !== 'playing' || currentFloor === 0) return;
    try {
      const { data } = await gamesAPI.towerCashout({ roundId });
      setGameState('cashedout');
      updateBalance();
      toast.success(`Cashed out! Won ৳${data.winAmount.toFixed(2)} (${data.multiplier.toFixed(2)}x)`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cashout failed');
    }
  };

  const reset = () => {
    setGameState('idle');
    setRoundId(null);
    setCurrentFloor(0);
    setMultiplier(1);
    setRevealedFloors({});
  };

  const cols = towerConfig?.cols || difficulties[difficulty].cols;

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Tower / টাওয়ার
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, maxWidth: 800, margin: '0 auto' }}>
        {/* Tower */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />

          <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 6, padding: '16px 8px' }}>
            {Array.from({ length: totalFloors }).map((_, floor) => {
              const isCurrentFloor = floor === currentFloor && gameState === 'playing';
              const revealed = revealedFloors[floor];
              const floorMult = Math.pow(difficulty === 'easy' ? 1.3 : difficulty === 'medium' ? 1.5 : 2.5, floor + 1).toFixed(2);

              return (
                <div key={floor} style={{
                  display: 'flex', gap: 6, alignItems: 'center',
                  opacity: gameState === 'playing' && floor > currentFloor ? 0.4 : 1,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ width: 45, fontSize: 11, fontWeight: 700, color: isCurrentFloor ? 'var(--primary)' : 'var(--text-muted)', textAlign: 'right' }}>
                    {floorMult}x
                  </div>
                  <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                    {Array.from({ length: cols }).map((_, pos) => {
                      const isRevealed = revealed?.position === pos;
                      const isMine = revealed?.mines?.includes(pos);
                      const isSafe = isRevealed && revealed.safe;
                      const isTrap = isRevealed && !revealed.safe;

                      let bg = 'var(--bg-input)';
                      let borderColor = 'var(--border)';
                      let content = '';

                      if (isSafe) { bg = 'rgba(16,185,129,0.2)'; borderColor = '#10b981'; content = '⭐'; }
                      else if (isTrap) { bg = 'rgba(239,68,68,0.2)'; borderColor = '#ef4444'; content = '💥'; }
                      else if (isMine) { bg = 'rgba(239,68,68,0.1)'; borderColor = '#ef444440'; content = '💣'; }
                      else if (isCurrentFloor) { bg = 'rgba(245,166,35,0.1)'; borderColor = 'var(--primary)'; }

                      return (
                        <button key={pos} onClick={() => climbFloor(floor, pos)}
                          disabled={!isCurrentFloor}
                          style={{
                            flex: 1, height: 40, borderRadius: 8, background: bg,
                            border: `2px solid ${borderColor}`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 18,
                            cursor: isCurrentFloor ? 'pointer' : 'default',
                            transition: 'all 0.2s ease',
                            animation: isCurrentFloor ? 'glowPulse 2s infinite' : isSafe || isTrap ? 'popIn 0.3s ease' : 'none',
                            transform: isCurrentFloor ? 'scale(1)' : 'scale(0.95)'
                          }}>
                          {content}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {gameState === 'playing' && currentFloor > 0 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)', textShadow: '0 0 20px rgba(245,166,35,0.4)' }}>
                {multiplier.toFixed(2)}x
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Floor {currentFloor}/{totalFloors}</div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="card">
          {gameState === 'idle' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Difficulty</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['easy', 'medium', 'hard'].map(d => (
                    <button key={d} onClick={() => setDifficulty(d)} style={{
                      flex: 1, padding: '10px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      textTransform: 'capitalize',
                      background: difficulty === d ? 'rgba(245,166,35,0.15)' : 'var(--bg-input)',
                      border: `1px solid ${difficulty === d ? 'var(--primary)' : 'var(--border)'}`,
                      color: difficulty === d ? 'var(--primary)' : 'var(--text-secondary)'
                    }}>{d}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Bet Amount (৳)</label>
                <input className="input" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} min="10" />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[50, 100, 500, 1000].map(amt => (
                    <button key={amt} onClick={() => setBetAmount(amt.toString())} style={{
                      flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)',
                      borderRadius: 6, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600
                    }}>{amt}</button>
                  ))}
                </div>
              </div>

              <button onClick={startGame} className="btn btn-primary btn-lg btn-full">START CLIMBING</button>
            </>
          )}

          {gameState === 'playing' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 16, padding: 16, background: 'var(--bg-input)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CURRENT WIN</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)' }}>
                  ৳{(parseFloat(betAmount) * multiplier).toFixed(2)}
                </div>
              </div>
              <button onClick={cashout} className="btn btn-success btn-lg btn-full" disabled={currentFloor === 0}
                style={{ animation: currentFloor > 0 ? 'glow 1.5s infinite' : 'none' }}>
                CASHOUT {multiplier.toFixed(2)}x
              </button>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                Pick a tile on floor {currentFloor + 1}
              </div>
            </>
          )}

          {(gameState === 'lost' || gameState === 'cashedout' || gameState === 'won') && (
            <>
              <div style={{
                textAlign: 'center', marginBottom: 16, padding: 16, borderRadius: 12,
                background: gameState === 'lost' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                border: `1px solid ${gameState === 'lost' ? 'var(--danger)' : 'var(--success)'}`
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: gameState === 'lost' ? 'var(--danger)' : 'var(--success)' }}>
                  {gameState === 'lost' ? 'GAME OVER' : gameState === 'won' ? 'TOWER CONQUERED!' : 'CASHED OUT!'}
                </div>
              </div>
              <button onClick={reset} className="btn btn-primary btn-lg btn-full">PLAY AGAIN</button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 5px rgba(245,166,35,0.2); } 50% { box-shadow: 0 0 15px rgba(245,166,35,0.4); } }
        @keyframes popIn { from { opacity:0; transform: scale(0.5); } to { opacity:1; transform: scale(1); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 10px rgba(16,185,129,0.3); } 50% { box-shadow: 0 0 25px rgba(16,185,129,0.5); } }
        @media (max-width: 768px) { .animate-fadeIn > div:nth-child(2) { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
};

export default TowerGame;
