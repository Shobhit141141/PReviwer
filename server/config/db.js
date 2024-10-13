import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from './constants.js';

dotenv.config();

const connectDB = async () => {
  try {
    const uri = config.dbUrl || 'mongodb://localhost:27017/previewer';

    await mongoose.connect(uri, {});

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
