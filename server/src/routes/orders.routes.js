import { Router } from 'express';
import {
  createOrder,
  getCustomerOrders,
  getOrderById,
  approvePriceChange,
  declinePriceChange,
  cancelOrder,
  raiseDispute,
  createReview,
} from '../controllers/orders.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Customer only order creation and listing
router.post('/', authenticateToken, requireRole(['customer']), createOrder);
router.get('/', authenticateToken, getCustomerOrders);

// Any authenticated role with appropriate permission can view an order (validated in controller)
router.get('/:id', authenticateToken, getOrderById);

// Price change approval / decline by customer
router.post('/:id/approve-price', authenticateToken, requireRole(['customer', 'admin']), approvePriceChange);
router.post('/:id/decline-price', authenticateToken, requireRole(['customer', 'admin']), declinePriceChange);

// Cancellation
router.post('/:id/cancel', authenticateToken, requireRole(['customer', 'admin']), cancelOrder);

// Disputes and reviews
router.post('/:id/dispute', authenticateToken, raiseDispute);
router.post('/:id/review', authenticateToken, requireRole(['customer']), createReview);

export default router;
