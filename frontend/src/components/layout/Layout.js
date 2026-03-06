import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [slotsExpanded, setSlotsExpanded] = useState(false);
  const { user, logout } = useAuth();
  const { onlineCount } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', label: 'Home', labelBn: 'হোম', icon: '🏠' },
    { path: '/casino', label: 'Casino', labelBn: 'ক্যাসিনো', icon: '🎰' },
    { path: '/sports', label: 'Sports', labelBn: 'স্পোর্টস', icon: '⚽' },
    { path: '/promotions', label: 'Promotions', labelBn: 'প্রমোশন', icon: '🎁' },
  ];

  const gameItems = [
    { path: '/games/crash', label: 'Crash', icon: '📈' },
    { path: '/games/aviator', label: 'Aviator', icon: '✈️', hot: true },
    { path: '/games/slots', label: 'Slots', icon: '🎰' },
    { path: '/games/dice', label: 'Dice', icon: '🎲' },
    { path: '/games/mines', label: 'Mines', icon: '💣' },
    { path: '/games/plinko', label: 'Plinko', icon: '⚪' },
    { path: '/games/roulette', label: 'Roulette', icon: '🎡' },
    { path: '/games/blackjack', label: 'Blackjack', icon: '🃏' },
    { path: '/games/baccarat', label: 'Baccarat', icon: '🂡' },
    { path: '/games/dragon-tiger', label: 'Dragon Tiger', icon: '🐉' },
    { path: '/games/teen-patti', label: 'Teen Patti', icon: '🃏', hot: true },
    { path: '/games/andar-bahar', label: 'Andar Bahar', icon: '🎴' },
    { path: '/games/tower', label: 'Tower', icon: '🏗️' },
    { path: '/games/wheel', label: 'Wheel', icon: '🎯' },
    { path: '/games/coinflip', label: 'Coin Flip', icon: '🪙' },
    { path: '/games/limbo', label: 'Limbo', icon: '🚀' },
    { path: '/games/keno', label: 'Keno', icon: '🔢' },
    { path: '/games/hilo', label: 'Hi-Lo', icon: '↕️' },
    { path: '/games/color-game', label: 'Color Game', icon: '🎨' },
    { path: '/games/video-poker', label: 'Video Poker', icon: '🂠' },
    { path: '/games/scratch-card', label: 'Scratch Card', icon: '🎟️' },
  ];

  const themedSlots = [
    { id: 'golden-dragon', label: 'Golden Dragon', icon: '🐉', hot: true },
    { id: 'fortune-tiger', label: 'Fortune Tiger', icon: '🐯', hot: true },
    { id: 'lucky-neko', label: 'Lucky Neko', icon: '🐱' },
    { id: 'money-coming', label: 'Money Coming', icon: '💸' },
    { id: 'treasure-hunt', label: 'Treasure Hunt', icon: '🏴‍☠️' },
    { id: 'wild-west', label: 'Wild West', icon: '🤠' },
    { id: 'pharaoh-gold', label: 'Pharaoh Gold', icon: '🏛️' },
    { id: 'diamond-rush', label: 'Diamond Rush', icon: '💎' },
    { id: 'fruit-party', label: 'Fruit Party', icon: '🍓' },
    { id: 'mega-jackpot', label: 'Mega Jackpot', icon: '🎰', hot: true },
    { id: 'book-of-ra', label: 'Book of Ra', icon: '📜' },
    { id: 'sweet-bonanza', label: 'Sweet Bonanza', icon: '🍬', hot: true },
    { id: 'gates-of-olympus', label: 'Gates of Olympus', icon: '⚡', hot: true },
    { id: 'starlight-princess', label: 'Starlight Princess', icon: '👸' },
    { id: 'sugar-rush', label: 'Sugar Rush', icon: '🍫' },
    { id: 'big-bass', label: 'Big Bass', icon: '🐟' },
    { id: 'hot-fiesta', label: 'Hot Fiesta', icon: '🌶️' },
    { id: 'zeus', label: 'Zeus', icon: '⚡' },
    { id: 'buffalo-king', label: 'Buffalo King', icon: '🦬' },
    { id: 'wolf-gold', label: 'Wolf Gold', icon: '🐺' },
  ];

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path, small) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: small ? '6px 12px' : '8px 12px',
    borderRadius: 8, marginBottom: 2, fontSize: small ? 12 : 13, fontWeight: 500,
    background: isActive(path) ? 'rgba(245, 166, 35, 0.1)' : 'transparent',
    color: isActive(path) ? 'var(--primary)' : 'var(--text-secondary)',
    transition: 'all 0.2s'
  });

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, background: 'var(--gradient-gold)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 16, color: '#000'
            }}>OB</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>OSAMENDI</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 2 }}>BET 25</div>
            </div>
          </Link>
        </div>

        <nav style={{ padding: '12px 8px', overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '0 8px', marginBottom: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Menu
          </div>
          {menuItems.map(item => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} style={linkStyle(item.path)}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div style={{ padding: '12px 8px 8px', marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, borderTop: '1px solid var(--border)' }}>
            Games ({gameItems.length})
          </div>
          {gameItems.map(item => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} style={linkStyle(item.path)}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
              {item.hot && <span style={{ fontSize: 9, background: 'var(--danger)', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 700, marginLeft: 'auto' }}>HOT</span>}
            </Link>
          ))}

          {/* Themed Slots */}
          <button onClick={() => setSlotsExpanded(!slotsExpanded)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '10px 12px 8px', marginTop: 8, fontSize: 11, color: 'var(--primary)',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
            borderTop: '1px solid var(--border)', background: 'none', textAlign: 'left'
          }}>
            🎰 Slot Games ({themedSlots.length})
            <span style={{ marginLeft: 'auto', fontSize: 10, transition: 'transform 0.3s', transform: slotsExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
          </button>
          <div style={{ maxHeight: slotsExpanded ? 800 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease' }}>
            {themedSlots.map(slot => (
              <Link key={slot.id} to={`/slots/${slot.id}`} onClick={() => setSidebarOpen(false)}
                style={linkStyle(`/slots/${slot.id}`, true)}>
                <span style={{ fontSize: 13 }}>{slot.icon}</span>
                {slot.label}
                {slot.hot && <span style={{ fontSize: 9, background: 'var(--danger)', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 700, marginLeft: 'auto' }}>HOT</span>}
              </Link>
            ))}
          </div>

          {user && ['admin', 'superadmin', 'agent'].includes(user.role) && (
            <>
              <div style={{ padding: '12px 8px 8px', marginTop: 8, fontSize: 11, color: 'var(--danger)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, borderTop: '1px solid var(--border)' }}>
                Admin
              </div>
              <Link to="/admin" onClick={() => setSidebarOpen(false)} style={linkStyle('/admin')}>
                📊 Dashboard
              </Link>
              <Link to="/admin/users" onClick={() => setSidebarOpen(false)} style={linkStyle('/admin/users')}>
                👥 Users
              </Link>
              <Link to="/admin/agent" onClick={() => setSidebarOpen(false)} style={linkStyle('/admin/agent')}>
                💰 Agent Panel
              </Link>
              <Link to="/admin/transactions" onClick={() => setSidebarOpen(false)} style={linkStyle('/admin/transactions')}>
                📋 Transactions
              </Link>
            </>
          )}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)' }}>
            <span style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            {onlineCount} Online
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Main */}
      <div className="main-content">
        {/* Top Bar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', color: 'var(--text-primary)', fontSize: 24, display: 'none' }}
              className="mobile-menu-btn"
            >
              ☰
            </button>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>OSAMENDI BET 25</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>
                    ৳{user.balance?.toFixed(2) || '0.00'}
                  </span>
                  <button
                    onClick={() => navigate('/wallet')}
                    style={{
                      background: 'var(--primary)', color: '#000', borderRadius: 6,
                      padding: '4px 8px', fontSize: 12, fontWeight: 700
                    }}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '6px 12px', color: 'var(--text-primary)',
                    fontSize: 13, fontWeight: 500
                  }}
                >
                  {user.username}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="btn btn-secondary btn-sm">Login</button>
                <button onClick={() => navigate('/register')} className="btn btn-primary btn-sm">Sign Up</button>
              </>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="bottom-nav">
        <button className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <span>Home</span>
        </button>
        <button className={`bottom-nav-item ${isActive('/casino') ? 'active' : ''}`} onClick={() => navigate('/casino')}>
          <span style={{ fontSize: 20 }}>🎰</span>
          <span>Casino</span>
        </button>
        <button className={`bottom-nav-item ${location.pathname === '/wallet' ? 'active' : ''}`} onClick={() => navigate(user ? '/wallet' : '/login')}
          style={{ position: 'relative' }}>
          <div style={{
            width: 48, height: 48, background: 'var(--gradient-gold)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'absolute', top: -20, boxShadow: 'var(--shadow-gold)'
          }}>
            <span style={{ fontSize: 22 }}>💰</span>
          </div>
          <span style={{ marginTop: 28 }}>Wallet</span>
        </button>
        <button className={`bottom-nav-item ${isActive('/sports') ? 'active' : ''}`} onClick={() => navigate('/sports')}>
          <span style={{ fontSize: 20 }}>⚽</span>
          <span>Sports</span>
        </button>
        <button className={`bottom-nav-item ${isActive('/profile') ? 'active' : ''}`} onClick={() => navigate(user ? '/profile' : '/login')}>
          <span style={{ fontSize: 20 }}>👤</span>
          <span>Profile</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
        }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
};

export default Layout;
