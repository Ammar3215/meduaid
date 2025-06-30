import { Router } from 'express';
import { getStats, getRecentPenalties, createPenalty, deletePenalty } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, getStats);
router.get('/penalties', authenticate, getRecentPenalties);
router.post('/penalties', authenticate, createPenalty);
router.delete('/penalties/:id', authenticate, deletePenalty);

export default router; 