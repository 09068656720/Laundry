import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Store,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  Truck,
  Star,
  Check,
  X,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPartners = async () => {
    try {
      const data = await api.getAdminPartners(statusFilter);
      setPartners(data.partners || []);
    } catch (err) {
      setError(err.message || 'Failed to load partners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, [statusFilter]);

  const handleApprove = async (partnerId) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.approvePartner(partnerId);
      setMessage(res.message);
      await loadPartners();
    } catch (err) {
      setError(err.message || 'Failed to approve partner.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (partnerId) => {
    if (!window.confirm('Are you sure you want to revoke/deactivate this partner? They will be hidden from customer browse results.')) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await api.rejectPartner(partnerId);
      setMessage(res.message);
      await loadPartners();
    } catch (err) {
      setError(err.message || 'Failed to revoke partner.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Admin Overview
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Laundry Partner Onboarding & Approvals</h1>
            <p>Review and verify Kano laundry shops. Only approved partners appear in the customer search directory.</p>
          </div>
        </div>

        {message && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle size={18} /> {message}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All Partners (${partners.length})` },
            { key: 'pending', label: `Pending Verification (${partners.filter((p) => !p.is_approved).length})` },
            { key: 'approved', label: `Approved & Live (${partners.filter((p) => p.is_approved).length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              style={{
                border: '1px solid',
                borderColor: statusFilter === tab.key ? 'var(--primary)' : 'var(--border-light)',
                background: statusFilter === tab.key ? 'var(--primary-light)' : 'white',
                color: statusFilter === tab.key ? 'var(--primary-dark)' : 'var(--text-secondary)',
                padding: '0.45rem 1rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Partners Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading partners...</p>
          ) : partners.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No laundry partners found matching the filter.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Owner & Contact</th>
                    <th>Kano Area</th>
                    <th>Turnaround</th>
                    <th>Pickup Available</th>
                    <th>Orders Completed</th>
                    <th>Commission Generated</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.business_name}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.address}</div>
                      </td>
                      <td>
                        <div>{p.owner_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.phone} • {p.email}</div>
                      </td>
                      <td>
                        <strong>{p.area}</strong>
                      </td>
                      <td>
                        {p.turnaround_days} Days
                      </td>
                      <td>
                        {p.offers_pickup ? `Yes (₦${parseFloat(p.delivery_fee).toLocaleString()})` : 'No (Drop-off)'}
                      </td>
                      <td>
                        {p.total_orders || 0}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--primary)' }}>
                          ₦{parseFloat(p.total_commission_paid || 0).toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <span className={p.is_approved ? 'badge badge-completed' : 'badge badge-placed'}>
                          {p.is_approved ? 'Approved' : 'Pending Approval'}
                        </span>
                      </td>
                      <td>
                        {!p.is_approved ? (
                          <button
                            type="button"
                            onClick={() => handleApprove(p.id)}
                            disabled={actionLoading}
                            className="btn btn-primary btn-sm"
                          >
                            <Check size={14} /> Approve Partner
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReject(p.id)}
                            disabled={actionLoading}
                            className="btn btn-danger btn-sm"
                          >
                            <X size={14} /> Revoke Approval
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
