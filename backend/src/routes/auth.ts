import { Router } from 'express';
import { register, login, verifyEmail, changeEmail, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.patch('/change-email', authenticate, changeEmail);
router.patch('/change-password', authenticate, changePassword);

export default router; 