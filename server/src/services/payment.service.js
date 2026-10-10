/**
 * Payment Service Abstraction Layer
 * 
 * Phase 1: Simulated payment processor with realistic transaction references,
 * validation, and status transitions.
 * 
 * Phase 2 Ready: Designed as an adapter pattern. When integrating Paystack, Flutterwave,
 * or Monnify in Phase 2, simply implement the same initializePayment, verifyPayment,
 * and refundPayment interface without modifying order controllers.
 */

class PaymentService {
  constructor() {
    this.provider = process.env.PAYMENT_PROVIDER || 'simulated';
  }

  /**
   * Initialize a payment intent/charge
   * @param {Object} paymentData 
   * @param {number} paymentData.amount - Amount in NGN
   * @param {string} paymentData.orderNumber - Unique order number
   * @param {string} paymentData.customerEmail - Customer email
   * @param {string} paymentData.paymentMethod - 'simulated_card' | 'simulated_transfer' | 'cash_on_delivery'
   * @returns {Promise<Object>}
   */
  async processPayment({ amount, orderNumber, customerEmail, paymentMethod = 'simulated_card' }) {
    if (this.provider === 'simulated') {
      const reference = `SIM_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Simulate realistic authorization delay/verification
      const isSuccessful = true; // In simulated mode, valid requests succeed

      if (!isSuccessful) {
        return {
          success: false,
          status: 'failed',
          reference,
          message: 'Payment simulation declined by bank',
        };
      }

      return {
        success: true,
        status: 'paid',
        reference,
        amount,
        orderNumber,
        customerEmail,
        paymentMethod,
        channel: paymentMethod === 'simulated_transfer' ? 'Bank Transfer (Kano Nibss/Instant)' : 'Card (Debit / Mastercard)',
        gatewayResponse: 'Approved (Simulated Gateway)',
        paidAt: new Date().toISOString(),
      };
    }

    // Phase 2: Paystack / Flutterwave integration placeholder
    throw new Error(`Payment provider ${this.provider} is not configured for production yet.`);
  }

  /**
   * Process refund
   * @param {string} reference
   * @param {number} amount
   * @param {string} reason
   */
  async processRefund({ reference, amount, reason }) {
    if (this.provider === 'simulated') {
      return {
        success: true,
        status: 'refunded',
        refundReference: `SIM_REF_${Date.now()}`,
        originalReference: reference,
        amount,
        reason,
        refundedAt: new Date().toISOString(),
      };
    }
    throw new Error(`Refund provider ${this.provider} not implemented.`);
  }
}

export const paymentService = new PaymentService();
export default paymentService;
