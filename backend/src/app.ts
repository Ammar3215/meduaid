import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import submissionsRoutes from './routes/submissions';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('MeduAid QB Portal Backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionsRoutes);

export default app;
