import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { load(); }, [page, type, status]);

  const load = async () => {
    try {
      const { data } = await adminAPI.getTransactions({ page, type: type || undefined, status: status || undefined, limit: 30 });
      setTransactions(data.transactions);
    } catch {}
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Transactions</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select className="input" style={{ width: 150 }} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="withdraw">Withdraw</option>
          <option value="bet">Bet</option>
          <option value="win">Win</option>
        </select>
        <select className="input" style={{ width: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Reference', 'User', 'Type', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t._id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px', fontSize: 11, fontFamily: 'monospace' }}>{t.reference}</td>
                <td style={{ padding: '8px', fontSize: 13 }}>{t.user?.username}</td>
                <td style={{ padding: '8px' }}><span className="badge badge-gold" style={{ textTransform: 'capitalize' }}>{t.type}</span></td>
                <td style={{ padding: '8px', fontWeight: 700, color: ['deposit', 'win', 'bonus'].includes(t.type) ? 'var(--success)' : 'var(--danger)' }}>
                  ৳{t.amount}
                </td>
                <td style={{ padding: '8px', fontSize: 12, textTransform: 'uppercase' }}>{t.paymentMethod}</td>
                <td style={{ padding: '8px' }}>
                  <span className={`badge ${t.status === 'approved' || t.status === 'completed' ? 'badge-green' : t.status === 'pending' ? 'badge-gold' : 'badge-red'}`}>{t.status}</span>
                </td>
                <td style={{ padding: '8px', fontSize: 11, color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-secondary btn-sm" disabled={page === 1}>Previous</button>
        <span style={{ padding: '6px 12px', fontSize: 13 }}>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm">Next</button>
      </div>
    </div>
  );
};

export default Transactions;
