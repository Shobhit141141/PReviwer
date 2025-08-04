import mongoose from 'mongoose';
import { CONSTANTS } from './constants.js';
import { logError, logSuccess } from '../utils/logger.js';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const mongoURI = CONSTANTS.MONGO_URI;

    const db = await mongoose.connect(mongoURI, {
      bufferCommands: false,
    });

    isConnected = db.connections[0].readyState === 1;

    if (isConnected) {
      logSuccess('MongoDB connected');
    } else {
      logError('MongoDB not connected');
    }
  } catch (error) {
    logError('Error connecting to MongoDB', error as Error);
    throw error;
  }
};

export default connectDB;
