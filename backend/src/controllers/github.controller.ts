import axios from 'axios';
import { Request, Response } from 'express';
import User from '../models/user.model';
import { decrypt } from '../utils/encrypt_decrypt';
import { CONSTANTS } from '../config/constants';
import { logDebug } from '../utils/logger';

const CLIENT_ID = CONSTANTS.GITHUB_CLIENT_ID;
const CLIENT_SECRET = CONSTANTS.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = CONSTANTS.REDIRECT_URI;
const FRONTEND_URL = CONSTANTS.FRONTEND_URL;

export const githubLogin = (_req: Request, res: Response): void => {
  const githubAppAuthUrl = `https://github.com/login/oauth/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${REDIRECT_URI}` +
  `&scope=read:user%20user:email` +  // URL encoded space (%20)
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
      }
    );
    

    const {
      access_token,
      refresh_token,
      expires_in,
      refresh_token_expires_in
    } = tokenRes.data;

    console.log('🔍 GitHub OAuth Debug Info:');
    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);

    console.log('🔍 GitHub OAuth Debug Info:');
    console.log('Token Response:', tokenRes.data);

    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log('🔍 GitHub User Response:', userRes.data);

    
    const userData = {
      name: userRes.data.name,
      username: userRes.data.login,
      avatar: userRes.data.avatar_url,
      bio: userRes.data.bio,
      email: userRes.data.email,
      githubId: userRes.data.id.toString(),
      github_refresh_token: refresh_token,
    };

    let user = await User.findOne({ username: userRes.data.login, githubId: userRes.data.id.toString() });
    let isFirstTime = false;

    if (!user) {
      user = await User.create(userData);
      isFirstTime = true;
    } else {
      user = await User.findOneAndUpdate({ username: userRes.data.login, githubId: userRes.data.id.toString() }, userData, { new: true });
    }

    // Redirect back to frontend with user data and token
    const userDataEncoded = encodeURIComponent(JSON.stringify(user));
    const successUrl = `${FRONTEND_URL}?user=${userDataEncoded}&token=${access_token}`;
    res.redirect(successUrl);
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    const errorUrl = `${FRONTEND_URL}?error=GitHub Auth failed`;
    res.redirect(errorUrl);
  }
};

export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const decryptedRefreshToken = decrypt(user.github_refresh_token);

  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: decryptedRefreshToken,
        grant_type: 'refresh_token',
      },
      {
        headers: { Accept: 'application/json' },
      },
    );

    res.json({ access_token: response.data.access_token });
  } catch (err) {
    res.status(400).json({ error: 'Refresh failed' });
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
