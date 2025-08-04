import { Octokit } from '@octokit/rest';
import { Request, Response } from 'express';
import User from '../models/user.model.js';
import redis, { connectToRedis } from '../config/redis.js';
import { logError, logger } from '../utils/logger.js';

export const getUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const userId = req.user.id;
    const cacheKey = `user:${userId}`;

    try {
      // Try to get user data from cache
      const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
        logger(' CACHE ', `User data served from cache for ID: ${userId}`, 'green');
        res.json(JSON.parse(cachedUser));
        return;
      }
    } catch (cacheError) {
      logError(
        'Redis cache read error for getUser',
        cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
      );
    }

    // If not in cache, fetch from database
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    try {
      // Cache the user data for 10 minutes (600 seconds)
      await redis.setEx(cacheKey, 600, JSON.stringify(user));
      logger(' CACHE ', `User data cached for ID: ${userId}`, 'blue');
    } catch (cacheError) {
      logError(
        'Redis cache write error for getUser',
        cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
      );
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};
/** Get GitHub analytics for the authenticated user
 * /user/analytics - PRIVATE
 * This function fetches the user's profile data from GitHub.
 * @param req - Request object containing user access token and username
 * @param res - Response object to send the user profile data
 * @return { username, name, avatar, bio, followers, following, publicRepos, joinedOn }
 */
export const getGithubAnalytics = async (req: Request, res: Response) => {
  const accessToken = req.accessToken;
  const username = req.user?.username;

  if (!accessToken || !username) {
    res.status(400).json({ error: 'Missing access token or username' });
    return;
  }

  const cacheKey = `github_analytics:${username}`;

  try {
    // Try to get analytics data from cache
    const cachedAnalytics = await redis.get(cacheKey);
    if (cachedAnalytics) {
      logger(' CACHE ', `GitHub analytics served from cache for user: ${username}`, 'green');
      res.status(200).json(JSON.parse(cachedAnalytics));
      return;
    }
  } catch (cacheError) {
    logError(
      'Redis cache read error for getGithubAnalytics',
      cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
    );
  }

  try {
    const octokit = new Octokit({ auth: accessToken });

    const { data: user } = await octokit.rest.users.getByUsername({ username });

    const analyticsData = {
      username: user.login,
      name: user.name,
      avatar: user.avatar_url,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      joinedOn: user.created_at,
    };

    try {
      // Cache the analytics data for 15 minutes (900 seconds)
      await redis.setEx(cacheKey, 900, JSON.stringify(analyticsData));
      logger(' CACHE ', `GitHub analytics cached for user: ${username}`, 'blue');
    } catch (cacheError) {
      logError(
        'Redis cache write error for getGithubAnalytics',
        cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
      );
    }

    res.status(200).json(analyticsData);
  } catch (err: any) {
    res.status(500).json({ error: 'GitHub API error', details: err.message });
  }
};

/** Clear user cache
 * Helper function to clear cached user data
 * @param userId - User ID to clear cache for
 * @param username - Username to clear GitHub analytics cache for
 */
export const clearUserCache = async (userId?: string, username?: string) => {
  try {
    const keysToDelete: string[] = [];

    if (userId) {
      keysToDelete.push(`user:${userId}`);
    }

    if (username) {
      keysToDelete.push(`github_analytics:${username}`);
    }

    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
      logger(' CACHE ', `Cleared cache for keys: ${keysToDelete.join(', ')}`, 'yellow');
    }
  } catch (error) {
    logError(
      'Error clearing user cache',
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};
