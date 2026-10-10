import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Package,
  Store,
  AlertTriangle,
  Users,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.getAdminStats(),
          api.getAdminOrders(),
        ]);
        setStats(statsRes.stats);
        setRecentOrders((ordersRes.orders || []).slice(0, 5));
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-verified" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                <ShieldCheck size={13} /> Kano Platform Oversight
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem' }}>Platform Administrator Portal</h1>
            <p>Financial oversight, partner approvals, dispute arbitration, and platform commission tracking.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/admin/partners" className="btn btn-outline">
              <Store size={16} /> Partner Approvals ({stats?.pending_laundries || 0} Pending)
            </Link>
            <Link to="/admin/commissions" className="btn btn-primary">
              <TrendingUp size={16} /> Commission Reports
            </Link>
          </div>
        </div>

        {/* High Level KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Platform Commission Earned</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
              ₦{parseFloat(stats?.total_commission_earned || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From 10% platform fee on item subtotal</span>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total GMV (Completed Volume)</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              ₦{parseFloat(stats?.total_gmv || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross merchandise value</span>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Completed Orders</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
              {stats?.completed_orders || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats?.active_orders || 0} active in pipeline</span>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Approved Laundries</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.25rem' }}>
              {stats?.approved_laundries || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
              {stats?.pending_laundries || 0} awaiting approval
            </span>
          </div>
        </div>

        {/* Quick Hub Navigation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <Link to="/admin/partners" className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={22} />
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-main)' }}>Partner Onboarding</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verify and approve Kano laundries</span>
            </div>
          </Link>

          <Link to="/admin/commissions" className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--secondary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-main)' }}>Commission Reports</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Per-laundry revenue and payouts</span>
            </div>
          </Link>

          <Link to="/admin/orders" className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} />
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-main)' }}>Order Oversight</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Track all live orders in Kano</span>
            </div>
          </Link>

          <Link to="/admin/disputes" className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-main)' }}>Disputes Arbitration</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats?.open_disputes || 0} open claims</span>
            </div>
          </Link>
        </div>

        {/* Recent Orders Overview */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Recent Platform Bookings</h2>
            <Link to="/admin/orders" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              View All Orders &gt;
            </Link>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>Loading recent orders...</p>
          ) : recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No orders placed yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Laundry Partner</th>
                    <th>Items</th>
                    <th>Subtotal</th>
                    <th>Platform 10% Fee</th>
                    <th>Shop Payout</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td><strong>#{o.order_number}</strong></td>
                      <td>{o.customer_name}</td>
                      <td>{o.laundry_name} ({o.laundry_area})</td>
                      <td>{o.item_count || 1} items</td>
                      <td>₦{parseFloat(o.item_subtotal).toLocaleString()}</td>
                      <td><strong style={{ color: 'var(--primary)' }}>₦{parseFloat(o.platform_commission_amount).toLocaleString()}</strong></td>
                      <td>₦{parseFloat(o.laundry_payout_amount).toLocaleString()}</td>
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
