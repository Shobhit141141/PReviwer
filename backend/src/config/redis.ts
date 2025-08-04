import { createClient } from 'redis';
import { logError, logger } from '../utils/logger';

const redis = createClient({
  url: process.env.NODE_ENV === 'prod' ? process.env.REDIS_URL : 'redis://localhost:6379',
});

let isConnected = false;

redis.on('error', (err) => logError('Redis Client Error', err));
export const connectToRedis = async () => {
  if (!isConnected) {
    try {
      await redis.connect();
      logger(' REDIS ', 'Connected to Redis', 'red');
      isConnected = true;
    } catch (error) {
      if (error instanceof Error) {
        logError('Failed to connect to Redis', error);
      }
    }
  }
};

export const disconnectFromRedis = async () => {
  if (isConnected) {
    try {
      await redis.quit();
      logger(' REDIS ', 'Disconnected from Redis', '#FF5733');
      isConnected = false;
    } catch (error) {
      if (error instanceof Error) {
        logError('Failed to disconnect from Redis', error);
      }
    }
  }
};

export default redis;
