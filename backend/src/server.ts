import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5050;
const MONGO_URI = process.env.MONGO_URI || '';

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set');
  process.exit(1);
}

if (process.env.JWT_SECRET === 'your_jwt_secret_here' || process.env.JWT_SECRET === 'secret') {
  console.error('FATAL ERROR: JWT_SECRET is using default/weak value. Please set a strong, random secret.');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('FATAL ERROR: JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
