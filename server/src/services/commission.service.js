/**
 * Commission & Payout Service
 * 
 * Business Rules:
 * 1. Platform Commission = Configurable % (default 10%) on item subtotal ONLY.
 * 2. Laundry Payout = (item subtotal * (1 - commission_rate)) + delivery_fee.
 *    (The delivery fee belongs entirely to the laundry/rider, not platform fee).
 * 3. Platform Service Fee = Fixed platform fee (default ₦300) paid by customer.
 * 4. Customer Total = item subtotal + delivery_fee + service_fee.
 */

const DEFAULT_COMMISSION_RATE = parseFloat(process.env.COMMISSION_RATE || '0.10');
const DEFAULT_SERVICE_FEE = parseFloat(process.env.SERVICE_FEE || '300.00');

export function calculateOrderTotals({
  itemSubtotal,
  serviceType,
  laundryDeliveryFee = 0,
  commissionRate = DEFAULT_COMMISSION_RATE,
  serviceFee = DEFAULT_SERVICE_FEE,
}) {
  const subtotal = Math.max(0, parseFloat(itemSubtotal || 0));
  const delivery = serviceType === 'pickup' ? Math.max(0, parseFloat(laundryDeliveryFee || 0)) : 0;
  const fixedServiceFee = Math.max(0, parseFloat(serviceFee || 0));
  
  const totalAmount = subtotal + delivery + fixedServiceFee;

  const commissionAmount = parseFloat((subtotal * commissionRate).toFixed(2));
  const laundryPayout = parseFloat(((subtotal - commissionAmount) + delivery).toFixed(2));

  return {
    itemSubtotal: parseFloat(subtotal.toFixed(2)),
    deliveryFee: parseFloat(delivery.toFixed(2)),
    serviceFee: parseFloat(fixedServiceFee.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    commissionRate,
    commissionAmount,
    laundryPayoutAmount: laundryPayout,
  };
}

export default {
  calculateOrderTotals,
  DEFAULT_COMMISSION_RATE,
  DEFAULT_SERVICE_FEE,
};
