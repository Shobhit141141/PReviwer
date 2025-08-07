import {
  getRedisCache,
  setRedisCache,
  deleteRedisCache,
  clearRedisCachePattern,
  CACHE_TTL,
} from '../config/redis.js';
import { logger, logError } from '../utils/logger.js';

/**
 * Cache manager utility class for handling common cache operations
 */
export class CacheManager {
  /**
   * Clear all caches for a specific user
   * @param userId - User ID to clear caches for
   * @param username - Username to clear GitHub-related caches for
   */
  static async clearUserCaches(userId: string, username?: string): Promise<void> {
    try {
      const patterns = [
        `user:${userId}`,
        `playground_config:${userId}`,
        `user_pr_reports:${userId}:*`,
        `pr_report:${userId}:*`,
        `pr_reports:${userId}:*`,
      ];

      if (username) {
        patterns.push(
          `github_analytics:${username}`,
          `active_prs:${username}`,
          `weekly_activity:${username}`,
          `repo_stats:${username}`,
          `recent_activity:${username}`,
        );
      }

      // Clear individual keys and patterns
      for (const pattern of patterns) {
        if (pattern.includes('*')) {
          await clearRedisCachePattern(pattern);
        } else {
          await deleteRedisCache(pattern);
        }
      }

      logger(' CACHE ', `Cleared all caches for user: ${userId}`, 'yellow');
    } catch (error) {
      logError(
        'Error clearing user caches',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Clear GitHub-related caches for a user
   * @param username - Username to clear GitHub caches for
   */
  static async clearGitHubCaches(username: string): Promise<void> {
    try {
      const keys = [
        `github_analytics:${username}`,
        `active_prs:${username}`,
        `weekly_activity:${username}`,
        `repo_stats:${username}`,
        `recent_activity:${username}`,
      ];

      await Promise.all(keys.map((key) => deleteRedisCache(key)));
      logger(' CACHE ', `Cleared GitHub caches for user: ${username}`, 'yellow');
    } catch (error) {
      logError(
        'Error clearing GitHub caches',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Clear PR-related caches for a specific PR
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param prNumber - Pull request number
   */
  static async clearPRCaches(owner: string, repo: string, prNumber: string): Promise<void> {
    try {
      const cacheKey = `pr_details:${owner}:${repo}:${prNumber}`;
      await deleteRedisCache(cacheKey);
      logger(' CACHE ', `Cleared PR cache for: ${owner}/${repo}#${prNumber}`, 'yellow');
    } catch (error) {
      logError(
        'Error clearing PR caches',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Clear playground configuration caches for a user
   * @param userId - User ID to clear playground caches for
   */
  static async clearPlaygroundCaches(userId: string): Promise<void> {
    try {
      await deleteRedisCache(`playground_config:${userId}`);
      logger(' CACHE ', `Cleared playground cache for user: ${userId}`, 'yellow');
    } catch (error) {
      logError(
        'Error clearing playground caches',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Warm up cache with frequently accessed data
   * @param userId - User ID
   * @param username - Username for GitHub data
   */
  static async warmUpUserCaches(userId: string, username?: string): Promise<void> {
    try {
      // This would typically be called after login to pre-populate caches
      // with data the user is likely to request immediately
      logger(' CACHE ', `Cache warm-up initiated for user: ${userId}`, 'blue');

      // Note: Actual implementation would call the respective service functions
      // to populate caches, but we'll leave this as a placeholder for now
    } catch (error) {
      logError(
        'Error warming up caches',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Check cache health and statistics
   */
  static async getCacheStats(): Promise<any> {
    try {
      // This would return cache statistics like hit rate, memory usage, etc.
      // Implementation depends on Redis configuration and monitoring needs
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logError(
        'Error getting cache stats',
        error instanceof Error ? error : new Error(String(error)),
      );
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate cache key with consistent formatting
   * @param prefix - Cache key prefix
   * @param identifiers - Array of identifiers to include in the key
   * @returns Formatted cache key
   */
  static generateCacheKey(prefix: string, ...identifiers: (string | number)[]): string {
    return `${prefix}:${identifiers.join(':')}`;
  }

  /**
   * Cache with automatic TTL based on data type
   * @param key - Cache key
   * @param data - Data to cache
   * @param cacheType - Type of cache (user, github, pr, config, static)
   */
  static async cacheWithAutoTTL(
    key: string,
    data: any,
    cacheType: 'user' | 'github' | 'pr' | 'config' | 'static' | 'analysis',
  ): Promise<void> {
    const ttlMap = {
      user: CACHE_TTL.SHORT * 2, // 10 minutes - user data changes moderately
      github: CACHE_TTL.MEDIUM, // 15 minutes - GitHub data changes frequently
      pr: CACHE_TTL.MEDIUM, // 15 minutes - PR data changes frequently
      config: CACHE_TTL.LONG, // 1 hour - configurations change rarely
      static: CACHE_TTL.VERY_LONG, // 24 hours - static data never changes
      analysis: CACHE_TTL.SHORT, // 5 minutes - analysis results change with updates
    };

    const ttl = ttlMap[cacheType];
    await setRedisCache(key, JSON.stringify(data), ttl);
  }

  /**
   * Get cached data with automatic JSON parsing
   * @param key - Cache key
   * @returns Parsed data or null if not found
   */
  static async getCachedData<T = any>(key: string): Promise<T | null> {
    try {
      const cachedData = await getRedisCache(key);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      logError(
        'Error parsing cached data',
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }
}

export default CacheManager;
