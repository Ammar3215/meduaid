import { Request, Response, RequestHandler } from 'express';
import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/email';

export const register: RequestHandler = async (req, res) => {
  console.log('Signup route hit');
  try {
    const { name, email, password } = req.body;
    // Step 2: Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
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
    });
    // Log token and user
    console.log('Generated token:', emailVerificationToken);
    console.log('Saved user:', user);
    // Log call to sendVerificationEmail
    console.log('Calling sendVerificationEmail with:', email, emailVerificationToken);
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
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, verified: user.verified } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Email verification controller
export const verifyEmail: RequestHandler = async (req, res) => {
  try {
    const { token } = req.body;
    console.log('Received token for verification:', token); // Debug log
    // 1. Accept token from req.body.token
    // 2. Check if token is present
    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: 'No verification token found.' });
      return;
    }
    // 3. Find user by emailVerificationToken
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      console.log('No user found for token:', token); // Debug log
      res.status(400).json({ message: 'Invalid or expired token.' });
      return;
    }
    // 4. If already verified, return a clear message
    if (user.verified) {
      res.status(200).json({ message: 'Email already verified.' });
      return;
    }
    console.log('User found for token:', user.email); // Debug log
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
      res.status(400).json({ message: 'Email is already in use.' });
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