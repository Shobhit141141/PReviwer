import { Request, Response, NextFunction } from 'express';
import CacheManager from '../helpers/cacheManager.js';
import { deleteRedisCache, clearRedisCachePattern } from '../config/redis.js';
import { logger, logError } from '../utils/logger.js';

/**
 * Middleware to automatically clear relevant caches when data is modified
 */
export class CacheInvalidationMiddleware {
  /**
   * Clear user-related caches after user data modification
   */
  static clearUserCacheOnModification() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;

      res.send = function (data: any) {
        // Only clear cache on successful operations (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const userId = req.user?.id;
          const username = req.user?.username;

          if (userId || username) {
            // Clear caches asynchronously to not block response
            setImmediate(async () => {
              try {
                if (userId) {
                  await CacheManager.clearUserCaches(userId, username);
                }
              } catch (error) {
                logError(
                  'Error clearing user cache in middleware',
                  error instanceof Error ? error : new Error(String(error)),
                );
              }
            });
          }
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Clear GitHub-related caches after GitHub data modification
   */
  static clearGitHubCacheOnModification() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;

      res.send = function (data: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const username = req.user?.username;

          if (username) {
            setImmediate(async () => {
              try {
                await CacheManager.clearGitHubCaches(username);
              } catch (error) {
                logError(
                  'Error clearing GitHub cache in middleware',
                  error instanceof Error ? error : new Error(String(error)),
                );
              }
            });
          }
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Clear PR-related caches after PR data modification
   */
  static clearPRCacheOnModification() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;

      res.send = function (data: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const { owner, repo, prNumber } = req.params;

          if (owner && repo && prNumber) {
            setImmediate(async () => {
              try {
                await CacheManager.clearPRCaches(owner, repo, prNumber);
              } catch (error) {
                logError(
                  'Error clearing PR cache in middleware',
                  error instanceof Error ? error : new Error(String(error)),
                );
              }
            });
          }
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Clear playground configuration caches after config modification
   */
  static clearPlaygroundCacheOnModification() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;

      res.send = function (data: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const userId = req.user?.id;

          if (userId) {
            setImmediate(async () => {
              try {
                await CacheManager.clearPlaygroundCaches(userId);
              } catch (error) {
                logError(
                  'Error clearing playground cache in middleware',
                  error instanceof Error ? error : new Error(String(error)),
                );
              }
            });
          }
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Generic cache clearing middleware that can be configured for specific cache patterns
   */
  static clearCustomCache(cacheKeyGenerator: (req: Request) => string | string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;

      res.send = function (data: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setImmediate(async () => {
            try {
              const cacheKeys = cacheKeyGenerator(req);
              const keys = Array.isArray(cacheKeys) ? cacheKeys : [cacheKeys];

              await Promise.all(
                keys.map((key) => {
                  if (key.includes('*')) {
                    return clearRedisCachePattern(key);
                  } else {
                    return deleteRedisCache(key);
                  }
                }),
              );

              logger(' CACHE ', `Cleared custom cache keys: ${keys.join(', ')}`, 'yellow');
            } catch (error) {
              logError(
                'Error clearing custom cache in middleware',
                error instanceof Error ? error : new Error(String(error)),
              );
            }
          });
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }
}

/**
 * Cache warming middleware to preload frequently accessed data
 */
export class CacheWarmingMiddleware {
  /**
   * Warm up user caches after successful login
   */
  static warmUserCacheOnLogin() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;

      res.send = function (data: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const userId = req.user?.id;
          const username = req.user?.username;

          if (userId) {
            setImmediate(async () => {
              try {
                await CacheManager.warmUpUserCaches(userId, username);
              } catch (error) {
                logError(
                  'Error warming cache in middleware',
                  error instanceof Error ? error : new Error(String(error)),
                );
              }
            });
          }
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }
}

export default {
  CacheInvalidationMiddleware,
  CacheWarmingMiddleware,
};
