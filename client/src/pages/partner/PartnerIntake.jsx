import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import OrderTimeline from '../../components/OrderTimeline';
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Sparkles,
  DollarSign,
  Send,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function PartnerIntake() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [generalNotes, setGeneralNotes] = useState('');

  // Price modification state
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [newSubtotal, setNewSubtotal] = useState('');
  const [priceChangeReason, setPriceChangeReason] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadOrder = async () => {
    try {
      const data = await api.getOrderById(id);
      setOrder(data.order);
      setItems(data.order.items || []);
      setNewSubtotal(data.order.item_subtotal?.toString() || '');
    } catch (err) {
      setError(err.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // 1. Save Garment Intake Audit
  const handleSaveIntake = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const intakeItems = items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        conditionNotes: it.condition_notes,
        intakeVerified: true,
      }));

      const res = await api.recordGarmentIntake(id, { items: intakeItems, generalNotes });
      setMessage('Garment intake and chain of custody recorded successfully!');
      await loadOrder();
    } catch (err) {
      setError(err.message || 'Failed to save garment intake.');
    } finally {
      setSaving(false);
    }
  };

  // 2. Propose Price Change
  const handleSubmitPriceChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await api.requestPriceChange(id, parseFloat(newSubtotal), priceChangeReason);
      setMessage('Price adjustment request sent! Waiting for customer approval.');
      setShowPriceForm(false);
      await loadOrder();
    } catch (err) {
      setError(err.message || 'Failed to submit price change request.');
    } finally {
      setSaving(false);
    }
  };

  // 3. Advance Status
  const handleAdvanceStatus = async (nextStatus, statusNotes) => {
    setSaving(true);
    setError('');
    try {
      const res = await api.updateOrderStatus(id, nextStatus, statusNotes);
      setMessage(res.message);
      await loadOrder();
    } catch (err) {
      setError(err.message || 'Failed to advance status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading garment intake portal...
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', padding: '3rem 2rem' }}>
          <h2>Error Loading Order</h2>
          <p style={{ margin: '1rem 0' }}>{error}</p>
          <Link to="/partner" className="btn btn-primary">Return to Partner Dashboard</Link>
        </div>
      </div>
    );
  }

  const pendingPriceChange = order.pendingPriceChange;

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1050px' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/partner" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Partner Orders
          </Link>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Placed on {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {message && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle size={20} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Order Header Summary */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Order #{order.order_number}
              </span>
              <h1 style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>
                Customer: {order.customer_name}
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Phone: <strong>{order.customer_phone || 'N/A'}</strong> • Email: {order.customer_email}
              </div>
            </div>
            <div>
              <StatusBadge status={order.status} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Service Logistics:</span>
              <strong>{order.service_type === 'pickup' ? 'Home Pickup' : 'Drop-off at Shop'}</strong>
              {order.pickup_address && <div style={{ color: 'var(--text-muted)' }}>{order.pickup_address}</div>}
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Promised Return Date:</span>
              <strong style={{ color: 'var(--primary)' }}>
                {new Date(order.estimated_return_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Garments Subtotal:</span>
              <strong>₦{parseFloat(order.item_subtotal).toLocaleString()}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Your Shop Payout:</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                ₦{parseFloat(order.laundry_payout_amount).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* PRICE CHANGE ALERT BANNER IF PENDING */}
        {pendingPriceChange && (
          <div className="card" style={{ background: '#fffbeb', borderColor: '#fde68a', padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', marginBottom: '0.5rem' }}>
              <AlertTriangle size={20} />
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Waiting for Customer Price Approval</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#78350f', margin: 0 }}>
              You requested a price modification to <strong>₦{parseFloat(pendingPriceChange.new_total).toLocaleString()}</strong> (Original: ₦{parseFloat(pendingPriceChange.old_total).toLocaleString()}). Reason: "{pendingPriceChange.reason}". Cleaning cannot be advanced until the customer approves or declines.
            </p>
          </div>
        )}

        {/* SECTION 1: GARMENT INTAKE INSPECTION FORM */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--primary)" />
                Physical Garment Intake & Condition Audit
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Carefully record any existing stains, missing buttons, or fabric defects to protect both you and the customer.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveIntake}>
            <div className="table-responsive" style={{ marginBottom: '1.25rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Customer Note</th>
                    <th style={{ width: '40%' }}>Intake Inspection / Condition Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>
                        <strong>{item.item_name}</strong>
                      </td>
                      <td style={{ textTransform: 'capitalize', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {item.category?.replace(/_/g, ' ')}
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          style={{ width: '60px', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}
                        />
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {item.condition_notes || 'None provided'}
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="e.g. Verified: Ink stain on pocket, fabric threads intact"
                          value={item.condition_notes || ''}
                          onChange={(e) => handleItemChange(idx, 'condition_notes', e.target.value)}
                          className="form-input"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-group">
              <label className="form-label">General Intake Summary Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Garments received in good order; 1 native wear requires special solvent pre-wash"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
              />
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary">
              <CheckCircle size={16} /> Save & Verify Garment Intake
            </button>
          </form>
        </div>

        {/* SECTION 2: PROPOSE PRICE CHANGE */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} color="#d97706" />
                Need to Adjust Price After Inspection?
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                If deep stain extraction or extra delicate handling is required, propose an updated total for the customer to approve.
              </p>
            </div>

            {!showPriceForm && !pendingPriceChange && (
              <button
                type="button"
                onClick={() => setShowPriceForm(true)}
                className="btn btn-outline btn-sm"
              >
                Propose Price Adjustment
              </button>
            )}
          </div>

          {showPriceForm && (
            <form onSubmit={handleSubmitPriceChange} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Current Garments Subtotal</label>
                  <input
                    type="text"
                    disabled
                    className="form-input"
                    value={`₦${parseFloat(order.item_subtotal).toLocaleString()}`}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Proposed New Subtotal (₦)</label>
                  <input
                    type="number"
                    required
                    step={100}
                    className="form-input"
                    value={newSubtotal}
                    onChange={(e) => setNewSubtotal(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Price Adjustment (Visible to Customer)</label>
                <textarea
                  required
                  className="form-textarea"
                  placeholder="e.g. Deep engine oil stain on Babbar Riga requires specialized solvent pre-treatment (+₦1,500)"
                  value={priceChangeReason}
                  onChange={(e) => setPriceChangeReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowPriceForm(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  <Send size={15} /> Submit for Customer Approval
                </button>
              </div>
            </form>
          )}
        </div>

        {/* SECTION 3: ORDER WORKFLOW PROGRESSION */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Advance Processing Status</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Current Status: <strong style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>{order.status.replace(/_/g, ' ')}</strong>
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {order.status === 'accepted' && (
              <button
                type="button"
                onClick={() => handleAdvanceStatus('picked_up', 'Garments picked up from customer and brought into laundry')}
                disabled={saving}
                className="btn btn-primary"
              >
                Mark as Clothes Picked Up / Dropped Off
              </button>
            )}

            {order.status === 'picked_up' && (
              <button
                type="button"
                onClick={() => handleAdvanceStatus('garments_verified', 'Intake inspection verified')}
                disabled={saving}
                className="btn btn-primary"
              >
                Mark Garments Verified
              </button>
            )}

            {order.status === 'garments_verified' && (
              <button
                type="button"
                onClick={() => handleAdvanceStatus('processing', 'Starch, steam and dry cleaning underway')}
                disabled={saving || !!pendingPriceChange}
                className="btn btn-primary"
              >
                Start Cleaning & Pressing (Processing)
              </button>
            )}

            {order.status === 'processing' && (
              <button
                type="button"
                onClick={() => handleAdvanceStatus('ready', 'Garments finished, packaged in garment bag and ready for delivery')}
                disabled={saving}
                className="btn btn-primary"
              >
                Mark Clothes Ready for Return
              </button>
            )}

            {order.status === 'ready' && (
              <button
                type="button"
                onClick={() => handleAdvanceStatus('out_for_delivery', 'Order dispatched with rider for doorstep delivery')}
                disabled={saving}
                className="btn btn-primary"
              >
                Dispatch Out for Delivery / Collection
              </button>
            )}

            {order.status === 'out_for_delivery' && (
              <button
                type="button"
                onClick={() => handleAdvanceStatus('completed', 'Garments successfully delivered and signed off')}
                disabled={saving}
                className="btn btn-primary"
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
              >
                <CheckCircle size={16} /> Mark Order Completed
              </button>
            )}

            {order.status === 'completed' && (
              <div className="badge badge-completed" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
                <CheckCircle size={16} /> Order Completed & Payout Logged
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
