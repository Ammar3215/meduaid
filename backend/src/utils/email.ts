import nodemailer from 'nodemailer';

console.log('Loaded Gmail credentials:', process.env.GMAIL_USER, process.env.GMAIL_PASS ? '✅' : '❌');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

export async function sendVerificationEmail(to: string, token: string) {
  console.log('sendVerificationEmail called with:');
  console.log('To:', to);
  console.log('Token:', token);
  const verificationUrl = `${frontendBaseUrl}/verify-email?token=${token}`;
  console.log('Verification link:', verificationUrl);
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