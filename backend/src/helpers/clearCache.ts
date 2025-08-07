import readline from 'readline';
import { clearRedisCacheByKey, connectToRedis } from '../config/redis.js';

export const clearCacheForKey = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the cache key to clear: ', (key) => {
    rl.question(
      `Are you sure you want to clear the cache for key "${key}"? (y/N): `,
      async (confirm) => {
        if (confirm.toLowerCase() === 'y') {
          try {
            await connectToRedis();
            await clearRedisCacheByKey(key);
            console.log(`✅ Cache cleared for key: ${key}`);
          } catch (error) {
            console.error(`❌ Failed to clear cache for key: ${key}`, error);
          }
        } else {
          console.log('Operation cancelled.');
        }
        rl.close();
      },
    );
  });
};

clearCacheForKey();
