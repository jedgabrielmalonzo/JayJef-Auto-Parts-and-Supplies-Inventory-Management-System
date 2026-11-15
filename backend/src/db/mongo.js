import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // Also check current working directory for serverless environments

let cachedPromise = null;

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined on the host! Please add MONGODB_URI in your hosting dashboard.');
  }

  cachedPromise = mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
  }).then((mongooseInstance) => {
    console.log('Successfully connected to MongoDB Atlas');
    return mongooseInstance;
  }).catch((err) => {
    cachedPromise = null;
    console.error('Failed to connect to MongoDB:', err.message);
    throw err;
  });

  return cachedPromise;
}

export { mongoose };
