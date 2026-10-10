import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [message, setMessage] = useState('');

  const loadDisputes = async () => {
    try {
      const data = await api.getAdminDisputes();
      setDisputes(data.disputes || []);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await api.resolveDispute(resolvingId, { status: 'resolved', resolutionNotes });
      setMessage('Dispute resolved successfully following intake evidence inspection.');
      setResolvingId(null);
      setResolutionNotes('');
      await loadDisputes();
    } catch (err) {
      alert(err.message || 'Failed to resolve dispute.');
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Disputes Arbitration Center</h1>
            <p>Review customer claims against verified garment chain-of-custody intake logs and condition audits.</p>
          </div>
        </div>

        {message && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle size={18} /> {message}
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading disputes...</p>
          ) : disputes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
              <ShieldCheck size={36} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
              <h3>No Active Disputes</h3>
              <p>All garment orders have clear verified intake records and satisfied parties.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Claim Date</th>
                    <th>Order #</th>
                    <th>Raised By</th>
                    <th>Laundry Involved</th>
                    <th>Reason</th>
                    <th style={{ width: '30%' }}>Description</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((d) => (
                    <tr key={d.id}>
                      <td>{new Date(d.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</td>
                      <td><strong>#{d.order_number}</strong></td>
                      <td>
                        <strong>{d.raised_by_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.raised_by_email}</div>
                      </td>
                      <td>{d.laundry_name}</td>
                      <td><strong style={{ color: '#d97706' }}>{d.reason}</strong></td>
                      <td style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{d.description}</td>
                      <td>
                        <span className={d.status === 'resolved' ? 'badge badge-completed' : 'badge badge-placed'}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        {d.status === 'open' ? (
                          <button
                            type="button"
                            onClick={() => { setResolvingId(d.id); setResolutionNotes(''); }}
                            className="btn btn-primary btn-sm"
                          >
                            Resolve Claim
                          </button>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Resolved by {d.resolved_by_name || 'Admin'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RESOLUTION MODAL */}
        {resolvingId && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ marginBottom: '1rem' }}>Arbitrate Dispute #{resolvingId}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Compare the customer's initial checklist with the partner's verified intake inspection notes. Enter your resolution judgment.
              </p>

              <form onSubmit={handleResolve}>
                <div className="form-group">
                  <label className="form-label">Resolution Judgment & Notes</label>
                  <textarea
                    required
                    className="form-textarea"
                    placeholder="e.g. Chain of custody log verified: stain was present and documented at intake. Claim dismissed / Partner agreed to complimentary re-wash."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setResolvingId(null)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Check size={16} /> Mark Dispute Resolved
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
