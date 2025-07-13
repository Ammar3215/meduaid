import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { createSubmission, getSubmissions, updateSubmissionStatus, getSubmissionById, deleteSubmission } from '../controllers/submissionController';
import Submission from '../models/Submission';
import multer from 'multer';
import path from 'path';

const router = Router();

const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.post('/', authenticate, createSubmission);
router.get('/', authenticate, getSubmissions);
router.patch('/:id', authenticate, updateSubmissionStatus);
router.delete('/:id', authenticate, deleteSubmission);

// GET /api/submissions/:id - fetch a single submission by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id).populate('writer', 'name email');
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Image upload endpoint
router.post('/upload', upload.array('images', 5), (req: Request, res: Response) => {
  const files = (req as any).files as Express.Multer.File[];
  const urls = files.map(f => `/uploads/${f.filename}`);
  res.json({ urls });
});

router.get('/:id', authenticate, getSubmissionById);

export default router; 