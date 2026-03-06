import React from 'react';
import { useAuth } from '../context/AuthContext';

const VIP = () => {
  const { user } = useAuth();
  const levels = [
    { level: 0, name: 'Bronze', color: '#cd7f32', points: 0, cashback: '0%', bonus: '৳0' },
    { level: 1, name: 'Silver', color: '#c0c0c0', points: 1000, cashback: '0.5%', bonus: '৳100' },
    { level: 2, name: 'Gold', color: '#ffd700', points: 5000, cashback: '1%', bonus: '৳500' },
    { level: 3, name: 'Platinum', color: '#e5e4e2', points: 15000, cashback: '1.5%', bonus: '৳1,500' },
    { level: 4, name: 'Diamond', color: '#b9f2ff', points: 50000, cashback: '2%', bonus: '৳5,000' },
    { level: 5, name: 'Ruby', color: '#e0115f', points: 150000, cashback: '2.5%', bonus: '৳15,000' },
    { level: 6, name: 'Emerald', color: '#50c878', points: 500000, cashback: '3%', bonus: '৳50,000' },
    { level: 7, name: 'Sapphire', color: '#0f52ba', points: 1500000, cashback: '3.5%', bonus: '৳100,000' },
    { level: 8, name: 'Crown', color: '#ffd700', points: 5000000, cashback: '4%', bonus: '৳300,000' },
    { level: 9, name: 'Royal', color: '#800080', points: 15000000, cashback: '4.5%', bonus: '৳500,000' },
    { level: 10, name: 'Legend', color: '#ff4500', points: 50000000, cashback: '5%', bonus: '৳1,000,000' },
  ];

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>VIP Program / ভিআইপি প্রোগ্রাম</h1>
      <div className="card" style={{ marginBottom: 24, textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Your VIP Level</div>
        <div style={{ fontSize: 48, fontWeight: 900, color: levels[user?.vipLevel || 0]?.color }}>{levels[user?.vipLevel || 0]?.name}</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Points: {user?.vipPoints || 0} | Earn 1 point per ৳100 bet</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
        {levels.map(l => (
          <div key={l.level} className="card" style={{ border: user?.vipLevel === l.level ? `2px solid ${l.color}` : undefined, opacity: l.level <= (user?.vipLevel || 0) ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: l.color }}>{l.name}</span>
              <span className="badge badge-gold">Lv.{l.level}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Required: {l.points.toLocaleString()} points</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cashback: {l.cashback}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Level Up Bonus: {l.bonus}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VIP;
