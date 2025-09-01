import axios from 'axios';
import { Request, Response } from 'express';
import User from '../models/user.model.js';
import { decrypt, encrypt } from '../utils/encrypt_decrypt.js';
import { CONSTANTS } from '../config/constants.js';
import { logError, logInfo } from '../utils/logger.js';
import { getRedisCache, setRedisCache, CACHE_TTL } from '../config/redis.js';
import Playground from '../models/playground.model.js';

const CLIENT_ID = CONSTANTS.GITHUB_CLIENT_ID;
const CLIENT_SECRET = CONSTANTS.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = CONSTANTS.REDIRECT_URI;
const FRONTEND_URL = CONSTANTS.FRONTEND_URL;
const GITHUB_APP_NAME = CONSTANTS.GITHUB_APP_NAME;
/** * GitHub OAuth login handler
 * /github/login - PUBLIC
 * This function redirects the user to GitHub's OAuth login page.
 * @param req - Request object
 * @param res - Response object to redirect to GitHub login
 * @return { void } - Redirects to GitHub OAuth login page
 */
export const githubLogin = (_req: Request, res: Response) => {
  const scopes = ['read:user', 'user:email', 'repo'].join(' ');
  const githubAppAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&prompt=consent`;

  res.redirect(githubAppAuthUrl);
};

/** * GitHub OAuth callback handler
 * /github/callback - PUBLIC
 * This function handles the OAuth callback from GitHub, exchanges the code for tokens,
 * and redirects to the frontend with user data.
 * @param req - Request object containing the code from GitHub
 * @param res - Response object to redirect to the frontend with user data
 */
export const githubCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    const errorUrl = `${FRONTEND_URL}?error=Code not found`;
    res.redirect(errorUrl);
    return;
  }

  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      },
      {
        headers: { Accept: 'application/json' },
      },
    );

    const { access_token, refresh_token, expires_in, refresh_token_expires_in } = tokenRes.data;

    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData: {
      name: any;
      username: any;
      avatar: any;
      bio: any;
      githubId: any;
      github_refresh_token: string;
      email?: string;
    } = {
      name: userRes.data.name,
      username: userRes.data.login,
      avatar: userRes.data.avatar_url,
      bio: userRes.data.bio,
      githubId: userRes.data.id.toString(),
      github_refresh_token: encrypt(refresh_token),
    };

    let email;
    let user = await User.findOne({
      username: userRes.data.login,
      githubId: userRes.data.id.toString(),
    });
    let isFirstTime = false;

    if (!user) {
      if (userRes.data.email && userRes.data.email.trim() !== '') {
        userData.email = userRes.data.email.trim();
      }
      user = await User.create(userData);
      isFirstTime = true;
    } else {
      user = await User.findOneAndUpdate(
        { username: userRes.data.login, githubId: userRes.data.id.toString() },
        userData,
        { new: true },
      );
    }


    try {
      await setRedisCache(`user:${user?._id}`, JSON.stringify(user), CACHE_TTL.LONG);
    } catch (cacheError) {
      logError(
        'Error caching user data after GitHub login',
        cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
      );
    }

    if (isFirstTime && user?._id) {

      logInfo(`Creating default playground for new user ${user.username} and ${user._id}`);
      const defaultPlaygroundConfig = {
        user: user._id,
        system_prompt: 'You are a helpful assistant.',
        secondary_system_prompt: '',
        llm_model: 'gpt-4o-mini',
        llm_provider: 'openai',
        llm_api_key: '',
        temperature: 0.7,
        max_tokens: 1000,
        isConnectionValid: false,
      };

      await Playground.create(defaultPlaygroundConfig);
    }

    if (isFirstTime) {
      const installationUrl = `https://github.com/apps/${GITHUB_APP_NAME}/installations/new`;
      return res.redirect(installationUrl);
    }

    const userDataEncoded = encodeURIComponent(JSON.stringify(user));
    const successUrl = `${FRONTEND_URL}?user=${userDataEncoded}&token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}&refresh_token_expires_in=${refresh_token_expires_in}&isFirstTime=${isFirstTime}`;
    res.redirect(successUrl);
  } catch (err: any) {
    logError('GitHub OAuth callback error:', err);
    const errorUrl = `${FRONTEND_URL}?error=GitHub Auth failed`;
    res.redirect(errorUrl);
  }
};

