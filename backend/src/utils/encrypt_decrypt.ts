// encrypt the data using AES-256-CBC
import crypto from 'crypto';
import { CONSTANTS } from '../config/constants';
import { logError } from './logger';
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(CONSTANTS.ENCRYPTION_KEY, 'salt', 32);
const iv = crypto.randomBytes(16);

export const encrypt = (text: string): string => {
  try {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    logError('Encryption failed', error as Error);
    throw new Error('Encryption failed');
  }
};

export const decrypt = (encrypted: string): string => {
  try {
    const [ivHex, encryptedText] = encrypted.split(':');
    const ivBuffer = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logError('Decryption failed', error as Error);
    throw new Error('Decryption failed');
  }
};

export const isEncrypted = (text: string): boolean => {
  return text.includes(':');
};
export const isDecrypted = (text: string): boolean => {
  try {
    decrypt(text);
    return true;
  } catch {
    return false;
  }
};