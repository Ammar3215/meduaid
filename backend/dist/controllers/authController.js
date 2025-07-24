"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.updateProfile = exports.changePassword = exports.changeEmail = exports.verifyEmail = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const email_1 = require("../utils/email");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Signup route hit');
    try {
        const { name, email, password } = req.body;
        // Step 2: Check if user exists
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // Step 3: Generate email verification token
        const emailVerificationToken = crypto_1.default.randomBytes(32).toString('hex');
        // Step 4: Hash password and save user
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield User_1.default.create({
            name,
            email,
            password: hashedPassword,
            emailVerificationToken,
            verified: false,
            role: 'writer',
        });
        // Log token and user
        console.log('Generated token:', emailVerificationToken);
        console.log('Saved user:', user);
        // Log call to sendVerificationEmail
        console.log('Calling sendVerificationEmail with:', email, emailVerificationToken);
        // Send verification email
        yield (0, email_1.sendVerificationEmail)(email, emailVerificationToken);
        res.status(201).json({ message: 'Verification email sent. Please check your inbox.' });
    }
    catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        if (!user.verified) {
            res.status(403).json({ message: 'Please verify your email before logging in.' });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.role === 'admin',
                isVerified: user.verified,
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.login = login;
// Email verification controller
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield User_1.default.findOne({ emailVerificationToken: token });
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
        yield user.save();
        // 6. Return success message
        res.json({ message: 'Email verified successfully.' });
    }
    catch (err) {
        // 7. Error handling
        console.error('Email verification error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.verifyEmail = verifyEmail;
// Change Email
const changeEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { newEmail } = req.body;
        if (!newEmail || typeof newEmail !== 'string' || !newEmail.includes('@')) {
            res.status(400).json({ message: 'Please provide a valid new email.' });
            return;
        }
        // Check if email is already in use
        const existing = yield User_1.default.findOne({ email: newEmail });
        if (existing) {
            res.status(400).json({ message: 'Email is already in use.' });
            return;
        }
        const user = yield User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        user.email = newEmail;
        user.verified = false; // Require re-verification if you want
        yield user.save();
        // Optionally, sendVerificationEmail(newEmail, ...)
        res.json({ message: 'Email updated successfully.' });
    }
    catch (err) {
        console.error('Change email error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.changeEmail = changeEmail;
// Change Password
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'Current and new password are required.' });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ message: 'New password must be at least 6 characters.' });
            return;
        }
        const user = yield User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Current password is incorrect.' });
            return;
        }
        user.password = yield bcryptjs_1.default.hash(newPassword, 10);
        yield user.save();
        res.json({ message: 'Password updated successfully.' });
    }
    catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.changePassword = changePassword;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { name, email } = req.body;
        const user = yield User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        user.name = name || user.name;
        user.email = email || user.email;
        yield user.save();
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateProfile = updateProfile;
// Forgot Password
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Email is required.' });
            return;
        }
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            // For security, do not reveal if user exists
            res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
            return;
        }
        const token = crypto_1.default.randomBytes(32).toString('hex');
        user.passwordResetToken = token;
        user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
        yield user.save();
        yield (0, email_1.sendPasswordResetEmail)(email, token);
        res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
        return;
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
        return;
    }
});
exports.forgotPassword = forgotPassword;
// Reset Password
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            res.status(400).json({ message: 'Token and new password are required.' });
            return;
        }
        const user = yield User_1.default.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
        if (!user) {
            res.status(400).json({ message: 'Invalid or expired token.' });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters.' });
            return;
        }
        user.password = yield bcryptjs_1.default.hash(newPassword, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        yield user.save();
        res.json({ message: 'Password reset successful.' });
        return;
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
        return;
    }
});
exports.resetPassword = resetPassword;
