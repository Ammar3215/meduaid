import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import submissionsRoutes from './routes/submissions';
import adminRoutes from './routes/admin';
import writerRoutes from './routes/writer';
import osceStationsRoutes from './routes/osceStations';
import { globalErrorHandler, notFoundHandler, timeoutHandler } from './middleware/errorHandler';
import path from 'path';

const app = express();

// Trust proxy for Render deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

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
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  })
);

// Add mobile-friendly headers
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased from 10 to 20 attempts per window per IP
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased from 5 to 10 attempts per window per IP for sensitive operations
  message: {
    error: 'Too many failed attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per window per IP
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

// Apply timeout handler for mobile devices
app.use(timeoutHandler(30000)); // 30 seconds timeout

app.get('/', (req, res) => {
  res.send('MeduAid QB Portal Backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/writer', writerRoutes);
app.use('/api/osce-stations', osceStationsRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
