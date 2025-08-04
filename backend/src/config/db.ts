import mongoose from 'mongoose';
import { CONSTANTS } from './constants.js';
import { logError, logSuccess } from '../utils/logger.js';

const connectDB = async () => {
  try {
    const mongoURI = CONSTANTS.MONGO_URI;
    await mongoose.connect(mongoURI);
    logSuccess('MongoDB connected');
  } catch (error) {
    logError('Error connecting to MongoDB', error as Error);
    process.exit(1);
  }
};

export default connectDB;
