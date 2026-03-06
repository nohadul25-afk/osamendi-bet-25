import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

const Referral = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => { loadReferrals(); }, []);

  const loadReferrals = async () => {
    try {
      const { data } = await userAPI.getReferrals();
      setData(data);
    } catch {}
  };

  const copyLink = () => {
    navigator.clipboard.writeText(data?.referralLink || `${window.location.origin}/register?ref=${user?.referralCode}`);
    toast.success('Referral link copied!');
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Refer & Earn / রেফার করুন</h1>
      <div className="card" style={{ textAlign: 'center', padding: 32, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Earn 5% on Every Referral Deposit</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>প্রতিটি রেফারেলের ডিপোজিটে ৫% কমিশন আয় করুন</p>
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--primary)', borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <code style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>{user?.referralCode}</code>
          <button onClick={copyLink} className="btn btn-primary btn-sm">Copy Link</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{data?.totalReferrals || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Referrals</div>
          </div>
          <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>৳{data?.referralEarnings?.toFixed(0) || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Earnings</div>
          </div>
        </div>
      </div>
      {data?.referrals?.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Your Referrals</h3>
          {data.referrals.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span>{r.username}</span>
              <span style={{ color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Referral;
