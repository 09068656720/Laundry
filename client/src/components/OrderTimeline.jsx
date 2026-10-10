import React from 'react';
import { Check, Clock, AlertCircle, Sparkles, XCircle } from 'lucide-react';

const ORDER_FLOW = [
  { key: 'placed', title: 'Order Placed', desc: 'Booking confirmed with initial estimate' },
  { key: 'accepted', title: 'Accepted', desc: 'Laundry partner accepted the booking' },
  { key: 'picked_up', title: 'Picked Up / Dropped Off', desc: 'Clothes transferred into partner custody' },
  { key: 'garments_verified', title: 'Garments Verified', desc: 'Intake audit & condition inspection complete' },
  { key: 'processing', title: 'Processing', desc: 'Washing, starching, dry cleaning & steam pressing' },
  { key: 'ready', title: 'Ready', desc: 'Garments finished, packaged and ready for return' },
  { key: 'out_for_delivery', title: 'Out for Delivery / Collection', desc: 'On its way back to your doorstep' },
  { key: 'completed', title: 'Completed', desc: 'Delivered and signed off' },
];

export default function OrderTimeline({ status, history = [] }) {
  const isCancelled = status === 'cancelled';
  const isRejected = status === 'rejected';

  // Find index of current status in the normal flow
  let currentIndex = ORDER_FLOW.findIndex((step) => step.key === status);
  if (status === 'price_pending') {
    currentIndex = ORDER_FLOW.findIndex((step) => step.key === 'garments_verified');
  }

  // Create a map of timestamps and notes from history log
  const historyMap = {};
  history.forEach((h) => {
    historyMap[h.new_status] = h;
  });

  return (
    <div style={{ margin: '1rem 0' }}>
      {(isCancelled || isRejected) && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <XCircle size={20} />
          <div>
            <strong>Order {isCancelled ? 'Cancelled' : 'Rejected'}</strong>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {isCancelled
                ? 'This order was cancelled. Any clothes collected will be returned.'
                : 'The laundry could not accept this order.'}
            </p>
          </div>
        </div>
      )}

      {status === 'price_pending' && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Price Adjustment Pending Your Approval</strong>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              The laundry inspected your garments and proposed an updated total. Please review and approve below to continue processing.
            </p>
          </div>
        </div>
      )}

      <div className="timeline-track">
        {ORDER_FLOW.map((step, idx) => {
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          const stepHistory = historyMap[step.key];

          let stepClass = 'timeline-step';
          if (isCompleted) stepClass += ' completed';
          if (isCurrent) stepClass += ' active';

          return (
            <div key={step.key} className={stepClass}>
              <div className="timeline-step-dot">
                {isCompleted ? (
                  <Check size={14} strokeWidth={3} />
                ) : isCurrent ? (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
                ) : (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1' }} />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span className="timeline-step-title" style={{ color: isCurrent ? 'var(--primary)' : undefined }}>
                  {step.title}
                </span>
                {stepHistory?.created_at && (
                  <span className="timeline-step-time">
                    {new Date(stepHistory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                    {new Date(stepHistory.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              <p className="timeline-step-desc">
                {stepHistory?.notes || step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
