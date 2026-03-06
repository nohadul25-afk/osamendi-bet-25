import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Casino = () => {
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const games = [
    // Originals
    { name: 'Crash', icon: '📈', path: '/games/crash', category: 'originals', hot: true },
    { name: 'Aviator', icon: '✈️', path: '/games/aviator', category: 'originals', hot: true, new: true },
    { name: 'Dice', icon: '🎲', path: '/games/dice', category: 'originals' },
    { name: 'Mines', icon: '💣', path: '/games/mines', category: 'originals', hot: true },
    { name: 'Plinko', icon: '⚪', path: '/games/plinko', category: 'originals' },
    { name: 'Tower', icon: '🏗️', path: '/games/tower', category: 'originals', new: true },
    { name: 'Wheel of Fortune', icon: '🎯', path: '/games/wheel', category: 'originals' },
    { name: 'Coin Flip', icon: '🪙', path: '/games/coinflip', category: 'originals' },
    { name: 'Limbo', icon: '🚀', path: '/games/limbo', category: 'originals' },
    { name: 'Color Game', icon: '🎨', path: '/games/color-game', category: 'originals', new: true },
    // Table
    { name: 'Roulette', icon: '🎡', path: '/games/roulette', category: 'table' },
    { name: 'Blackjack', icon: '🃏', path: '/games/blackjack', category: 'table', hot: true },
    { name: 'Baccarat', icon: '🂡', path: '/games/baccarat', category: 'table', hot: true, new: true },
    { name: 'Dragon Tiger', icon: '🐉', path: '/games/dragon-tiger', category: 'table', new: true },
    { name: 'Teen Patti', icon: '🃏', path: '/games/teen-patti', category: 'table', hot: true, new: true },
    { name: 'Andar Bahar', icon: '🎴', path: '/games/andar-bahar', category: 'table', new: true },
    { name: 'Hi-Lo', icon: '↕️', path: '/games/hilo', category: 'table' },
    { name: 'Video Poker', icon: '🂠', path: '/games/video-poker', category: 'table', new: true },
    // Lottery
    { name: 'Keno', icon: '🔢', path: '/games/keno', category: 'lottery' },
    { name: 'Scratch Card', icon: '🎟️', path: '/games/scratch-card', category: 'lottery', new: true },
    // Slots
    { name: 'Classic Slots', icon: '🎰', path: '/games/slots', category: 'slots', hot: true },
    { name: 'Golden Dragon', icon: '🐉', path: '/slots/golden-dragon', category: 'slots', hot: true, provider: 'OB Slots' },
    { name: 'Fortune Tiger', icon: '🐯', path: '/slots/fortune-tiger', category: 'slots', hot: true, provider: 'OB Slots' },
    { name: 'Lucky Neko', icon: '🐱', path: '/slots/lucky-neko', category: 'slots', provider: 'OB Slots' },
    { name: 'Money Coming', icon: '💸', path: '/slots/money-coming', category: 'slots', provider: 'OB Slots' },
    { name: 'Treasure Hunt', icon: '🏴‍☠️', path: '/slots/treasure-hunt', category: 'slots', provider: 'OB Slots' },
    { name: 'Wild West', icon: '🤠', path: '/slots/wild-west', category: 'slots', provider: 'OB Slots' },
    { name: 'Pharaoh Gold', icon: '🏛️', path: '/slots/pharaoh-gold', category: 'slots', provider: 'OB Slots' },
    { name: 'Diamond Rush', icon: '💎', path: '/slots/diamond-rush', category: 'slots', provider: 'OB Slots' },
    { name: 'Fruit Party', icon: '🍓', path: '/slots/fruit-party', category: 'slots', provider: 'OB Slots' },
    { name: 'Mega Jackpot', icon: '🎰', path: '/slots/mega-jackpot', category: 'slots', hot: true, provider: 'OB Slots' },
    { name: 'Book of Ra', icon: '📜', path: '/slots/book-of-ra', category: 'slots', provider: 'OB Slots' },
    { name: 'Sweet Bonanza', icon: '🍬', path: '/slots/sweet-bonanza', category: 'slots', hot: true, provider: 'OB Slots' },
    { name: 'Gates of Olympus', icon: '⚡', path: '/slots/gates-of-olympus', category: 'slots', hot: true, provider: 'OB Slots' },
    { name: 'Starlight Princess', icon: '👸', path: '/slots/starlight-princess', category: 'slots', provider: 'OB Slots' },
    { name: 'Sugar Rush', icon: '🍫', path: '/slots/sugar-rush', category: 'slots', provider: 'OB Slots' },
    { name: 'Big Bass', icon: '🐟', path: '/slots/big-bass', category: 'slots', provider: 'OB Slots' },
    { name: 'Hot Fiesta', icon: '🌶️', path: '/slots/hot-fiesta', category: 'slots', provider: 'OB Slots' },
    { name: 'Zeus', icon: '⚡', path: '/slots/zeus', category: 'slots', provider: 'OB Slots' },
    { name: 'Buffalo King', icon: '🦬', path: '/slots/buffalo-king', category: 'slots', provider: 'OB Slots' },
    { name: 'Wolf Gold', icon: '🐺', path: '/slots/wolf-gold', category: 'slots', provider: 'OB Slots' },
  ];

  const categories = [
    { id: 'all', label: 'All Games', icon: '🎮', count: games.length },
    { id: 'originals', label: 'Originals', icon: '⭐' },
    { id: 'slots', label: 'Slots', icon: '🎰' },
    { id: 'table', label: 'Table Games', icon: '🃏' },
    { id: 'lottery', label: 'Lottery', icon: '🔢' },
    { id: 'hot', label: 'Hot', icon: '🔥' },
    { id: 'new', label: 'New', icon: '✨' },
  ];

  let filtered = games;
  if (category === 'hot') filtered = games.filter(g => g.hot);
  else if (category === 'new') filtered = games.filter(g => g.new);
  else if (category !== 'all') filtered = games.filter(g => g.category === category);

  if (searchQuery) {
    filtered = filtered.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, background: 'linear-gradient(135deg, var(--primary), #e8930c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Casino / ক্যাসিনো
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} games</span>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="input"
          type="text"
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 300 }}
        />
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
            padding: '10px 20px', borderRadius: 10, whiteSpace: 'nowrap',
            background: category === cat.id ? 'var(--primary)' : 'var(--bg-card)',
            color: category === cat.id ? '#000' : 'var(--text-secondary)',
            border: `1px solid ${category === cat.id ? 'var(--primary)' : 'var(--border)'}`,
            fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.3s ease', transform: category === cat.id ? 'scale(1.05)' : 'scale(1)'
          }}>
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="game-grid">
        {filtered.map(game => (
          <Link key={game.path} to={game.path} className="game-card" style={{ position: 'relative' }}>
            {game.hot && (
              <div style={{
                position: 'absolute', top: 8, right: 8, background: 'var(--danger)',
                color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 10,
                fontWeight: 700, zIndex: 1, animation: 'pulse 2s infinite'
              }}>HOT</div>
            )}
            {game.new && !game.hot && (
              <div style={{
                position: 'absolute', top: 8, right: 8, background: 'var(--success)',
                color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 10,
                fontWeight: 700, zIndex: 1
              }}>NEW</div>
            )}
            <div className="game-card-image" style={{ background: 'var(--bg-card)' }}>
              <span style={{ fontSize: 56, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>{game.icon}</span>
            </div>
            <div className="game-card-info">
              <div className="game-card-title">{game.name}</div>
              <div className="game-card-provider">{game.provider || 'Osamendi Originals'}</div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No games found</div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
      `}</style>
    </div>
  );
};

export default Casino;
