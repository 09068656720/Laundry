import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  Package,
  Clock,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  ArrowRight,
  Truck,
  Shirt
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await api.getCustomerOrders();
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const activeOrders = orders.filter((o) =>
    ['placed', 'accepted', 'picked_up', 'garments_verified', 'price_pending', 'processing', 'ready', 'out_for_delivery'].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalSpent = completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const pricePendingOrders = orders.filter((o) => o.status === 'price_pending' || o.pending_price_change);

  return (
    <div style={{ padding: '2.5rem 0 4rem' }}>
      <div className="container">
        {/* Welcome Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>
              Sannu, {user?.fullName || 'Customer'}! 👋
            </h1>
            <p>Welcome to your Kano Laundry portal. Track active orders and book verified cleanings.</p>
          </div>
          <Link to="/customer/book" className="btn btn-primary btn-lg">
            <PlusCircle size={18} /> Book New Laundry
          </Link>
        </div>

        {/* Pending Price Changes Alert Banner */}
        {pricePendingOrders.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle size={24} color="#d97706" />
              <div>
                <strong>Action Required: Price Adjustment Pending Approval</strong>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  {pricePendingOrders.length} of your orders has a proposed price modification after physical garment inspection.
                </p>
              </div>
            </div>
            <Link to={`/customer/orders/${pricePendingOrders[0].id}`} className="btn btn-primary btn-sm">
              Review & Approve
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Cleanings</span>
              <div style={{ background: 'var(--secondary-light)', color: 'var(--secondary)', padding: '6px', borderRadius: '8px' }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {activeOrders.length}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Orders</span>
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '6px', borderRadius: '8px' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
              {completedOrders.length}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Spent (₦)</span>
              <div style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '6px', borderRadius: '8px' }}>
                <Shirt size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ₦{totalSpent.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Active Orders Section */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2>Active Cleanings ({activeOrders.length})</h2>
            <Link to="/customer/orders" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              View All History &gt;
            </Link>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading active orders...</p>
          ) : activeOrders.length === 0 ? (
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#f8fafc' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--text-muted)' }}>
                <Package size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>No active laundry orders</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', maxWidth: 400, margin: '0 auto 1.25rem' }}>
                Have dirty garments, Babbar Riga, or beddings? Book a verified Kano laundry partner in under 2 minutes.
              </p>
              <Link to="/customer/book" className="btn btn-primary">
                <PlusCircle size={16} /> Book Your First Order
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {activeOrders.map((order) => (
                <div key={order.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Order Number</span>
                      <strong>{order.order_number}</strong>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.3rem' }}>{order.laundry_name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {order.laundry_area}, Kano • {order.service_type === 'pickup' ? 'Home Pickup' : 'Drop-off'}
                  </div>

                  <div style={{
                    background: 'var(--bg-muted)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Est. Return Date:</span>
                      <strong>{new Date(order.estimated_return_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Amount:</span>
                      <strong style={{ color: 'var(--primary)' }}>₦{parseFloat(order.total_amount).toLocaleString()}</strong>
                    </div>
                  </div>

                  <Link to={`/customer/orders/${order.id}`} className="btn btn-primary btn-block" style={{ marginTop: 'auto' }}>
                    Track Order & Garments <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
