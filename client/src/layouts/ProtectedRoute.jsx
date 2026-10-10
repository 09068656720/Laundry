import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid var(--border-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Verifying credentials...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: 600, textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem 2rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', background: '#fee2e2', color: '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ marginBottom: '0.75rem', color: '#991b1b' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            You are logged in as <strong>{user.fullName || user.email}</strong> with the <strong>{user.role}</strong> role.
            You do not have administrative permission to view this page.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={user.role === 'customer' ? '/customer' : user.role === 'partner' ? '/partner' : '/admin'} className="btn btn-primary">
              <ArrowLeft size={16} /> Go to My {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
            </Link>
            <Link to="/" className="btn btn-outline">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
