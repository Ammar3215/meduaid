import { Router } from 'express';
import { register, login, verifyEmail, changeEmail, changePassword, updateProfile, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.patch('/change-email', authenticate, changeEmail);
router.patch('/change-password', authenticate, changePassword);
router.patch('/update-profile', authenticate, updateProfile);

export default router; 