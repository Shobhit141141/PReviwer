import { Request, Response } from 'express';
import { clearRedisCachePattern, deleteRedisCache, connectToRedis } from '../config/redis.js';
import { logError, logger } from '../utils/logger.js';

/**
 * Clear analysis and PR data caches for the authenticated user
 * POST /cache/clear-analysis-data - PRIVATE
 * This function clears all analysis-related and PR-related caches but preserves user data caches
 */
export const clearAnalysisAndPRData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const username = req.user?.username;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await connectToRedis();

    // Define cache patterns to clear (excluding user data)
    const cachePatterns = [
      // GitHub-related caches
      ...(username
        ? [
            `github_analytics:${username}`,
            `active_prs:${username}`,
            `weekly_activity:${username}`,
            `repo_stats:${username}`,
            `recent_activity:${username}`,
          ]
        : []),

      // PR report caches
      `user_pr_reports:${userId}:*`,
      `pr_reports:${userId}:*`,
      `pr_report:${userId}:*`,

      // PR details caches (pattern match for any PR the user might have accessed)
      `pr_details:*`,

      // Analysis-related caches
      `test_prompt:*`,
      `template_preview:*`,

      // Refresh token cache
      `refresh_token:*`,
    ];

    let clearedCount = 0;

    // Clear individual keys and patterns
    for (const pattern of cachePatterns) {
      try {
        if (pattern.includes('*')) {
          const cleared = await clearRedisCachePattern(pattern);
          clearedCount += cleared;
        } else {
          const cleared = await deleteRedisCache(pattern);
          if (cleared) clearedCount++;
        }
      } catch (error) {
        logError(
          `Error clearing cache pattern ${pattern}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }

    logger(' CACHE ', `Cleared ${clearedCount} cache entries for user refresh`, 'yellow');

    res.status(200).json({
      message: 'Analysis and PR data caches cleared successfully',
      clearedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(
      'Error clearing analysis and PR data caches',
      error instanceof Error ? error : new Error(String(error)),
    );
    res.status(500).json({
      error: 'Failed to clear caches',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Clear specific PR cache
 * DELETE /cache/pr/:owner/:repo/:prNumber - PRIVATE
 * This function clears cache for a specific PR
 */
export const clearSpecificPRCache = async (req: Request, res: Response) => {
  try {
    const { owner, repo, prNumber } = req.params;

    if (!owner || !repo || !prNumber) {
      res.status(400).json({ error: 'Missing required parameters: owner, repo, or prNumber' });
      return;
    }

    await connectToRedis();

    const cacheKey = `pr_details:${owner}:${repo}:${prNumber}`;
    const cleared = await deleteRedisCache(cacheKey);

    if (cleared) {
      logger(' CACHE ', `Cleared PR cache for: ${owner}/${repo}#${prNumber}`, 'yellow');
      res.status(200).json({
        message: `PR cache cleared for ${owner}/${repo}#${prNumber}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({
        message: `No cache found for PR ${owner}/${repo}#${prNumber}`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logError(
      'Error clearing specific PR cache',
      error instanceof Error ? error : new Error(String(error)),
    );
    res.status(500).json({
      error: 'Failed to clear PR cache',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get cache statistics
 * GET /cache/stats - PRIVATE
 * This function returns cache statistics and health information
 */
export const getCacheStats = async (req: Request, res: Response) => {
  try {
    await connectToRedis();

    // This is a basic implementation - in production you might want more detailed stats
    const stats = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Cache system is operational',
    };

    res.status(200).json(stats);
  } catch (error) {
    logError(
      'Error getting cache stats',
      error instanceof Error ? error : new Error(String(error)),
    );
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
