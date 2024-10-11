import axios from 'axios';
import dotenv from 'dotenv';
import config from '../config/constants.js';
import User from '../models/user.js';
import { get } from 'mongoose';
import { getTokenByUsername } from '../utils/github.js';
import jwt from 'jsonwebtoken';
dotenv.config();

// Connects to GitHub OAuth page
// req : none
// res : redirect to GitHub OAuth page
export const githubAuth = (req, res) => {
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${config.githubClientId}&scope=repo`;
  res.redirect(redirectUri);
};

// Callback function after GitHub OAuth
// req : query string with code
// res : response with user data
export const githubAuthCallback = async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code
      },
      {
        headers: {
          accept: 'application/json'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const userData = userResponse.data;
    const jwttoken = jwt.sign({username: userData.login }, process.env.JWT_SECRET, {
      expiresIn: '1d', 
    });
    let user = await User.findOne({ username: userData.login });
    if (!user) {
      user = new User({
        username: userData.login,
        accessToken: accessToken
      });
    } else {
      user.accessToken = accessToken;
    }

    console.log('user: ', user);

    await user.save();
    res.json({
      message: `Hello ${userData.login}, you're logged in with GitHub!`,
      token: jwttoken
    });
  } catch (error) {
    console.error('Error getting access token:', error);
    res.status(500).send('Authentication failed');
  }
};

// Fetches new PRs for a repository
// req : owner, repo
// res : response with PRs
export const fetchNewPRs = async (req, res) => {
  const { repo } = req.params;
  const jwttoken = req.req.headers.authorization.split(' ')[1];
  const owner = jwt.verify(jwttoken, process.env.JWT_SECRET).username;
  const accessToken = getTokenByUsername(req.user.login);

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching PRs:', error);
    res.status(500).send('Failed to fetch PRs');
  }
};

// Collects all repositories for a user
// req : none
// res : response with repositories
export const collectAllRepos = async (req, res) => {
  const jwttoken = req.headers.authorization.split(' ')[1];
  const owner = jwt.verify(jwttoken, process.env.JWT_SECRET).username;
  const accessToken =await getTokenByUsername(owner);

  try {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).send('Failed to fetch repositories');
  }
};

// Posts a comment on a PR
// req : owner, repo, pull_number, comment
// res : response with comment
export const postCommentOnPR = async (req, res) => {
  const { owner, repo, pull_number } = req.params;
  const { body } = req.body; // assuming the comment is sent in the request body
  const accessToken = req.headers.authorization.split(' ')[1];

  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues/${pull_number}/comments`,
      {
        body
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).send('Failed to post comment');
  }
};

// Fetches a specific PR
// req : owner, repo, pull_number
// res : response with PR
export const getSpecificPR = async (req, res) => {
  const { owner, repo, pull_number } = req.params;
  const accessToken = req.headers.authorization.split(' ')[1];

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching specific PR:', error);
    res.status(500).send('Failed to fetch PR');
  }
};

// Disconnects from GitHub
// req : none
// res : response with status
export const disconnectFromGitHub = (req, res) => {
  req.session.accessToken = null;
  const accessToken = req.headers.authorization.split(' ')[1];

  if (accessToken) {
    axios
      .delete('https://api.github.com/applications/YOUR_CLIENT_ID/tokens', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      .then(() => {
        console.log('Token revoked successfully');
        res.send('Disconnected from GitHub successfully.');
      })
      .catch(error => {
        console.error('Error revoking token:', error);
        res.status(500).send('Failed to disconnect from GitHub');
      });
  } else {
    res.send('Disconnected from GitHub successfully.');
  }
};
