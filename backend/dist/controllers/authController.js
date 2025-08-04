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
exports.logout = exports.resetPassword = exports.forgotPassword = exports.updateProfile = exports.changePassword = exports.changeEmail = exports.verifyEmail = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const email_1 = require("../utils/email");
const errorHandler_1 = require("../utils/errorHandler");
exports.register = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        throw new errorHandler_1.AppError('Name, email, and password are required', 400);
    }
    if (password.length < 6) {
        throw new errorHandler_1.AppError('Password must be at least 6 characters long', 400);
    }
    // Check if user exists
    const existingUser = yield User_1.default.findOne({ email });
    if (existingUser) {
        throw new errorHandler_1.AppError('Registration failed. Please check your details and try again.', 400);
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
    // Registration initiated successfully
    // Send verification email
    yield (0, email_1.sendVerificationEmail)(email, emailVerificationToken);
    res.status(201).json({
        success: true,
        message: 'Verification email sent. Please check your inbox.'
    });
}));
exports.login = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new errorHandler_1.AppError('Email and password are required', 400);
    }
    const user = yield User_1.default.findOne({ email });
    if (!user) {
        throw new errorHandler_1.AppError('Invalid credentials', 400);
    }
    if (!user.verified) {
        throw new errorHandler_1.AppError('Please verify your email before logging in.', 403);
    }
    const isMatch = yield bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new errorHandler_1.AppError('Invalid credentials', 400);
    }
    const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Set httpOnly cookie instead of sending token in response body
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Allow cross-origin in production
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    res.json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isAdmin: user.role === 'admin',
            isVerified: user.verified,
        }
    });
}));
// Email verification controller
exports.verifyEmail = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
        throw new errorHandler_1.AppError('No verification token found.', 400);
    }
    const user = yield User_1.default.findOne({ emailVerificationToken: token });
    if (!user) {
        throw new errorHandler_1.AppError('Invalid or expired token.', 400);
    }
    if (user.verified) {
        return res.status(200).json({
            success: true,
            message: 'Email already verified.'
        });
    }
    user.verified = true;
    user.emailVerificationToken = undefined;
    yield user.save();
    res.json({
        success: true,
        message: 'Email verified successfully.'
    });
}));
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
            // SECURITY FIX: Don't reveal if email exists, use generic message
            res.status(400).json({ message: 'Email update failed. Please try a different email.' });
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
        // Change email error occurred
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
        // Change password error occurred
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
// Logout endpoint to clear httpOnly cookie
const logout = (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });
    res.json({ message: 'Logged out successfully' });
};
exports.logout = logout;
