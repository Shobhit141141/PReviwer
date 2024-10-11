import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import config from '../config/constants.js';

dotenv.config();
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export const generateAIResponse = async prompt => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
};
