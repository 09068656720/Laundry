import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  TrendingUp,
  DollarSign,
  Store,
  Calendar,
  ArrowLeft,
  Percent,
  CheckCircle2,
  Download
} from 'lucide-react';

export default function AdminCommissions() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await api.getCommissionReport();
        setReport(data);
      } catch (err) {
        console.error('Failed to load commission report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  const summary = report?.summary || {};
  const byLaundry = report?.byLaundry || [];
  const rate = (report?.platformRate || 0.10) * 100;

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
            <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Platform Commission & Partner Payouts</h1>
            <p>Audited commission breakdown. Platform earns {rate}% on garment item subtotals for each completed order.</p>
          </div>
        </div>

        {/* High Level Financial Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Platform Commission Earned</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
              ₦{parseFloat(summary.all_time_commission || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net platform revenue ({rate}%)</span>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Completed GMV</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              ₦{parseFloat(summary.all_time_volume || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{summary.total_completed_orders || 0} completed orders</span>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #d97706' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Partner Payouts</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
              ₦{parseFloat(summary.all_time_payouts || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>90% subtotal + 100% delivery fees</span>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Commission Rate Rule</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.25rem' }}>
              {rate}%
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Applied exclusively on item subtotal</span>
          </div>
        </div>

        {/* Per Laundry Breakdown Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Earnings & Commission Breakdown by Kano Laundry Partner</h2>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading financial report...</p>
          ) : byLaundry.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No laundry financial data available yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Laundry Partner</th>
                    <th>Kano Area</th>
                    <th>Completed Cleanings</th>
                    <th>Garments Volume (₦)</th>
                    <th>Platform 10% Fee (₦)</th>
                    <th>Laundry Payout Due (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {byLaundry.map((l) => (
                    <tr key={l.laundry_id}>
                      <td>
                        <strong>{l.business_name}</strong>
                      </td>
                      <td>
                        <strong>{l.area}</strong>
                      </td>
                      <td>
                        {l.completed_orders_count || 0}
                      </td>
                      <td>
                        ₦{parseFloat(l.total_item_volume || 0).toLocaleString()}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--primary)' }}>
                          ₦{parseFloat(l.total_commission_earned || 0).toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>
                          ₦{parseFloat(l.total_payout_amount || 0).toLocaleString()}
                        </strong>
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
