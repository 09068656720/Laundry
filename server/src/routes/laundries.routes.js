import { Router } from 'express';
import { getLaundries, getLaundryById, getAreas } from '../controllers/laundries.controller.js';

const router = Router();

router.get('/', getLaundries);
router.get('/areas', getAreas);
router.get('/:id', getLaundryById);

export default router;
