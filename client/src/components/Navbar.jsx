import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shirt, Menu, X, PlusCircle, LayoutDashboard, Store, Shield, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header style={{ background: 'white', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{
            background: 'var(--primary)',
            color: 'white',
            width: 38,
            height: 38,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
          }}>
            <Shirt size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Kano<span style={{ color: 'var(--primary)' }}>Laundry</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Marketplace • Kano, Nigeria
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="desktop-nav">
          <Link to="/browse" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            Browse Laundries
          </Link>
          <Link to="/how-it-works" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            How It Works
          </Link>

          {user?.role === 'customer' && (
            <>
              <Link to="/customer" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                My Dashboard
              </Link>
              <Link to="/customer/orders" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                Order History
              </Link>
              <Link to="/customer/book" className="btn btn-primary btn-sm">
                <PlusCircle size={15} /> Book Pickup
              </Link>
            </>
          )}

          {user?.role === 'partner' && (
            <>
              <Link to="/partner" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                <Store size={15} style={{ display: 'inline', marginRight: 4 }} />
                Partner Dashboard
              </Link>
              <Link to="/partner/services" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                Services & Prices
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link to="/admin" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                <Shield size={15} style={{ display: 'inline', marginRight: 4 }} />
                Admin Overview
              </Link>
              <Link to="/admin/commissions" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                Commission Reports
              </Link>
            </>
          )}

          {!user ? (
            <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {user.fullName || user.email.split('@')[0]}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {user.role}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm" title="Sign out" style={{ padding: '0.4rem' }}>
                <LogOut size={16} />
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none' }}
          className="mobile-toggle"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          padding: '1.25rem',
          background: 'white',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <Link to="/browse" onClick={() => setMobileMenuOpen(false)}>Browse Laundries</Link>
          <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>

          {user?.role === 'customer' && (
            <>
              <Link to="/customer" onClick={() => setMobileMenuOpen(false)}>My Dashboard</Link>
              <Link to="/customer/orders" onClick={() => setMobileMenuOpen(false)}>Order History</Link>
              <Link to="/customer/book" className="btn btn-primary btn-sm" onClick={() => setMobileMenuOpen(false)}>
                Book Pickup
              </Link>
            </>
          )}

          {user?.role === 'partner' && (
            <>
              <Link to="/partner" onClick={() => setMobileMenuOpen(false)}>Partner Dashboard</Link>
              <Link to="/partner/services" onClick={() => setMobileMenuOpen(false)}>Services & Prices</Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin Portal</Link>
              <Link to="/admin/commissions" onClick={() => setMobileMenuOpen(false)}>Commission Reports</Link>
            </>
          )}

          {!user ? (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Link to="/login" className="btn btn-outline btn-block" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>Register</Link>
            </div>
          ) : (
            <button onClick={handleLogout} className="btn btn-danger btn-block" style={{ marginTop: '0.5rem' }}>
              Sign Out
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 868px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
}
