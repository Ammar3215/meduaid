import { Router } from 'express';
import { getStats, getPenalties } from '../controllers/writerController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, getStats);
router.get('/penalties', authenticate, getPenalties);

export default router; 