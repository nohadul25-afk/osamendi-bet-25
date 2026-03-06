import React, { useState, useEffect } from 'react';
import { walletAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Agent = () => {
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [tab, setTab] = useState('deposits');

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    try {
      const { data } = await walletAPI.getPending();
      setDeposits(data.deposits);
      setWithdrawals(data.withdrawals);
    } catch {}
  };

  const processDeposit = async (id, action) => {
    try {
      const note = action === 'reject' ? prompt('Rejection reason:') : '';
      await walletAPI.approveDeposit(id, { action, note });
      toast.success(`Deposit ${action}d`);
      loadPending();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const processWithdraw = async (id, action) => {
    try {
      const note = action === 'reject' ? prompt('Rejection reason:') : '';
      await walletAPI.approveWithdraw(id, { action, note });
      toast.success(`Withdrawal ${action}d`);
      loadPending();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Agent Panel / এজেন্ট প্যানেল</h1>

      <div className="tabs">
        <button className={`tab ${tab === 'deposits' ? 'active' : ''}`} onClick={() => setTab('deposits')}>
          Deposits ({deposits.length})
        </button>
        <button className={`tab ${tab === 'withdrawals' ? 'active' : ''}`} onClick={() => setTab('withdrawals')}>
          Withdrawals ({withdrawals.length})
        </button>
      </div>

      {tab === 'deposits' && (
        <div>
          {deposits.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No pending deposits</div>}
          {deposits.map(dep => (
            <div key={dep._id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700 }}>{dep.user?.username}</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>৳{dep.amount}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Method: <b>{dep.paymentMethod}</b></div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Sender: <b>{dep.senderNumber}</b></div>
              <div style={{ fontSize: 13, color: 'var(--primary)', marginBottom: 4 }}>TrxID: <b>{dep.transactionId}</b></div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Agent #: {dep.agentNumber}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{new Date(dep.createdAt).toLocaleString()}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => processDeposit(dep._id, 'approve')} className="btn btn-success" style={{ flex: 1 }}>Approve</button>
                <button onClick={() => processDeposit(dep._id, 'reject')} className="btn btn-danger" style={{ flex: 1 }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'withdrawals' && (
        <div>
          {withdrawals.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No pending withdrawals</div>}
          {withdrawals.map(wth => (
            <div key={wth._id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700 }}>{wth.user?.username}</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--danger)' }}>৳{wth.amount}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Method: <b>{wth.paymentMethod}</b></div>
              <div style={{ fontSize: 13, color: 'var(--primary)', marginBottom: 4 }}>Send to: <b>{wth.withdrawNumber}</b></div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Name: {wth.withdrawAccountName || 'N/A'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{new Date(wth.createdAt).toLocaleString()}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => processWithdraw(wth._id, 'approve')} className="btn btn-success" style={{ flex: 1 }}>Mark Sent</button>
                <button onClick={() => processWithdraw(wth._id, 'reject')} className="btn btn-danger" style={{ flex: 1 }}>Reject (Refund)</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Agent;
