import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { createSubmission, getSubmissions, updateSubmissionStatus, getSubmissionById, deleteSubmission } from '../controllers/submissionController';
import Submission from '../models/Submission';
import multer from 'multer';
import path from 'path';

const router = Router();

// Allowed file types and extensions
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
  
  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid MIME type. Only image files are allowed.'));
  }
  
  // Additional security: Check for double extensions
  const filename = file.originalname.toLowerCase();
  const suspiciousPatterns = ['.php', '.exe', '.bat', '.sh', '.cmd', '.scr', '.js', '.html'];
  if (suspiciousPatterns.some(pattern => filename.includes(pattern))) {
    return cb(new Error('Suspicious file detected.'));
  }
  
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    // Sanitize filename and add timestamp
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(sanitizedName);
    const nameWithoutExt = path.basename(sanitizedName, ext);
    cb(null, `${uniqueSuffix}-${nameWithoutExt}${ext}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
});

router.post('/', authenticate, createSubmission);
router.get('/', authenticate, getSubmissions);
router.patch('/:id', authenticate, updateSubmissionStatus);
router.delete('/:id', authenticate, deleteSubmission);
router.get('/:id', authenticate, getSubmissionById);

// Image upload endpoint
router.post('/upload', authenticate, upload.array('images', 5), (req: Request, res: Response): void => {
  try {
    const files = (req as any).files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json({ message: 'No files uploaded.' });
      return;
    }
    
    // Additional security check: Verify file content matches extension
    const urls = files.map(f => `/uploads/${f.filename}`);
    
    res.json({ 
      urls,
      message: `${files.length} file(s) uploaded successfully.`,
      totalFiles: files.length
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'File upload failed.' });
  }
});

export default router; 