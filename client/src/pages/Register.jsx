import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shirt, User, Store, Mail, Lock, Phone, MapPin, Clock, Truck } from 'lucide-react';

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'partner' ? 'partner' : 'customer';

  const [role, setRole] = useState(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('Nasarawa');
  const [address, setAddress] = useState('');

  // Partner specific fields
  const [businessName, setBusinessName] = useState('');
  const [turnaroundDays, setTurnaroundDays] = useState('2');
  const [offersPickup, setOffersPickup] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState('1000');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const kanoAreas = [
    'Nasarawa',
    'Sabon Gari',
    'Bompai',
    'Tarauni',
    'Fagge',
    'Kano Municipal',
    'Dala',
    'Gwale',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        role,
        fullName,
        email,
        password,
        phone,
        area,
        address,
        ...(role === 'partner' && {
          businessName,
          turnaroundDays: parseInt(turnaroundDays) || 2,
          offersPickup,
          deliveryFee: parseFloat(deliveryFee) || 1000,
        }),
      };

      const user = await register(payload);
      if (user.role === 'customer') navigate('/customer');
      else if (user.role === 'partner') navigate('/partner');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '3.5rem 1rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '580px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'var(--primary)',
            color: 'white',
            width: 48,
            height: 48,
            borderRadius: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
          }}>
            <Shirt size={28} />
          </div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.4rem' }}>Create Platform Account</h1>
          <p style={{ color: 'var(--text-muted)' }}>Join Kano's premier fabric care marketplace</p>
        </div>

        {/* Role Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          background: 'var(--bg-muted)',
          padding: '0.4rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.75rem'
        }}>
          <button
            type="button"
            onClick={() => setRole('customer')}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: role === 'customer' ? 'white' : 'transparent',
              color: role === 'customer' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: role === 'customer' ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)'
            }}
          >
            <User size={18} /> Customer (Book Laundry)
          </button>

          <button
            type="button"
            onClick={() => setRole('partner')}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: role === 'partner' ? 'white' : 'transparent',
              color: role === 'partner' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: role === 'partner' ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)'
            }}
          >
            <Store size={18} /> Laundry Partner (Shop Owner)
          </button>
        </div>

        {/* Form Card */}
        <div className="card" style={{ padding: '2rem' }}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{role === 'partner' ? 'Owner / Manager Name' : 'Full Name'}</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Ibrahim Mukhtar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {role === 'partner' && (
              <div className="form-group">
                <label className="form-label">Laundry Business Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Royal Cleaners & Steamers"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="name@example.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  placeholder="e.g. 0803 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Kano Area</label>
                <select
                  className="form-select"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                >
                  {kanoAreas.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{role === 'partner' ? 'Shop Street Address' : 'Default Delivery Address'}</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Street and Landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Extra fields for Laundry Partner */}
            {role === 'partner' && (
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', margin: '1rem 0 1.5rem', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--primary-dark)' }}>
                  Shop Operational Settings
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Turnaround Time (Days)</label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      required
                      className="form-input"
                      value={turnaroundDays}
                      onChange={(e) => setTurnaroundDays(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Pickup & Delivery Fee (₦)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      required
                      className="form-input"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={offersPickup}
                      onChange={(e) => setOffersPickup(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                    />
                    Enable Customer Doorstep Pickup & Delivery
                  </label>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Creating Account...' : role === 'partner' ? 'Register Partner Laundry' : 'Complete Registration'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 700 }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
