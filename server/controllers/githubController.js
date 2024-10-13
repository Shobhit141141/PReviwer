import axios from 'axios';
import dotenv from 'dotenv';
import config from '../config/constants.js';
import User from '../models/user.js';
import { Octokit } from '@octokit/core';
import jwt from 'jsonwebtoken';
import { generateAIResponse } from '../utils/geminiAI.js';
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
      config.jwtSecret,
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

    res.redirect(
      `https://previwer.vercel.app?token=${jwttoken}&userData=${encodedUserData}&userId=${user._id}`
    );
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
  const accessToken = req.accessToken;
  const owner = req.username;

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
  const accessToken = req.accessToken;
  const owner = req.username;
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

// Fetches a specific PR
// req : owner, repo, pull_number
// res : response with PR
export const getSpecificPR = async (req, res) => {
  const { repo, pull_number } = req.body;
  const accessToken = req.accessToken;
  const owner = req.username;
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
    console.error('Error fetching specific PR:', error.message);
    res.status(500).send('Failed to fetch PR');
  }
};

// Disconnects from GitHub
// req : none
// res : response with status
export const disconnectFromGitHub = async (req, res) => {
  const accessToken = req.accessToken;
  const owner = req.username;
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
  const accessToken = req.accessToken;
  const owner = req.username;
  try {
    const repoResponse = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
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
                Authorization: `Bearer ${accessToken}`
              }
            }
          );

          const prs = prResponse.data;

          for (const pr of prs) {
            const prNumber = pr.number
            const repoName = repo.name; 
            const repoPrEntry = `${repoName}/${prNumber}`;

            const user = await User.findOne({ username: owner });

            if (!user) {
              return res.status(404).json({ message: 'User not found' });
            }
            const isPRCommented = user.repo_prnumber.includes(repoPrEntry);

            activePRs.push({
              pr,
              commented: isPRCommented
            });
          }
        } catch (error) {
          console.error(
            `Error fetching PRs for repo ${repo.name}:`,
            error.message
          );
        }
      }
    }
    res.json({ activePRs });
  } catch (error) {
    console.error('Error fetching active PRs:', error.message);
    res.status(500).send('Failed to fetch active PRs');
  }
};



export const funcngetPullRequestChanges = async (
  owner,
  repo,
  pullNumber,
  accessToken
) => {
  try {
    // Step 1: Fetch the pull request details (optional, can remove if not needed)
    const prResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    // Step 2: Fetch commits associated with the PR
    const commitsResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/commits`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    // Extract files changed and commit messages
    const filesChanged = [];
    for (const commit of commitsResponse.data) {
      const commitResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
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
    return filesChanged;
  } catch (error) {
    console.error('Error fetching pull request changes:', error.message);
    throw new Error('Failed to fetch pull request changes');
  }
};

// Reviews a pull request and generates an AI response
// req : owner, repo, pullNumber
// res : response with AI review
export const reviewPullRequest = async (req, res) => {
  const { repo, pullNumber } = req.body;
  const accessToken = req.accessToken;
  const owner = req.username;
  try {
    const filesChanged = await funcngetPullRequestChanges(
      owner,
      repo,
      pullNumber,
      accessToken
    );
    if (!filesChanged || filesChanged.length === 0) {
      return res
        .status(404)
        .json({ message: 'No changes found in the pull request.' });
    }

    const prompt = `
      Analyze and review the following pull request based on the code implementation, formatting, bugs, errors, and its functionality:
      
      Files Changed:
      ${filesChanged
        .map(
          file => `
      - Filename: ${file.filename}
      - Status: ${file.status}
      - Additions: ${file.additions || 0}
      - Deletions: ${file.deletions || 0}
      - Patch: ${file.patch || 'No patch available'}
      - Commit Message: ${file.commitMessage || 'No commit message available'}
      `
        )
        .join('')}
      
      Please provide feedback on whether this pull request addresses the issues effectively, highlighting any areas of concern or suggestions for improvement and write analysis as a first person perspective.
    `;
    const aiReview = await generateAIResponse(prompt);

    res.json({ review: aiReview });
  } catch (error) {
    console.error('Error reviewing pull request:', error);
    res.status(500).send('Failed to review the pull request');
  }
};

// Comment on a pull request
// req : owner, repo, pullNumber, comment
// res : response with comment
export const commentOnPullRequest = async (req, res) => {
  const { repo, pullNumber, comment } = req.body;
  const token = req.accessToken;
  const owner = req.username;
  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues/${pullNumber}/comments`,
      { body: comment },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    const user = await User.findOne({ username: owner });
    if (user) {
      user.repo_prnumber.push(`${repo}/${pullNumber}`);
      await user.save();
    }

    res.status(201).json('Comment added successfully');
  } catch (error) {
    console.error('Error commenting on pull request:', error);
    res.status(500).send('Failed to comment on the pull request');
  }
};
