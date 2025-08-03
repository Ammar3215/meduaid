import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import submissionsRoutes from './routes/submissions';
import adminRoutes from './routes/admin';
import writerRoutes from './routes/writer';
import osceStationsRoutes from './routes/osceStations';
import path from 'path';

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:1573',
      'https://meduaid.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP for sensitive operations
  message: {
    error: 'Too many failed attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/auth/login', strictAuthLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', strictAuthLimiter);
app.use('/api/auth/reset-password', strictAuthLimiter);
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

app.get('/', (req, res) => {
  res.send('MeduAid QB Portal Backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/writer', writerRoutes);
app.use('/api/osce-stations', osceStationsRoutes);

export default app;