/** * Get weekly activity for a user
 * /github/weekly-activity - PRIVATE
 * This function fetches the user's contributions, pull requests, and repositories created in the last week.
 * @param req - Request object containing user access token and username
 * @param res - Response object to send the weekly activity data
 * @return { dailySummary: Array of daily activity summaries for the last week }
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.headers['x-refresh-token'];

  if (!refreshToken) {
    res.status(401).json({ error: 'Refresh token missing' });
    return;
  }

  const cacheKey = `refresh_token:${refreshToken}`;

  try {
    // Check cache first to prevent unnecessary database queries
    const cachedResult = await getRedisCache(cacheKey);
    if (cachedResult) {
      res.json(JSON.parse(cachedResult));
      return;
    }

    // Find all users with a non-null github_refresh_token and compare decrypted tokens
    const users = await User.find({ github_refresh_token: { $exists: true, $ne: null } });
    let user = null;
    for (const u of users) {
      if (u.github_refresh_token && decrypt(u.github_refresh_token) === refreshToken) {
        user = u;
        break;
      }
    }

    if (!user) {
      res.status(403).json({ error: 'Invalid refresh token' });
      return;
    }

    // Request new tokens from GitHub
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      },
      {
        headers: { Accept: 'application/json' },
      },
    );

    const { access_token, refresh_token: newRefreshToken } = response.data;

    if (!access_token) {
      res.status(400).json({ error: 'GitHub did not return an access token' });
      return;
    }

    const result = { access_token, refresh_token: newRefreshToken };

    // Cache the result for a short time (5 minutes) to handle rapid successive calls
    await setRedisCache(cacheKey, JSON.stringify(result), CACHE_TTL.SHORT);

    res.json(result);
  } catch (err: any) {
    logError('Error refreshing GitHub token:', err);

    const msg = err?.response?.data?.error_description || 'Token refresh failed';
    if (msg.includes('expired') || msg.includes('invalid')) {
      res.status(403).json({ error: 'Session expired, please log in again' });
    } else {
      res.status(400).json({ error: msg });
    }
  }
};

/** * Disconnect the GitHub app from the user's account
 * /github/disconnect - PRIVATE
 * This function revokes the access token and disconnects the app from GitHub.
 * @param req - Request object containing user access token
 * @param res - Response object to send the disconnect status
 * @return { message: string } - Success message if the app is disconnected
 */
export const disconnectFromGitHub = async (req: Request, res: Response) => {
  const accessToken = req.accessToken;
  try {
    if (accessToken) {
      const response = await axios.delete(
        `https://api.github.com/applications/${CLIENT_ID}/token`,
        {
          auth: {
            username: CLIENT_ID,
            password: CLIENT_SECRET,
          },
          data: {
            access_token: accessToken,
          },
          headers: {
            Accept: 'application/vnd.github+json',
          },
        },
      );

      if (response.status === 204) {
        res.status(200).json({ message: 'App disconnected from GitHub successfully.' });
      } else {
        res.status(response.status).json({ error: 'Failed to disconnect app from GitHub.' });
      }
    } else {
      res.status(400).json({ error: 'No access token found for the user.' });
    }
  } catch (error: any) {
    logError('Error disconnecting from GitHub:', error.message);
    res.status(500).send('Failed to disconnect from GitHub');
  }
};

/**
 * Get recent activity controller
 * /github/recent-activity - PRIVATE
 * This controller handles the request to get user's recent GitHub activity.
 * @param req - Request object containing user access token and username
 * @param res - Response object to send the recent activity data
 */
export const getRecentActivityController = async (req: Request, res: Response) => {
  try {
    // Import the service function dynamically to avoid circular imports
    const { getRecentActivity } = await import('../services/github.service.js');
    await getRecentActivity(req, res);
  } catch (error: any) {
    logError('Error in recent activity controller:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity', details: error.message });
  }
};

/**
 * Get PR details controller
 * /github/pr-details/:owner/:repo/:prNumber - PRIVATE
 * This controller handles the request to get detailed information about a specific PR.
 * @param req - Request object containing user access token and PR parameters
 * @param res - Response object to send the PR details data
 */
export const getPRDetailsController = async (req: Request, res: Response) => {
  try {
    // Import the service function dynamically to avoid circular imports
    const { getPRDetails } = await import('../services/github.service.js');
    await getPRDetails(req, res);
  } catch (error: any) {
    logError('Error in PR details controller:', error);
    res.status(500).json({ error: 'Failed to fetch PR details', details: error.message });
  }
};


export const commentOnPRController = async (req: Request, res: Response) => {
  try {
    // Import the service function dynamically to avoid circular imports
    const { createComment } = await import('../services/github.service.js');
    await createComment(req, res);
  } catch (error: any) {
    logError('Error in comment on PR controller:', error);
    res.status(500).json({ error: 'Failed to comment on PR', details: error.message });
  }
};