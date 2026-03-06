import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { walletAPI } from '../services/api';
import toast from 'react-hot-toast';

const Wallet = () => {
  const { user, updateBalance } = useAuth();
  const [tab, setTab] = useState('deposit');
  const [methods, setMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Deposit form
  const [depositForm, setDepositForm] = useState({
    amount: '', paymentMethod: 'bkash', senderNumber: '', transactionId: ''
  });

  // Withdraw form
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '', paymentMethod: 'bkash', withdrawNumber: '', withdrawAccountName: ''
  });

  useEffect(() => {
    loadPaymentMethods();
    loadTransactions();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const { data } = await walletAPI.getPaymentMethods();
      setMethods(data.methods);
    } catch (error) {
      console.error('Failed to load payment methods');
    }
  };

  const loadTransactions = async () => {
    try {
      const { data } = await walletAPI.getTransactions({ limit: 20 });
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Failed to load transactions');
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await walletAPI.deposit(depositForm);
      toast.success(data.message);
      setDepositForm({ amount: '', paymentMethod: 'bkash', senderNumber: '', transactionId: '' });
      loadTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await walletAPI.withdraw(withdrawForm);
      toast.success(data.message);
      setWithdrawForm({ amount: '', paymentMethod: 'bkash', withdrawNumber: '', withdrawAccountName: '' });
      updateBalance();
      loadTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = methods.find(m => m.id === (tab === 'deposit' ? depositForm.paymentMethod : withdrawForm.paymentMethod));

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': case 'completed': return 'var(--success)';
      case 'pending': return 'var(--warning)';
      case 'rejected': case 'cancelled': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Wallet / ওয়ালেট</h1>

      {/* Balance Card */}
      <div className="card" style={{
        background: 'var(--gradient-gold)', padding: 24, marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>Main Balance / মূল ব্যালেন্স</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#000' }}>৳{user?.balance?.toFixed(2) || '0.00'}</div>
        </div>
        {user?.bonusBalance > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>Bonus Balance</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#000' }}>৳{user?.bonusBalance?.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'deposit' ? 'active' : ''}`} onClick={() => setTab('deposit')}>Deposit / ডিপোজিট</button>
        <button className={`tab ${tab === 'withdraw' ? 'active' : ''}`} onClick={() => setTab('withdraw')}>Withdraw / উত্তোলন</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History / ইতিহাস</button>
      </div>

      {/* Deposit Tab */}
      {tab === 'deposit' && (
        <div className="card">
          {/* Payment Method Selection */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {methods.map(m => (
              <button
                key={m.id}
                onClick={() => setDepositForm({ ...depositForm, paymentMethod: m.id })}
                style={{
                  flex: 1, padding: '12px 8px', borderRadius: 10, border: '2px solid',
                  borderColor: depositForm.paymentMethod === m.id ? 'var(--primary)' : 'var(--border)',
                  background: depositForm.paymentMethod === m.id ? 'rgba(245,166,35,0.1)' : 'var(--bg-input)',
                  color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, textAlign: 'center'
                }}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* Agent Number Display */}
          {selectedMethod && (
            <div style={{
              background: 'rgba(245,166,35,0.1)', border: '1px solid var(--primary)',
              borderRadius: 10, padding: 16, marginBottom: 20, textAlign: 'center'
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Send Money to this {selectedMethod.name} Number:
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', letterSpacing: 2 }}>
                {selectedMethod.agentNumber}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                {selectedMethod.instructionsBn}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Min: ৳{selectedMethod.minDeposit} | Max: ৳{selectedMethod.maxDeposit}
              </div>
            </div>
          )}

          <form onSubmit={handleDeposit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Amount (৳) / পরিমাণ
              </label>
              <input className="input" type="number" value={depositForm.amount}
                onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                placeholder="Enter amount" min="100" required />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {[100, 500, 1000, 2000, 5000].map(amt => (
                  <button key={amt} type="button"
                    onClick={() => setDepositForm({ ...depositForm, amount: amt.toString() })}
                    style={{
                      flex: 1, padding: '6px', background: 'var(--bg-input)', border: '1px solid var(--border)',
                      borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600
                    }}>
                    ৳{amt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Your {selectedMethod?.name} Number / আপনার নম্বর
              </label>
              <input className="input" value={depositForm.senderNumber}
                onChange={(e) => setDepositForm({ ...depositForm, senderNumber: e.target.value })}
                placeholder="01XXXXXXXXX" required />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Transaction ID / ট্রানজেকশন আইডি
              </label>
              <input className="input" value={depositForm.transactionId}
                onChange={(e) => setDepositForm({ ...depositForm, transactionId: e.target.value })}
                placeholder="Enter the TrxID from your SMS" required />
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Deposit Request / ডিপোজিট জমা দিন'}
            </button>
          </form>
        </div>
      )}

      {/* Withdraw Tab */}
      {tab === 'withdraw' && (
        <div className="card">
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {['bkash', 'nagad', 'rocket'].map(m => (
              <button key={m} onClick={() => setWithdrawForm({ ...withdrawForm, paymentMethod: m })}
                style={{
                  flex: 1, padding: '12px 8px', borderRadius: 10, border: '2px solid',
                  borderColor: withdrawForm.paymentMethod === m ? 'var(--primary)' : 'var(--border)',
                  background: withdrawForm.paymentMethod === m ? 'rgba(245,166,35,0.1)' : 'var(--bg-input)',
                  color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, textAlign: 'center',
                  textTransform: 'capitalize'
                }}>
                {m === 'bkash' ? 'bKash' : m === 'nagad' ? 'Nagad' : 'Rocket'}
              </button>
            ))}
          </div>

          <form onSubmit={handleWithdraw}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Amount (৳) / পরিমাণ
              </label>
              <input className="input" type="number" value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                placeholder="Minimum ৳500" min="500" required />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Account Number / একাউন্ট নম্বর
              </label>
              <input className="input" value={withdrawForm.withdrawNumber}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, withdrawNumber: e.target.value })}
                placeholder="01XXXXXXXXX" required />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Account Name / একাউন্টের নাম
              </label>
              <input className="input" value={withdrawForm.withdrawAccountName}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, withdrawAccountName: e.target.value })}
                placeholder="Your name as on account" />
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? 'Processing...' : 'Request Withdrawal / উত্তোলন রিকোয়েস্ট'}
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {transactions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No transactions yet
            </div>
          ) : (
            transactions.map(txn => (
              <div key={txn._id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderBottom: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{txn.type}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {txn.paymentMethod?.toUpperCase()} • {new Date(txn.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{txn.reference}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontWeight: 700, fontSize: 14,
                    color: ['deposit', 'win', 'bonus', 'referral'].includes(txn.type) ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {['deposit', 'win', 'bonus', 'referral'].includes(txn.type) ? '+' : '-'}৳{txn.amount}
                  </div>
                  <span className={`badge ${txn.status === 'approved' || txn.status === 'completed' ? 'badge-green' : txn.status === 'pending' ? 'badge-gold' : 'badge-red'}`}>
                    {txn.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Wallet;
