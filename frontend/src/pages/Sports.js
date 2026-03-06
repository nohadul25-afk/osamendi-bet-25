import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sportsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Sports = () => {
  const { user, updateBalance } = useAuth();
  const [sport, setSport] = useState('cricket');
  const [events, setEvents] = useState([]);
  const [betSlip, setBetSlip] = useState([]);
  const [stake, setStake] = useState('100');

  const sports = [
    { id: 'cricket', name: 'Cricket', icon: '🏏' },
    { id: 'football', name: 'Football', icon: '⚽' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'esports', name: 'Esports', icon: '🎮' },
  ];

  useEffect(() => {
    loadEvents();
  }, [sport]);

  const loadEvents = async () => {
    try {
      const { data } = await sportsAPI.getEvents({ sport });
      setEvents(data.events);
    } catch {
      // Demo events
      setEvents([
        { _id: '1', sport, league: 'IPL 2026', teamA: { name: 'Mumbai Indians', odds: 1.85 }, teamB: { name: 'Chennai Super Kings', odds: 2.10 }, drawOdds: 3.50, startTime: new Date(Date.now() + 3600000), status: 'upcoming' },
        { _id: '2', sport, league: 'BPL 2026', teamA: { name: 'Dhaka Dominators', odds: 1.65 }, teamB: { name: 'Comilla Victorians', odds: 2.40 }, startTime: new Date(Date.now() + 7200000), status: 'upcoming' },
        { _id: '3', sport, league: 'Big Bash', teamA: { name: 'Sydney Sixers', odds: 2.20 }, teamB: { name: 'Melbourne Stars', odds: 1.75 }, startTime: new Date(Date.now() + 10800000), status: 'upcoming' },
      ]);
    }
  };

  const addToBetSlip = (event, selection, odds) => {
    const existing = betSlip.find(b => b.eventId === event._id);
    if (existing) {
      setBetSlip(prev => prev.filter(b => b.eventId !== event._id));
    } else {
      setBetSlip(prev => [...prev, { eventId: event._id, event, market: 'match_winner', selection, odds }]);
    }
  };

  const totalOdds = betSlip.reduce((acc, b) => acc * b.odds, 1);
  const potentialWin = parseFloat(stake) * totalOdds;

  const placeBet = async () => {
    if (!user) return toast.error('Please login first');
    if (betSlip.length === 0) return toast.error('Add selections to bet slip');
    try {
      const { data } = await sportsAPI.placeBet({
        selections: betSlip.map(b => ({ eventId: b.eventId, market: b.market, selection: b.selection, odds: b.odds })),
        stake: parseFloat(stake)
      });
      toast.success(`Bet placed! Potential win: ৳${data.potentialWin.toFixed(2)}`);
      setBetSlip([]);
      updateBalance();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place bet');
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Sports Betting / স্পোর্টস বেটিং</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Events */}
        <div>
          {/* Sport Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
            {sports.map(s => (
              <button key={s.id} onClick={() => setSport(s.id)} style={{
                padding: '10px 20px', borderRadius: 10, whiteSpace: 'nowrap',
                background: sport === s.id ? 'var(--primary)' : 'var(--bg-card)',
                color: sport === s.id ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${sport === s.id ? 'var(--primary)' : 'var(--border)'}`,
                fontWeight: 600, fontSize: 13
              }}>{s.icon} {s.name}</button>
            ))}
          </div>

          {/* Event List */}
          {events.map(event => {
            const selectedTeam = betSlip.find(b => b.eventId === event._id);
            return (
              <div key={event._id} className="sport-card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  <span>{event.league}</span>
                  <span>{new Date(event.startTime).toLocaleString('en-BD', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="sport-teams">
                  <div className="sport-team">
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{event.teamA.name}</div>
                    <button onClick={() => addToBetSlip(event, 'teamA', event.teamA.odds)}
                      className={`odds-btn ${selectedTeam?.selection === 'teamA' ? 'selected' : ''}`}>
                      {event.teamA.odds.toFixed(2)}
                    </button>
                  </div>
                  <div className="sport-vs">VS</div>
                  <div className="sport-team">
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{event.teamB.name}</div>
                    <button onClick={() => addToBetSlip(event, 'teamB', event.teamB.odds)}
                      className={`odds-btn ${selectedTeam?.selection === 'teamB' ? 'selected' : ''}`}>
                      {event.teamB.odds.toFixed(2)}
                    </button>
                  </div>
                </div>
                {event.drawOdds && (
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <button onClick={() => addToBetSlip(event, 'draw', event.drawOdds)}
                      className={`odds-btn ${selectedTeam?.selection === 'draw' ? 'selected' : ''}`}
                      style={{ fontSize: 12 }}>
                      Draw {event.drawOdds.toFixed(2)}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {events.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No events available</div>}
        </div>

        {/* Bet Slip */}
        <div className="card" style={{ position: 'sticky', top: 80, height: 'fit-content' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Bet Slip ({betSlip.length})</h3>
          {betSlip.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
              Click on odds to add selections
            </div>
          ) : (
            <>
              {betSlip.map((b, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{b.event.teamA.name} vs {b.event.teamB.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>{b.selection === 'teamA' ? b.event.teamA.name : b.selection === 'teamB' ? b.event.teamB.name : 'Draw'}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{b.odds.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <input className="input" type="number" value={stake} onChange={(e) => setStake(e.target.value)} min="10" placeholder="Stake amount" style={{ marginBottom: 12 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Odds</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{totalOdds.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 16 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Potential Win</span>
                  <span style={{ fontWeight: 800, color: 'var(--success)' }}>৳{potentialWin.toFixed(2)}</span>
                </div>
                <button onClick={placeBet} className="btn btn-primary btn-lg btn-full">Place Bet</button>
                <button onClick={() => setBetSlip([])} className="btn btn-secondary btn-full" style={{ marginTop: 8 }}>Clear</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sports;
