import React from 'react';

const Promotions = () => {
  const promos = [
    { title: '100% Welcome Bonus', titleBn: '১০০% স্বাগতম বোনাস', desc: 'Get 100% bonus on your first deposit up to ৳5,000', descBn: 'প্রথম ডিপোজিটে ৳৫,০০০ পর্যন্ত ১০০% বোনাস', color: '#667eea', type: 'welcome' },
    { title: 'Daily Cashback 5%', titleBn: '৫% দৈনিক ক্যাশব্যাক', desc: 'Get 5% cashback on your daily losses', descBn: 'দৈনিক লসে ৫% ক্যাশব্যাক পান', color: '#f5576c', type: 'cashback' },
    { title: 'Refer & Earn', titleBn: 'রেফার করুন ও আয় করুন', desc: 'Earn 5% commission on every referral deposit', descBn: 'প্রতিটি রেফারেলের ডিপোজিটে ৫% কমিশন', color: '#43e97b', type: 'referral' },
    { title: '50% Reload Bonus', titleBn: '৫০% রিলোড বোনাস', desc: 'Every weekend get 50% bonus on deposits', descBn: 'প্রতি উইকেন্ডে ডিপোজিটে ৫০% বোনাস', color: '#4facfe', type: 'reload' },
    { title: 'VIP Exclusive', titleBn: 'ভিআইপি এক্সক্লুসিভ', desc: 'Special rewards for VIP members', descBn: 'ভিআইপি সদস্যদের জন্য বিশেষ পুরস্কার', color: '#f093fb', type: 'vip' },
    { title: 'Lucky Spin Daily', titleBn: 'দৈনিক লাকি স্পিন', desc: 'Spin the wheel daily for free rewards', descBn: 'দৈনিক ফ্রি রিওয়ার্ডের জন্য চাকা ঘোরান', color: '#fda085', type: 'daily' },
  ];

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Promotions / প্রমোশন</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {promos.map((p, i) => (
          <div key={i} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ height: 120, background: `linear-gradient(135deg, ${p.color}, ${p.color}88)`, borderRadius: '10px 10px 0 0', margin: '-20px -20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', textAlign: 'center' }}>{p.title}</h2>
            </div>
            <div style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>{p.titleBn}</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{p.desc}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.descBn}</p>
            <button className="btn btn-primary btn-full" style={{ marginTop: 16 }}>Claim Now</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Promotions;
