import axios from 'axios';
import dotenv from 'dotenv';
import config from '../config/constants.js';
import User from '../models/user.js';
import { getTokenByUsername } from '../utils/github.js';
import { Octokit } from '@octokit/core';
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
    const jwttoken = jwt.sign(
      { username: userData.login },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d'
      }
    );
    let user = await User.findOne({ username: userData.login });
    if (!user) {
      user = new User({
        username: userData.login,
        accessToken: accessToken
      });
    } else {
      user.accessToken = accessToken;
    }

    const userDataJson = JSON.stringify(userData);
    const encodedUserData = encodeURIComponent(userDataJson);
    await user.save();
    // res.json({
    //   message: `Hello ${userData.login}, you're logged in with GitHub!`,
    //   token: jwttoken
    // });
    res.redirect(`http://localhost:5173?token=${jwttoken}&userData=${encodedUserData}&userId=${user._id}`);

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
  const jwttoken = req.headers.authorization.split(' ')[1];
  const owner = jwt.verify(jwttoken, process.env.JWT_SECRET).username;
  const accessToken = await getTokenByUsername(owner);

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
    console.error('Error fetching PRs:', error.message);
    res.status(500).send('Failed to fetch PRs');
  }
};

// Collects all repositories for a user
// req : none
// res : response with repositories
export const collectAllRepos = async (req, res) => {
  const jwttoken = req.headers.authorization.split(' ')[1];
  const owner = jwt.verify(jwttoken, process.env.JWT_SECRET).username;
  const accessToken = await getTokenByUsername(owner);

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
  const { repo, pull_number } = req.params;
  const { body } = req.body; // assuming the comment is sent in the request body
  const jwttoken = req.headers.authorization.split(' ')[1];
  const owner = jwt.verify(jwttoken, process.env.JWT_SECRET).username;
  const accessToken = await getTokenByUsername(owner);

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
  const { repo, pull_number } = req.params;
  const jwttoken = req.headers.authorization.split(' ')[1];
  const owner = jwt.verify(jwttoken, process.env.JWT_SECRET).username;
  const accessToken = await getTokenByUsername(owner);

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
export const disconnectFromGitHub = async (req, res) => {
  const jwtToken = req.headers.authorization.split(' ')[1];
  const username = jwt.verify(jwtToken, process.env.JWT_SECRET).username;
  const accessToken = await getTokenByUsername(username);
  
  try {
    if (accessToken) {
      const response = await axios.delete(
        `https://api.github.com/applications/${config.githubClientId}/token`,
        {
          auth: {
            username: config.githubClientId,
            password: config.githubClientSecret
          },
          data: {
            access_token: accessToken
          },
          headers: {
            Accept: 'application/vnd.github+json'
          }
        }
      );

      if (response.status === 204) {
        res
          .status(200)
          .json({ message: 'App disconnected from GitHub successfully.' });
      } else {
        res
          .status(response.status)
          .json({ error: 'Failed to disconnect app from GitHub.' });
      }
    } else {
      res.status(400).json({ error: 'No access token found for the user.' });
    }
  } catch (error) {
    console.error('Error disconnecting from GitHub:', error.message);
    res.status(500).send('Failed to disconnect from GitHub');
  }
};


// Fetches all active (open) PRs raised by others on the user's repositories/projects
// req : none
// res : response with active PRs across owned repositories
export const getAllActivePRs = async (req, res) => {
  const jwtToken = req.headers.authorization.split(' ')[1];
  const owner = jwt.verify(jwtToken, process.env.JWT_SECRET).username;
  const accessToken = await getTokenByUsername(owner);

  try {
    const repoResponse = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const repos = repoResponse.data;
    let activePRs = [];

    for (const repo of repos) {
      if (repo.owner.login === owner) {
        try {
          const prResponse = await axios.get(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/pulls`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          activePRs = [...activePRs, ...prResponse.data];
        } catch (error) {
          console.error(`Error fetching PRs for repo ${repo.name}:`, error.message);
        }
      }
    }
    res.json(activePRs);
  } catch (error) {
    console.error('Error fetching active PRs:', error.message);
    res.status(500).send('Failed to fetch active PRs');
  }
};

// Fetches the changes made in a pull request
// req : owner, repo, pullNumber
// res : response with changes made in the PR
export const getPullRequestChanges = async (req, res) => {
  const { repo, pullNumber } = req.body;
  const jwtToken = req.headers.authorization.split(" ")[1];
  const owner = jwt.verify(jwtToken, process.env.JWT_SECRET).username;
  const token = await getTokenByUsername(owner);

  try {
    // Step 1: Fetch the pull request details (optional, can remove if not needed)
    const prResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Step 2: Fetch commits associated with the PR
    const commitsResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/commits`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Extract files changed and commit messages
    const filesChanged = [];
    for (const commit of commitsResponse.data) {
  
      const commitResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Extract the files and include commit message
      commitResponse.data.files.forEach(file => {
        filesChanged.push({
          filename: file.filename,
          status: file.status, // can be 'added', 'modified', 'removed'
          additions: file.additions || 0,
          deletions: file.deletions || 0, 
          changes: file.changes, 
          patch: file.patch, 
          commitMessage: commit.commit.message 
        });
      });
    }
    // Return the files with commit messages
    res.json(filesChanged);
  } catch (error) {
    console.error("Error fetching pull request changes:", error);
    res.status(500).send("Failed to fetch pull request changes");
  }
};