import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createSubmission, getSubmissions, updateSubmissionStatus } from '../controllers/submissionController';

const router = Router();

router.post('/', authenticate, createSubmission);
router.get('/', authenticate, getSubmissions);
router.patch('/:id', authenticate, updateSubmissionStatus);

export default router; 