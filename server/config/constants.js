import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 8000,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  geminiApiKey: process.env.GEMINI_API_KEY,
  dbUrl: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET, 
  algorithm: process.env.ALGORITHM,
  encryptionKey: process.env.ENCRYPTION_KEY,
};

export default config;
