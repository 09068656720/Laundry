import React from 'react';

const STATUS_LABELS = {
  placed: 'Order Placed',
  accepted: 'Accepted by Laundry',
  picked_up: 'Clothes Picked Up',
  garments_verified: 'Garments Verified',
  price_pending: 'Price Approval Required',
  processing: 'In Cleaning & Press',
  ready: 'Ready for Return',
  out_for_delivery: 'Out for Delivery',
  completed: 'Completed',
  rejected: 'Order Rejected',
  cancelled: 'Cancelled',
};

export default function StatusBadge({ status }) {
  const normStatus = (status || '').toLowerCase();
  const label = STATUS_LABELS[normStatus] || normStatus.replace(/_/g, ' ');
  const badgeClass = `badge badge-${normStatus}`;

  return <span className={badgeClass}>{label}</span>;
}
