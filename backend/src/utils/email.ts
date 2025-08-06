import nodemailer from 'nodemailer';

console.log('Email service initialized:', process.env.GMAIL_USER ? '✅' : '❌');

let transporter: nodemailer.Transporter;

try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
  console.log('Email transporter created successfully');
} catch (error) {
  console.error('Failed to create email transporter:', error);
  process.exit(1);
}

const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

export async function sendVerificationEmail(to: string, token: string) {
  console.log('Sending verification email to:', to.replace(/(.{2}).*(@.*)/, '$1***$2'));
  const verificationUrl = `${frontendBaseUrl}/verify-email?token=${token}`;
  const info = await transporter.sendMail({
    from: 'no-reply@meduaid.com',
    to,
    subject: 'Verify your email',
    html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.<br/><br/>Or copy and paste this link in your browser:<br/>${verificationUrl}</p>`
  }).catch((err) => {
    console.error('Email send failed:', err);
  });
  return info;
}

export async function sendPasswordResetEmail(to: string, token: string) {
  console.log('Sending password reset email to:', to.replace(/(.{2}).*(@.*)/, '$1***$2'));
  const resetUrl = `${frontendBaseUrl}/reset-password?token=${token}`;
  const info = await transporter.sendMail({
    from: 'no-reply@meduaid.com',
    to,
    subject: 'Reset your password',
    html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password.<br/><br/>Or copy and paste this link in your browser:<br/>${resetUrl}</p>`
  }).catch((err) => {
    console.error('Password reset email send failed:', err);
  });
  return info;
} 