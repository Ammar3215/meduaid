import { Router } from 'express';
import { getStats, getRecentPenalties, createPenalty, deletePenalty, getWriters, getAllSubmissions } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, getStats);
router.get('/penalties', authenticate, getRecentPenalties);
router.post('/penalties', authenticate, createPenalty);
router.delete('/penalties/:id', authenticate, deletePenalty);
router.get('/writers', authenticate, getWriters);
router.get('/all-submissions', authenticate, getAllSubmissions);

export default router; 