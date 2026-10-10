import { Router } from 'express';
import {
  getAdminStats,
  getAdminPartners,
  approvePartner,
  rejectPartner,
  getAdminOrders,
  getCommissionReport,
  getAdminDisputes,
  resolveDispute,
  getAdminUsers,
} from '../controllers/admin.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Only admin can access these endpoints
router.use(authenticateToken, requireRole(['admin']));

router.get('/stats', getAdminStats);
router.get('/partners', getAdminPartners);
router.post('/partners/:id/approve', approvePartner);
router.post('/partners/:id/reject', rejectPartner);

router.get('/orders', getAdminOrders);
router.get('/commissions', getCommissionReport);

router.get('/disputes', getAdminDisputes);
router.post('/disputes/:id/resolve', resolveDispute);

router.get('/users', getAdminUsers);

export default router;
