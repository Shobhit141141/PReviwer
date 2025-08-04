import dotenv from 'dotenv';
dotenv.config();
const requiredEnvVars = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.log(process.env[key]);
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
});

export const CONSTANTS = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/previewer_v15',
  REDIS_URI: process.env.REDIS_URI || 'redis://localhost:6379',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  PORT: process.env.PORT || 5000,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your_default_encryption_key',

  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || 'your_github_client_id',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || 'your_github_client_secret',
  REDIRECT_URI: process.env.REDIRECT_URI || 'http://localhost:5000/api/github/callback',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',
  GITHUB_API_URL: 'https://api.github.com',
};
