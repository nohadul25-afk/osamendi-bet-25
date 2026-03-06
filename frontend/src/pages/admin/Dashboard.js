import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const { data } = await adminAPI.getDashboard();
      setStats(data);
    } catch {}
  };

  const StatCard = ({ label, value, color, sub }) => (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Admin Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Users" value={stats?.users?.total || 0} sub={`+${stats?.users?.today || 0} today`} />
        <StatCard label="Total Deposits" value={`৳${stats?.deposits?.total?.toFixed(0) || 0}`} color="var(--success)" sub={`${stats?.deposits?.pending || 0} pending`} />
        <StatCard label="Total Withdrawals" value={`৳${stats?.withdrawals?.total?.toFixed(0) || 0}`} color="var(--danger)" sub={`${stats?.withdrawals?.pending || 0} pending`} />
        <StatCard label="Game Revenue" value={`৳${stats?.games?.houseProfit?.toFixed(0) || 0}`} color="var(--primary)" sub={`${stats?.games?.totalBets || 0} bets`} />
        <StatCard label="Sports Revenue" value={`৳${stats?.sports?.profit?.toFixed(0) || 0}`} color="var(--accent)" />
        <StatCard label="Net Profit" value={`৳${stats?.netProfit?.toFixed(0) || 0}`} color="var(--success)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Link to="/admin/agent" className="card" style={{ textAlign: 'center', padding: 24, cursor: 'pointer' }}>
          <div style={{ fontSize: 36 }}>💰</div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>Agent Panel</div>
          <div style={{ fontSize: 12, color: 'var(--warning)' }}>{(stats?.deposits?.pending || 0) + (stats?.withdrawals?.pending || 0)} pending</div>
        </Link>
        <Link to="/admin/users" className="card" style={{ textAlign: 'center', padding: 24, cursor: 'pointer' }}>
          <div style={{ fontSize: 36 }}>👥</div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>Manage Users</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stats?.users?.total || 0} total</div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
