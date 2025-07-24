import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createOsceStation,
  getOsceStations,
  getOsceStationById,
  updateOsceStation,
} from '../controllers/osceStationController';

const router = Router();

// Writer submits OSCE station
router.post('/', authenticate, createOsceStation);
// Admin gets all OSCE stations (with filters)
router.get('/', authenticate, getOsceStations);
// Get single OSCE station
router.get('/:id', authenticate, getOsceStationById);
// Admin updates OSCE station (approve/reject/feedback)
router.patch('/:id', authenticate, updateOsceStation);

export default router; 