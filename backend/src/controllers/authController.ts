import { Request, Response, RequestHandler } from 'express';
import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';

export const register: RequestHandler = async (req, res) => {
  console.log('Signup route hit');
  try {
    const { name, email, password } = req.body;
    // Step 2: Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // SECURITY FIX: Don't reveal if user exists, use generic message
      res.status(400).json({ message: 'Registration failed. Please check your details and try again.' });
      return;
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
    // Log registration event without sensitive data
    console.log('User registration initiated for email:', email.replace(/(.{2}).*(@.*)/, '$1***$2'));
    // Send verification email
    await sendVerificationEmail(email, emailVerificationToken);
    res.status(201).json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    if (!user.verified) {
      res.status(403).json({ message: 'Please verify your email before logging in.' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    
    // Set httpOnly cookie instead of sending token in response body
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Allow cross-origin in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin',
        isVerified: user.verified,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Email verification controller
export const verifyEmail: RequestHandler = async (req, res) => {
  try {
    const { token } = req.body;
    console.log('Email verification attempt received'); // Debug log
    // 1. Accept token from req.body.token
    // 2. Check if token is present
    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: 'No verification token found.' });
      return;
    }
    // 3. Find user by emailVerificationToken
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      console.log('Invalid verification token provided'); // Debug log
      res.status(400).json({ message: 'Invalid or expired token.' });
      return;
    }
    // 4. If already verified, return a clear message
    if (user.verified) {
      res.status(200).json({ message: 'Email already verified.' });
      return;
    }
    console.log('Email verification successful for user:', user.email.replace(/(.{2}).*(@.*)/, '$1***$2')); // Debug log
    // 5. Set verified, clear token, save
    user.verified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    // 6. Return success message
    res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    // 7. Error handling
    console.error('Email verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

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
    console.error('Change email error:', err);
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
    console.error('Change password error:', err);
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
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });
  res.json({ message: 'Logged out successfully' });
}; 