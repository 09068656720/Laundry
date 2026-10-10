import { Router } from 'express';
import {
  getPartnerOrders,
  respondToOrder,
  recordGarmentIntake,
  requestPriceChange,
  updateOrderStatus,
  getPartnerProfile,
  updatePartnerProfile,
  getPartnerServices,
  createPartnerService,
  updatePartnerService,
  deletePartnerService,
  getPartnerStats,
} from '../controllers/partner.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all partner routes for 'partner' and 'admin' roles
router.use(authenticateToken, requireRole(['partner', 'admin']));

router.get('/orders', getPartnerOrders);
router.post('/orders/:id/respond', respondToOrder);
router.post('/orders/:id/intake', recordGarmentIntake);
router.post('/orders/:id/request-price-change', requestPriceChange);
router.post('/orders/:id/status', updateOrderStatus);

router.get('/profile', getPartnerProfile);
router.put('/profile', updatePartnerProfile);

router.get('/services', getPartnerServices);
router.post('/services', createPartnerService);
router.put('/services/:id', updatePartnerService);
router.delete('/services/:id', deletePartnerService);

router.get('/stats', getPartnerStats);

export default router;
