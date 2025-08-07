import { createClient } from 'redis';
import { logError, logger } from '../utils/logger.js';
import { CONSTANTS } from './constants.js';

const redis = createClient({
  url: process.env.NODE_ENV === 'prod' ? CONSTANTS.REDIS_URI : 'redis://localhost:6379',
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

export const clearRedisCacheByKey = async (keyPattern: string) => {
  try {
    await connectToRedis();
    const keys = await redis.keys(keyPattern);
    if (keys.length > 0) {
      await redis.del(keys);
      logger(' REDIS ', `Cleared cache for keys matching: ${keyPattern}`, '#FF5733');
    } else {
      logger(' REDIS ', `No keys found matching: ${keyPattern}`, '#FF5733');
    }
  } catch (error) {
    if (error instanceof Error) {
      logError('Failed to clear Redis cache', error);
    }
  }
};
export const getRedisCache = async (key: string): Promise<string | null> => {
  try {
    const value = await redis.get(key);
    if (value) {
      logger(' REDIS ', `Cache hit for key: ${key}`, 'green');
    }
    return value;
  } catch (error) {
    if (error instanceof Error) {
      logError('Failed to get Redis cache', error);
    }
    return null;
  }
};

export const setRedisCache = async (
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<boolean> => {
  try {
    await connectToRedis();
    if (ttlSeconds) {
      await redis.setEx(key, ttlSeconds, value);
    } else {
      await redis.set(key, value);
    }
    logger(' REDIS ', `Cache set for key: ${key} (TTL: ${ttlSeconds || 'none'})`, 'blue');
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logError('Failed to set Redis cache', error);
    }
    return false;
  }
};

export const deleteRedisCache = async (key: string): Promise<boolean> => {
  try {
    await connectToRedis();
    const result = await redis.del(key);
    if (result > 0) {
      logger(' REDIS ', `Cache deleted for key: ${key}`, 'yellow');
    }
    return result > 0;
  } catch (error) {
    if (error instanceof Error) {
      logError('Failed to delete Redis cache', error);
    }
    return false;
  }
};

export const clearRedisCachePattern = async (pattern: string): Promise<number> => {
  try {
    await connectToRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      const result = await redis.del(keys);
      logger(' REDIS ', `Cleared ${result} cache keys matching pattern: ${pattern}`, 'yellow');
      return result;
    }
    return 0;
  } catch (error) {
    if (error instanceof Error) {
      logError('Failed to clear Redis cache pattern', error);
    }
    return 0;
  }
};

// Cache time constants (in seconds)
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes - for frequently changing data
  MEDIUM: 900, // 15 minutes - for moderately changing data
  LONG: 3600, // 1 hour - for rarely changing data
  VERY_LONG: 86400, // 24 hours - for static or very rarely changing data
} as const;

export default redis;
