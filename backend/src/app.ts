import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import submissionsRoutes from './routes/submissions';
import adminRoutes from './routes/admin';
import writerRoutes from './routes/writer';
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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.send('MeduAid QB Portal Backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/writer', writerRoutes);

export default app;
