import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  Store,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  Check,
  X,
  FileCheck2,
  Settings
} from 'lucide-react';

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('new');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.getPartnerStats(),
        api.getPartnerOrders(activeTab),
      ]);
      setStats(statsRes.stats);
      setOrders(ordersRes.orders || []);
    } catch (err) {
      console.error('Failed to load partner dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleRespond = async (orderId, action) => {
    setActionLoading(true);
    try {
      await api.respondToOrder(orderId, action);
      setMessage(`Order #${orderId} ${action === 'accept' ? 'accepted' : 'rejected'}.`);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update order response.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-verified">
                <Store size={13} /> Verified Laundry Partner
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem' }}>
              {user?.businessName || 'Partner Dashboard'}
            </h1>
            <p>Manage incoming bookings, garment intake inspection, and order fulfillment in Kano.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/partner/services" className="btn btn-outline">
              <Settings size={16} /> Services & Pricing
            </Link>
          </div>
        </div>

        {message && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} /> {message}
          </div>
        )}

        {/* Stats KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="card" style={{ borderLeft: '4px solid #d97706' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>New Requests</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
              {stats?.new_requests || 0}
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>In Cleaning / Intake</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>
              {stats?.in_progress || 0}
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #059669' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ready for Return</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
              {stats?.ready_for_delivery || 0}
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--primary-dark)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Earned Payout (₦)</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
              ₦{parseFloat(stats?.total_earnings || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Orders Queue with Tabbed Filter */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem' }}>Orders Management Queue</h2>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { key: 'new', label: 'Incoming Requests', count: stats?.new_requests },
                { key: 'active', label: 'In Progress / Intake', count: stats?.in_progress },
                { key: 'completed', label: 'Completed Orders', count: stats?.completed_orders },
                { key: 'all', label: 'All Orders' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    border: '1px solid',
                    borderColor: activeTab === tab.key ? 'var(--primary)' : 'var(--border-light)',
                    background: activeTab === tab.key ? 'var(--primary-light)' : 'white',
                    color: activeTab === tab.key ? 'var(--primary-dark)' : 'var(--text-secondary)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  {tab.label} {tab.count !== undefined && `(${tab.count})`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading orders...</p>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <Package size={36} style={{ margin: '0 auto 0.75rem', color: 'var(--text-light)' }} />
              <p>No orders in the "{activeTab}" queue.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer Name</th>
                    <th>Address / Type</th>
                    <th>Garments</th>
                    <th>Est. Return Date</th>
                    <th>Shop Payout Due</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>#{order.order_number}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <strong>{order.customer_name}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{order.customer_phone}</div>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{order.service_type}</span>
                        {order.pickup_address && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {order.pickup_address}
                          </div>
                        )}
                      </td>
                      <td>
                        {order.item_count || 1} items
                      </td>
                      <td>
                        {new Date(order.estimated_return_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--primary)' }}>₦{parseFloat(order.laundry_payout_amount).toLocaleString()}</strong>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        {order.status === 'placed' ? (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleRespond(order.id, 'accept')}
                              disabled={actionLoading}
                              className="btn btn-primary btn-sm"
                            >
                              <Check size={14} /> Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRespond(order.id, 'reject')}
                              disabled={actionLoading}
                              className="btn btn-danger btn-sm"
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <Link to={`/partner/orders/${order.id}/intake`} className="btn btn-outline btn-sm">
                            <FileCheck2 size={14} /> Manage & Intake
                          </Link>
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
