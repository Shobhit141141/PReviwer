import axios from 'axios';
import { Request, Response } from 'express';
import User from '../models/user.model';
import { decrypt, encrypt } from '../utils/encrypt_decrypt';
import { CONSTANTS } from '../config/constants';
import { logDebug, logError } from '../utils/logger';

const CLIENT_ID = CONSTANTS.GITHUB_CLIENT_ID;
const CLIENT_SECRET = CONSTANTS.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = CONSTANTS.REDIRECT_URI;
const FRONTEND_URL = CONSTANTS.FRONTEND_URL;

export const githubLogin = (_req: Request, res: Response): void => {
  const githubAppAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${REDIRECT_URI}` +
    `&scope=read:user%20user:email` +
    `&prompt=consent`;

  res.redirect(githubAppAuthUrl);
};

export const githubCallback = async (req: Request, res: Response): Promise<void> => {
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

    const userData = {
      name: userRes.data.name,
      username: userRes.data.login,
      avatar: userRes.data.avatar_url,
      bio: userRes.data.bio,
      email: userRes.data.email,
      githubId: userRes.data.id.toString(),
      github_refresh_token: encrypt(refresh_token),

    };

    let user = await User.findOne({
      username: userRes.data.login,
      githubId: userRes.data.id.toString(),
    });
    let isFirstTime = false;

    if (!user) {
      user = await User.create(userData);
      isFirstTime = true;
    } else {
      user = await User.findOneAndUpdate(
        { username: userRes.data.login, githubId: userRes.data.id.toString() },
        userData,
        { new: true },
      );
    }

    const userDataEncoded = encodeURIComponent(JSON.stringify(user));
    const successUrl = `${FRONTEND_URL}?user=${userDataEncoded}&token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}&refresh_token_expires_in=${refresh_token_expires_in}&isFirstTime=${isFirstTime}`;
    res.redirect(successUrl);
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    const errorUrl = `${FRONTEND_URL}?error=GitHub Auth failed`;
    res.redirect(errorUrl);
  }
};


export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  const refreshToken =
  req.headers['x-refresh-token'];

  if (!refreshToken) {
    res.status(401).json({ error: 'Refresh token missing' });
    logError('Refresh token missing in request headers');
    return;
  }

  try {
    // Find user by matching decrypted refresh token
    const users = await User.find(); // You can optimize this lookup if needed
    const user = users.find((u) => decrypt(u.github_refresh_token) === refreshToken);

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
      }
    );

    const { access_token, refresh_token: newRefreshToken } = response.data;

    if (!access_token) {
      res.status(400).json({ error: 'GitHub did not return an access token' });
      return;
    }

    if (newRefreshToken) {
      user.github_refresh_token = encrypt(newRefreshToken);
      await user.save();
    }

    res.json({ access_token, refresh_token: newRefreshToken });
  } catch (err: any) {
    const msg = err?.response?.data?.error_description || 'Token refresh failed';
    if (msg.includes('expired') || msg.includes('invalid')) {
      res.status(403).json({ error: 'Session expired, please log in again' });
    } else {
      res.status(400).json({ error: msg });
    }
  }
};


export const disconnectFromGitHub = async (req: Request, res: Response): Promise<void> => {
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
    console.error('Error disconnecting from GitHub:', error.message);
    res.status(500).send('Failed to disconnect from GitHub');
  }
};
