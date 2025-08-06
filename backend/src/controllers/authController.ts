import { Request, Response, RequestHandler } from 'express';
import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { AppError, asyncHandler, sendErrorResponse } from '../utils/errorHandler';

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }
  
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }
  
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Registration failed. Please check your details and try again.', 400);
  }
    // Step 3: Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    // Step 4: Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerificationToken,
      verified: false,
      role: 'writer',
    });
  // Registration initiated successfully
  // Send verification email
  await sendVerificationEmail(email, emailVerificationToken);
  res.status(201).json({ 
    success: true,
    message: 'Verification email sent. Please check your inbox.' 
  });
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }
  
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid credentials', 400);
  }
  
  if (!user.verified) {
    throw new AppError('Please verify your email before logging in.', 403);
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 400);
  }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    
    // Set httpOnly cookie instead of sending token in response body
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: true, // Always secure for cross-origin
      sameSite: 'none', // Required for cross-origin cookies
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined, // Let browser handle domain
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    
  res.json({
    success: true,
    token: token, // Return JWT token in response body
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'admin',
      isVerified: user.verified,
    }
  });
});

// Email verification controller
export const verifyEmail: RequestHandler = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token || typeof token !== 'string') {
    throw new AppError('No verification token found.', 400);
  }
  
  const user = await User.findOne({ emailVerificationToken: token });
  if (!user) {
    throw new AppError('Invalid or expired token.', 400);
  }
  
  if (user.verified) {
    return res.status(200).json({ 
      success: true,
      message: 'Email already verified.' 
    });
  }
  
  user.verified = true;
  user.emailVerificationToken = undefined;
  await user.save();
  
  res.json({ 
    success: true,
    message: 'Email verified successfully.' 
  });
});

// Change Email
export const changeEmail: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { newEmail } = req.body;
    if (!newEmail || typeof newEmail !== 'string' || !newEmail.includes('@')) {
      res.status(400).json({ message: 'Please provide a valid new email.' });
      return;
    }
    // Check if email is already in use
    const existing = await User.findOne({ email: newEmail });
    if (existing) {
      // SECURITY FIX: Don't reveal if email exists, use generic message
      res.status(400).json({ message: 'Email update failed. Please try a different email.' });
      return;
    }
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    user.email = newEmail;
    user.verified = false; // Require re-verification if you want
    await user.save();
    // Optionally, sendVerificationEmail(newEmail, ...)
    res.json({ message: 'Email updated successfully.' });
  } catch (err) {
    // Change email error occurred
    res.status(500).json({ message: 'Server error' });
  }
};

// Change Password
export const changePassword: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current and new password are required.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters.' });
      return;
    }
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Current password is incorrect.' });
      return;
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    // Change password error occurred
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, email } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.name = name || user.name;
    user.email = email || user.email;
    
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin',
        isVerified: user.verified,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 

// Forgot Password
export const forgotPassword: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email is required.' });
      return;
    }
    const user = await User.findOne({ email });
    if (!user) {
      // For security, do not reveal if user exists
      res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await user.save();
    await sendPasswordResetEmail(email, token);
    res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    return;
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

// Reset Password
export const resetPassword: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required.' });
      return;
    }
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
    if (!user) {
      res.status(400).json({ message: 'Invalid or expired token.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters.' });
      return;
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successful.' });
    return;
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

// Logout endpoint to clear httpOnly cookie
export const logout: RequestHandler = (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: true, // Always secure for cross-origin
    sameSite: 'none', // Required for cross-origin cookies
  });
  res.json({ message: 'Logged out successfully' });
}; 