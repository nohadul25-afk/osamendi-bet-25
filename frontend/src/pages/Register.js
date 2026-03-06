import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        referralCode: form.referralCode
      });
      toast.success('Account created! Welcome to Osamendi Bet 25!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 16
    }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, background: 'var(--gradient-gold)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 24, color: '#000', margin: '0 auto 16px'
          }}>OB</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>OSAMENDI BET 25</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Create your account & get bonus</p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Username</label>
              <input className="input" name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" required />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Email</label>
              <input className="input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" required />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Phone Number</label>
              <input className="input" name="phone" value={form.phone} onChange={handleChange} placeholder="01XXXXXXXXX" required />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
              <input className="input" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 6 characters" required />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Confirm Password</label>
              <input className="input" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Referral Code (Optional)</label>
              <input className="input" name="referralCode" value={form.referralCode} onChange={handleChange} placeholder="Enter referral code" />
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
