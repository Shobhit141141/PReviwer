import axios from 'axios';
import dotenv from 'dotenv';
import config from '../config/constants.js';

dotenv.config();


export const githubAuth = (req, res) => {
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;
  res.redirect(redirectUri);
};

export const githubAuthCallback = async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
      },
      {
        headers: {
          accept: 'application/json',
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('Access Token:', accessToken);

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });

    const userData = userResponse.data;
    console.log('GitHub User:', userData);

    res.send(`Hello ${userData.login}, you're logged in with GitHub!`);
  } catch (error) {
    console.error('Error getting access token:', error);
    res.status(500).send('Authentication failed');
  }
};
