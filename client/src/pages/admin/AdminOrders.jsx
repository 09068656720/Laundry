import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Package, ArrowLeft, Search, Filter } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const data = await api.getAdminOrders({ status: filterStatus });
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Failed to load admin orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [filterStatus]);

  const filtered = orders.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(term) ||
      o.customer_name?.toLowerCase().includes(term) ||
      o.laundry_name?.toLowerCase().includes(term)
    );
  });

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
            <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>All Platform Orders Oversight</h1>
            <p>Real-time audit of every order across Kano, garment counts, financial breakdown, and status progression.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label">Search Order #, Customer or Laundry</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Status Filter</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="placed">Placed</option>
                <option value="accepted">Accepted</option>
                <option value="picked_up">Picked Up / Dropped Off</option>
                <option value="garments_verified">Garments Verified</option>
                <option value="price_pending">Price Approval Pending</option>
                <option value="processing">In Processing</option>
                <option value="ready">Ready for Return</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading orders...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No orders found matching criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Laundry Partner</th>
                    <th>Placed On</th>
                    <th>Garments</th>
                    <th>Subtotal (₦)</th>
                    <th>Platform 10% Fee (₦)</th>
                    <th>Shop Payout (₦)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id}>
                      <td><strong>#{o.order_number}</strong></td>
                      <td>
                        <strong>{o.customer_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customer_phone}</div>
                      </td>
                      <td>
                        <strong>{o.laundry_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.laundry_area}</div>
                      </td>
                      <td>
                        {new Date(o.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td>{o.item_count || 1} items</td>
                      <td>₦{parseFloat(o.item_subtotal).toLocaleString()}</td>
                      <td><strong style={{ color: 'var(--primary)' }}>₦{parseFloat(o.platform_commission_amount).toLocaleString()}</strong></td>
                      <td><strong>₦{parseFloat(o.laundry_payout_amount).toLocaleString()}</strong></td>
                      <td><StatusBadge status={o.status} /></td>
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
