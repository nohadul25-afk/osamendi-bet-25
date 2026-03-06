import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Home = () => {
  const { user } = useAuth();
  const { liveBets, onlineCount } = useSocket();
  const navigate = useNavigate();
  const [bannerIndex, setBannerIndex] = useState(0);

  const banners = [
    { title: 'Welcome to Osamendi Bet 25', titleBn: 'ওসামেন্ডি বেট ২৫ এ স্বাগতম', subtitle: '100% Welcome Bonus up to ৳5,000', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { title: 'Crash Game', titleBn: 'ক্র্যাশ গেম', subtitle: 'Win up to 1000x your bet!', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { title: 'Sports Betting', titleBn: 'স্পোর্টস বেটিং', subtitle: 'Bet on Cricket, Football & more', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { title: 'Daily Cashback', titleBn: 'দৈনিক ক্যাশব্যাক', subtitle: 'Get up to 5% cashback daily', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const featuredGames = [
    { name: 'Crash', icon: '📈', path: '/games/crash', color: '#f5576c', players: '2.3K' },
    { name: 'Slots', icon: '🎰', path: '/games/slots', color: '#667eea', players: '5.1K' },
    { name: 'Dice', icon: '🎲', path: '/games/dice', color: '#43e97b', players: '1.8K' },
    { name: 'Mines', icon: '💣', path: '/games/mines', color: '#f093fb', players: '3.2K' },
    { name: 'Plinko', icon: '⚪', path: '/games/plinko', color: '#4facfe', players: '1.5K' },
    { name: 'Roulette', icon: '🎡', path: '/games/roulette', color: '#e74c3c', players: '2.7K' },
    { name: 'Blackjack', icon: '🃏', path: '/games/blackjack', color: '#2ecc71', players: '1.9K' },
    { name: 'Wheel', icon: '🎯', path: '/games/wheel', color: '#f39c12', players: '4.0K' },
    { name: 'Coin Flip', icon: '🪙', path: '/games/coinflip', color: '#e67e22', players: '2.1K' },
    { name: 'Limbo', icon: '🚀', path: '/games/limbo', color: '#9b59b6', players: '1.2K' },
    { name: 'Keno', icon: '🔢', path: '/games/keno', color: '#1abc9c', players: '800' },
    { name: 'Hi-Lo', icon: '↕️', path: '/games/hilo', color: '#3498db', players: '950' },
  ];

  const sportCategories = [
    { name: 'Cricket', icon: '🏏', matches: 24 },
    { name: 'Football', icon: '⚽', matches: 56 },
    { name: 'Basketball', icon: '🏀', matches: 18 },
    { name: 'Tennis', icon: '🎾', matches: 12 },
    { name: 'Esports', icon: '🎮', matches: 8 },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Banner Slider */}
      <div className="banner-slider">
        <div className="banner-slide" style={{ background: banners[bannerIndex].bg }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#fff' }}>
              {banners[bannerIndex].title}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
              {banners[bannerIndex].titleBn}
            </p>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 20 }}>
              {banners[bannerIndex].subtitle}
            </p>
            {!user ? (
              <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg">
                Sign Up & Get Bonus
              </button>
            ) : (
              <button onClick={() => navigate('/wallet')} className="btn btn-primary btn-lg">
                Deposit Now
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIndex(i)}
              style={{
                width: i === bannerIndex ? 24 : 8, height: 8,
                borderRadius: 4, border: 'none',
                background: i === bannerIndex ? 'var(--primary)' : 'var(--border)',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{onlineCount || '---'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Online Players</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>12+</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Casino Games</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>100+</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sports Events</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>24/7</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Support</div>
        </div>
      </div>

      {/* Featured Games */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Casino Games</h2>
          <Link to="/casino" style={{ color: 'var(--primary)', fontSize: 14, fontWeight: 600 }}>View All →</Link>
        </div>
        <div className="game-grid">
          {featuredGames.map(game => (
            <Link key={game.name} to={game.path} className="game-card">
              <div className="game-card-image" style={{ background: `linear-gradient(135deg, ${game.color}33, ${game.color}11)` }}>
                <span style={{ fontSize: 56 }}>{game.icon}</span>
              </div>
              <div className="game-card-info">
                <div className="game-card-title">{game.name}</div>
                <div className="game-card-provider" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Osamendi</span>
                  <span style={{ color: 'var(--success)' }}>{game.players} playing</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sports Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Sports Betting</h2>
          <Link to="/sports" style={{ color: 'var(--primary)', fontSize: 14, fontWeight: 600 }}>View All →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {sportCategories.map(sport => (
            <Link key={sport.name} to={`/sports?sport=${sport.name.toLowerCase()}`} className="card" style={{ textAlign: 'center', padding: 20, cursor: 'pointer' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{sport.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{sport.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sport.matches} matches</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Live Bets Feed */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Live Bets</h2>
        <div className="live-feed">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
            <span>Player</span><span>Game</span><span>Bet</span><span style={{ textAlign: 'right' }}>Profit</span>
          </div>
          {(liveBets.length > 0 ? liveBets : [
            { username: 'Player***', game: 'Crash', amount: 500, profit: 1250 },
            { username: 'User***', game: 'Dice', amount: 1000, profit: -1000 },
            { username: 'Bet***', game: 'Slots', amount: 200, profit: 5000 },
            { username: 'Lucky***', game: 'Mines', amount: 300, profit: 900 },
            { username: 'Win***', game: 'Plinko', amount: 100, profit: -100 },
          ]).slice(0, 10).map((bet, i) => (
            <div key={i} className="live-feed-item">
              <span className="username">{bet.username}</span>
              <span className="game-name">{bet.game}</span>
              <span>৳{bet.amount}</span>
              <span className={`amount ${bet.profit >= 0 ? 'win' : 'loss'}`} style={{ textAlign: 'right' }}>
                {bet.profit >= 0 ? '+' : ''}৳{bet.profit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card" style={{ marginBottom: 32, textAlign: 'center', padding: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Payment Methods / পেমেন্ট পদ্ধতি</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ padding: '12px 24px', background: 'var(--bg-input)', borderRadius: 10, fontWeight: 700, color: '#e2136e' }}>bKash</div>
          <div style={{ padding: '12px 24px', background: 'var(--bg-input)', borderRadius: 10, fontWeight: 700, color: '#f6921e' }}>Nagad</div>
          <div style={{ padding: '12px 24px', background: 'var(--bg-input)', borderRadius: 10, fontWeight: 700, color: '#8b288f' }}>Rocket</div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          Instant Deposit & Fast Withdrawal • ৳100 Minimum Deposit
        </p>
      </div>
    </div>
  );
};

export default Home;
