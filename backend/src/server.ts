import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';

import app from './app';

// Add error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

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

console.log('Attempting to connect to MongoDB...');

async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully');
    
    console.log(`Starting server on port ${PORT}...`);
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    server.on('error', (error) => {
      console.error('Server failed to start:', error);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

connectToMongoDB();
