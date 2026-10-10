import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Package, Calendar, ArrowRight, Search, PlusCircle } from 'lucide-react';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await api.getCustomerOrders();
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Failed to load orders history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((o) => {
        if (filterStatus === 'active') {
          return ['placed', 'accepted', 'picked_up', 'garments_verified', 'price_pending', 'processing', 'ready', 'out_for_delivery'].includes(o.status);
        }
        if (filterStatus === 'completed') return o.status === 'completed';
        if (filterStatus === 'cancelled') return ['cancelled', 'rejected'].includes(o.status);
        return true;
      });

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1050px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>My Order History</h1>
            <p>Review all your past and active dry-cleaning and laundry bookings.</p>
          </div>
          <Link to="/customer/book" className="btn btn-primary">
            <PlusCircle size={16} /> Book New Order
          </Link>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All Orders (${orders.length})` },
            { key: 'active', label: `Active (${orders.filter((o) => ['placed', 'accepted', 'picked_up', 'garments_verified', 'price_pending', 'processing', 'ready', 'out_for_delivery'].includes(o.status)).length})` },
            { key: 'completed', label: `Completed (${orders.filter((o) => o.status === 'completed').length})` },
            { key: 'cancelled', label: `Cancelled / Declined (${orders.filter((o) => ['cancelled', 'rejected'].includes(o.status)).length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              style={{
                border: '1px solid',
                borderColor: filterStatus === tab.key ? 'var(--primary)' : 'var(--border-light)',
                background: filterStatus === tab.key ? 'var(--primary-light)' : 'white',
                color: filterStatus === tab.key ? 'var(--primary-dark)' : 'var(--text-secondary)',
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

        {/* Orders Table */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>Loading history...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <Package size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3>No orders found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              You don't have any orders matching the selected filter.
            </p>
            <Link to="/customer/book" className="btn btn-primary">
              Book Laundry Service
            </Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Laundry Partner</th>
                    <th>Service Type</th>
                    <th>Items</th>
                    <th>Placed On</th>
                    <th>Est. Return</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>#{order.order_number}</strong>
                      </td>
                      <td>
                        <strong>{order.laundry_name}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{order.laundry_area}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {order.service_type}
                      </td>
                      <td>
                        {order.item_count || 1} {order.item_count === 1 ? 'garment' : 'garments'}
                      </td>
                      <td>
                        {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td>
                        {new Date(order.estimated_return_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--primary)' }}>₦{parseFloat(order.total_amount).toLocaleString()}</strong>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        <Link to={`/customer/orders/${order.id}`} className="btn btn-outline btn-sm">
                          Track <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
