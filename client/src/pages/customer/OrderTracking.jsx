import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import OrderTimeline from '../../components/OrderTimeline';
import {
  Calendar,
  MapPin,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Star,
  FileText,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Damaged or missing garment');
  const [disputeDescription, setDisputeDescription] = useState('');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const loadOrder = async () => {
    try {
      const data = await api.getOrderById(id);
      setOrder(data.order);
    } catch (err) {
      setError(err.message || 'Failed to retrieve order tracking information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  // Handle Price Change Approval
  const handleApprovePrice = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.approvePriceChange(id);
      setActionSuccess(res.message);
      await loadOrder();
    } catch (err) {
      setError(err.message || 'Failed to approve price change.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Price Change Decline
  const handleDeclinePrice = async () => {
    if (!window.confirm('Are you sure you want to decline this price change? The order will be cancelled and your clothes returned.')) {
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const res = await api.declinePriceChange(id);
      setActionSuccess(res.message);
      await loadOrder();
    } catch (err) {
      setError(err.message || 'Failed to decline price change.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Order (if placed)
  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setActionLoading(true);
    try {
      await api.cancelOrder(id, 'Cancelled by customer via tracking page');
      await loadOrder();
    } catch (err) {
      setError(err.message || 'Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Submit Dispute
  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.raiseDispute(id, { reason: disputeReason, description: disputeDescription });
      setShowDisputeModal(false);
      setActionSuccess('Dispute raised. Admin team will review the garment intake logs.');
      await loadOrder();
    } catch (err) {
      setError(err.message || 'Failed to submit dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.createReview(id, { rating: reviewRating, comment: reviewComment });
      setShowReviewModal(false);
      setActionSuccess('Thank you for your rating and review!');
      await loadOrder();
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading order status & chain of custody...
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', padding: '3rem 2rem' }}>
          <h2>Order Not Found</h2>
          <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>{error}</p>
          <Link to="/customer" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const pendingPriceChange = order.pendingPriceChange;

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1050px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/customer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Order placed on {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {actionSuccess && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle size={20} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Order Header Card */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Order Number
              </span>
              <h1 style={{ fontSize: '1.85rem', color: 'var(--text-main)', marginTop: '0.1rem' }}>
                #{order.order_number}
              </h1>
            </div>
            <div>
              <StatusBadge status={order.status} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Laundry Partner</span>
              <strong>{order.laundry_name}</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{order.laundry_area}, Kano</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Service Type</span>
              <strong>{order.service_type === 'pickup' ? 'Home Pickup & Delivery' : 'Self Drop-off'}</strong>
              {order.pickup_address && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{order.pickup_address}</div>
              )}
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Est. Return Date</span>
              <strong style={{ color: 'var(--primary)' }}>
                {new Date(order.estimated_return_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Total Amount</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>₦{parseFloat(order.total_amount).toLocaleString()}</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'capitalize' }}>Payment: {order.payment_status}</div>
            </div>
          </div>
        </div>

        {/* PRICE CHANGE APPROVAL MODAL / BANNER (Crucial Business Rule) */}
        {pendingPriceChange && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            borderColor: '#fde68a',
            padding: '2rem',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#92400e', marginBottom: '0.75rem' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, color: '#92400e', fontSize: '1.3rem' }}>
                Customer Approval Required: Price Adjustment
              </h3>
            </div>

            <p style={{ color: '#78350f', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              The laundry partner physically inspected your garments and discovered that extra treatment is required.
              <strong> Processing cannot continue until you approve or decline this price adjustment.</strong>
            </p>

            <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Reason given by {order.laundry_name}:
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem', fontStyle: 'italic' }}>
                "{pendingPriceChange.reason}"
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', borderTop: '1px dashed var(--border-light)', paddingTop: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Original Total</span>
                  <strong style={{ fontSize: '1.1rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                    ₦{parseFloat(pendingPriceChange.old_total).toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: '#92400e', display: 'block', fontWeight: 700 }}>New Adjusted Total</span>
                  <strong style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
                    ₦{parseFloat(pendingPriceChange.new_total).toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Difference</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#d97706' }}>
                    +₦{(parseFloat(pendingPriceChange.new_total) - parseFloat(pendingPriceChange.old_total)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleApprovePrice}
                disabled={actionLoading}
                className="btn btn-primary btn-lg"
                style={{ flex: 1, minWidth: '220px' }}
              >
                {actionLoading ? 'Processing...' : `Approve New Price (₦${parseFloat(pendingPriceChange.new_total).toLocaleString()})`}
              </button>

              <button
                type="button"
                onClick={handleDeclinePrice}
                disabled={actionLoading}
                className="btn btn-danger btn-lg"
                style={{ flex: 1, minWidth: '220px' }}
              >
                Decline & Cancel Order
              </button>
            </div>
          </div>
        )}

        {/* Visual Timeline Section */}
        <div className="card" style={{ marginBottom: '2.5rem', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Order Status Progress</h2>
          <OrderTimeline status={order.status} history={order.history || []} />
        </div>

        {/* GARMENT CHAIN OF CUSTODY TABLE */}
        <div className="card" style={{ marginBottom: '2.5rem', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--primary)" />
                Garment Chain of Custody Record
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Both you and the laundry partner see this exact inventory to prevent missing or damaged item disputes.
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Garment Item</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Intake Condition Inspection Notes</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.item_name}</strong>
                    </td>
                    <td style={{ textTransform: 'capitalize', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {item.category?.replace(/_/g, ' ')}
                    </td>
                    <td><strong>{item.quantity}</strong></td>
                    <td>₦{parseFloat(item.unit_price).toLocaleString()}</td>
                    <td><strong>₦{parseFloat(item.total_price).toLocaleString()}</strong></td>
                    <td>
                      {item.intake_verified ? (
                        <div>
                          <span className="badge badge-verified" style={{ marginBottom: '0.25rem' }}>
                            <CheckCircle size={11} /> Intake Verified
                          </span>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                            {item.condition_notes || 'Inspected: fabric intact, no defects.'}
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-pending">
                          <Clock size={11} /> Pending Physical Intake
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Price Breakdown & Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Price Breakdown Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Final Financial Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Garments Subtotal:</span>
                <strong>₦{parseFloat(order.item_subtotal).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Delivery Fee ({order.service_type}):</span>
                <strong>₦{parseFloat(order.delivery_fee).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Platform Service Fee:</span>
                <strong>₦{parseFloat(order.service_fee).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', fontSize: '1.1rem', fontWeight: 800 }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--primary)' }}>₦{parseFloat(order.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Center Card */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Order Actions</h3>

            {order.status === 'placed' && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={actionLoading}
                className="btn btn-danger btn-block"
              >
                Cancel Order
              </button>
            )}

            {order.status === 'completed' && !order.review && (
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="btn btn-primary btn-block"
              >
                <Star size={16} /> Leave Review for {order.laundry_name}
              </button>
            )}

            {order.review && (
              <div className="alert alert-success" style={{ margin: 0, padding: '0.75rem' }}>
                <CheckCircle size={16} />
                <span style={{ fontSize: '0.85rem' }}>You rated this order {order.review.rating} / 5 stars</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowDisputeModal(true)}
              className="btn btn-outline btn-block"
              style={{ color: '#d97706', borderColor: '#fde68a' }}
            >
              <AlertTriangle size={16} /> Report an Issue / Raise Dispute
            </button>
          </div>
        </div>

        {/* DISPUTE MODAL */}
        {showDisputeModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ marginBottom: '1rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} /> Raise a Garment Dispute
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Our Kano admin team will compare your complaint against the verified intake notes and chain of custody log.
              </p>

              <form onSubmit={handleSubmitDispute}>
                <div className="form-group">
                  <label className="form-label">Dispute Reason</label>
                  <select
                    className="form-select"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  >
                    <option value="Damaged garment">Damaged garment (tear, burn, discoloration)</option>
                    <option value="Missing garment">Missing item from order</option>
                    <option value="Late delivery">Significant delay beyond turnaround date</option>
                    <option value="Poor cleaning quality">Stains not treated or garment unclean</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Description</label>
                  <textarea
                    required
                    className="form-textarea"
                    placeholder="Describe which garment item was affected and the exact problem..."
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Submitting...' : 'Submit Dispute'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REVIEW MODAL */}
        {showReviewModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ marginBottom: '1rem' }}>Rate & Review {order.laundry_name}</h3>

              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label className="form-label">Rating (1 to 5 Stars)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          color: star <= reviewRating ? '#f59e0b' : '#cbd5e1'
                        }}
                      >
                        <Star size={28} fill={star <= reviewRating ? '#f59e0b' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Feedback Comments</label>
                  <textarea
                    required
                    className="form-textarea"
                    placeholder="How was the cleaning, starching, and turnaround time?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Submitting...' : 'Post Review'}
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
