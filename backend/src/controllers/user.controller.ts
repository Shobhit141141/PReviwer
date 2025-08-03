
import { Octokit } from '@octokit/rest';
import { Request, Response } from 'express';
import User from '../models/user.model';



export const getUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
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

  try {
    const octokit = new Octokit({ auth: accessToken });

    const { data: user } = await octokit.rest.users.getByUsername({ username });
    res.status(200).json({
      username: user.login,
      name: user.name,
      avatar: user.avatar_url,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      joinedOn: user.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'GitHub API error', details: err.message });
  }
};


