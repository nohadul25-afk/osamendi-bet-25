import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await userAPI.getStats();
      setStats(data);
    } catch {}
  };

  const vipNames = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Crown', 'Royal', 'Legend'];

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Profile / প্রোফাইল</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {/* User Info */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#000', margin: '0 auto 16px' }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{user?.username}</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.phone}</div>
          <div className="badge badge-gold" style={{ marginTop: 8 }}>VIP {user?.vipLevel} - {vipNames[user?.vipLevel || 0]}</div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Link to="/wallet" className="btn btn-primary" style={{ flex: 1 }}>Wallet</Link>
            <Link to="/referral" className="btn btn-secondary" style={{ flex: 1 }}>Referral</Link>
          </div>
          <button onClick={logout} className="btn btn-danger btn-full" style={{ marginTop: 8 }}>Logout</button>
        </div>

        {/* Stats */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Deposit</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>৳{stats?.totalDeposit?.toFixed(0) || 0}</div>
            </div>
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Withdraw</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>৳{stats?.totalWithdraw?.toFixed(0) || 0}</div>
            </div>
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Bet</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>৳{stats?.totalBet?.toFixed(0) || 0}</div>
            </div>
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Win</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>৳{stats?.totalWin?.toFixed(0) || 0}</div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Links</h3>
          <Link to="/vip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
            <span>VIP Program</span><span>→</span>
          </Link>
          <Link to="/referral" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
            <span>Referral Program</span><span>→</span>
          </Link>
          <Link to="/wallet" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
            <span>Transaction History</span><span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
