import axios from 'axios';
import config from '../config/constants.js';
import User from '../models/user.js';

// Sets up the GitHub webhook for pull request events
// req: repo name (in body)
// res: success or failure message
export const connectPRWebhook = async (req, res) => {
  const { repo } = req.body;
  const accessToken = req.accessToken;
  const owner = req.username;

  try {
    const webhookUrl = `https://previwer-server.vercel.app/webhook/pr-events`;
    const check = await checkWebhookFunction(
      owner,
      repo,
      accessToken,
      webhookUrl
    );

    console.log('Check repo:', repo);
    if (check) {
      res
        .status(200)
        .json({ message: 'Webhook already connected', webhook: check });
      return;
    }
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/hooks`,
      {
        name: 'web',
        active: true,
        events: ['pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    const webhookData = response.data;
    const hookId = webhookData.id;
    const user = await User.findOne({ username: owner });
    user.hookedRepo = repo;
    user.hookId = hookId;
    await user.save();

    res.status(201).json({
      message: 'Webhook connected successfully',
      hookId
    });
  } catch (error) {
    console.error(
      'Error connecting PR webhook:',
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: 'Failed to connect webhook',
      details: error.response ? error.response.data : error.message
    });
  }
};

// Handles the pull request events from the GitHub webhook
// req: pull request event payload
// res: success or failure message
export const handlePREvent = async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const owner = req.username;
    const user = await User.findOne({ username: owner });
    const repo = user.hookedRepo;
    const activePRsResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        },
        params: {
          state: 'open'
        }
      }
    );

    const activePRs = activePRsResponse.data.map(pr => {
      const repoPrEntry = `${pr.base.repo.name}/${pr.number}`;

      const isPRCommented = user.repo_prnumber.includes(repoPrEntry);

      return {
        pr,
        commented: isPRCommented
      };
    });

    res.status(200).json({
      activePRs
    });
  } catch (error) {
    console.error(
      'Error connecting PR webhook:',
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: 'Failed to process PR event' });
  }
};

// Check if the GitHub webhook is attached to the repository
// req: repo name (in body)
// res: success or failure message with webhook details if exists
export const checkPRWebhook = async (req, res) => {
  const { repo } = req.body;
  const accessToken = req.accessToken;
  const owner = req.username;

  try {
    const webhookUrl = `https://a9ee-2401-4900-1c74-2a6-21c8-5f80-a181-c770.ngrok-free.app/webhook/pr-events`;
    console.log('Check prcheck  repo:', repo);
    const attachedWebhook = await checkWebhookFunction(
      owner,
      repo,
      accessToken,
      webhookUrl
    );

    if (attachedWebhook) {
      res
        .status(200)
        .json({ message: 'Webhook is attached', webhook: attachedWebhook });
    } else {
      res.status(404).json({ message: 'Webhook is not attached' });
    }
  } catch (error) {
    console.log(
      'Error checking PR webhook:',
      error.data ? error.data : error.message
    );
    res.status(500).json({ error: 'Failed to check webhook' });
  }
};

// Disconnect the GitHub webhook for the repository
// req: repo name (in body)
// res: success or failure message
export const disconnectPRWebhook = async (req, res) => {
  const accessToken = req.accessToken;
  const owner = req.username;

  const user = await User.findOne({ username: owner });
  const repo = user.hookedRepo;
  const hookId = user.hookId;

  if (!hookId) {
    return res.status(404).json({ message: 'No webhook to disconnect  ' });
  }

  try {
    const response = await axios.delete(
      `https://api.github.com/repos/${owner}/${repo}/hooks/${hookId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    const user = await User.findOne({ username: owner });
    user.hookedRepo = null;
    user.hookId = null;
    await user.save();
    res.status(200).json({ message: 'Webhook disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting PR webhook:', error.message);
    res.status(500).json({ error: 'Failed to disconnect webhook' });
  }
};

// helper function to check if the webhook is connected
// owner: owner of the repository
// repo: repository name
// accessToken: GitHub access token
// webhookUrl: URL of the webhook
// returns: webhook details if connected, null otherwise
export const checkWebhookFunction = async (
  owner,
  repo,
  accessToken,
  webhookUrl
) => {
  try {
    console.log('Checking webhook:', owner, repo, accessToken, webhookUrl);
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/hooks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    const webhooks = response.data;
    const attachedWebhook = webhooks.find(
      hook => hook.config.url === webhookUrl
    );

    return attachedWebhook || null;
  } catch (error) {
    console.log(
      'Error checking PR webhook:',
      error.data ? error.data : error.message
    );
    throw new Error('Failed to check webhook');
  }
};

// Get the connected repository for the user
// req: username
// res: connected repository name
export const getConnectedRepo = async (req, res) => {
  const owner = req.username;

  try {
    const user = await User.findOne({ username: owner });
    if (!user || !user.hookedRepo) {
      return res.status(404).json({ message: 'No connected repository found' });
    }

    res.status(200).json({ hookedRepo: user.hookedRepo });
  } catch (error) {
    console.error('Error fetching connected repository:', error.message);
    res.status(500).json({ error: 'Failed to fetch connected repository' });
  }
};
