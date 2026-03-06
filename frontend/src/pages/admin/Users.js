import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { loadUsers(); }, [page, search]);

  const loadUsers = async () => {
    try {
      const { data } = await adminAPI.getUsers({ page, search, limit: 20 });
      setUsers(data.users);
      setTotal(data.total);
    } catch {}
  };

  const banUser = async (id, isBanned) => {
    const reason = isBanned ? prompt('Ban reason:') : '';
    try {
      await adminAPI.banUser(id, { isBanned, banReason: reason });
      toast.success(isBanned ? 'User banned' : 'User unbanned');
      loadUsers();
    } catch (error) { toast.error('Failed'); }
  };

  const adjustBalance = async (id) => {
    const amount = parseFloat(prompt('Amount:'));
    const type = prompt('Type (add/subtract):');
    if (!amount || !type) return;
    try {
      await adminAPI.adjustBalance(id, { amount, type, note: 'Admin adjustment' });
      toast.success('Balance adjusted');
      loadUsers();
    } catch (error) { toast.error(error.response?.data?.error || 'Failed'); }
  };

  const changeRole = async (id) => {
    const role = prompt('New role (user/agent/admin):');
    if (!role) return;
    try {
      await adminAPI.setRole(id, { role });
      toast.success('Role updated');
      loadUsers();
    } catch (error) { toast.error('Failed'); }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Users ({total})</h1>
      <input className="input" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by username, email or phone" style={{ marginBottom: 16 }} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['User', 'Phone', 'Balance', 'Role', 'VIP', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 8px', fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{u.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                </td>
                <td style={{ padding: '10px 8px', fontSize: 13 }}>{u.phone}</td>
                <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>৳{u.balance?.toFixed(2)}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span className="badge badge-gold" style={{ cursor: 'pointer' }} onClick={() => changeRole(u._id)}>{u.role}</span>
                </td>
                <td style={{ padding: '10px 8px', fontSize: 13 }}>{u.vipLevel}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span className={`badge ${u.isBanned ? 'badge-red' : 'badge-green'}`}>{u.isBanned ? 'Banned' : 'Active'}</span>
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => adjustBalance(u._id)} className="btn btn-sm btn-secondary">৳</button>
                    <button onClick={() => banUser(u._id, !u.isBanned)} className={`btn btn-sm ${u.isBanned ? 'btn-success' : 'btn-danger'}`}>
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
