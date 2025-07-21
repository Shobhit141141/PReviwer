import { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import { logDebug, logError } from '../utils/logger';
import axios from 'axios';

/**
 * Get active pull requests for the authenticated user
 * /github/active-pull-requests - PRIVATE
 * This function fetches all active pull requests created by the user across all repositories.
 * @param req - Request object containing user access token and username
 * @param res - Response object to send the active pull requests data
 * @returns { Array of active pull requests with details }
 */
export const getActivePullRequests = async (req: Request, res: Response) => {
  const accessToken = req.accessToken;
  const username = req.user?.username;

  logDebug('Fetching active PRs for user:', username);
  if (!accessToken || !username) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const octokit = new Octokit({ auth: accessToken });

    const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
      per_page: 100,
    });

    const repoPRFetches = repos.map(async (repo) => {
      const { data: pulls } = await octokit.rest.pulls.list({
        owner: repo.owner.login,
        repo: repo.name,
        state: 'open',
        per_page: 10,
      });

      const userPRs = pulls.filter((pr) => pr.user?.login === username);

      return Promise.all(userPRs.map(async (pr) => {
        const [commitsRes, commentsRes, prDetailsRes] = await Promise.all([
          octokit.rest.pulls.listCommits({
            owner: repo.owner.login,
            repo: repo.name,
            pull_number: pr.number,
          }),
          octokit.rest.pulls.listReviewComments({
            owner: repo.owner.login,
            repo: repo.name,
            pull_number: pr.number,
          }),
          octokit.rest.pulls.get({
            owner: repo.owner.login,
            repo: repo.name,
            pull_number: pr.number,
          }),
        ]);

        const prDetails = prDetailsRes.data;

        return {
          id: pr.id,
          number: pr.number,
          title: pr.title,
          repo: repo.name,
          status: pr.draft ? 'draft' : 'open',
          created: new Date(pr.created_at).toDateString(),
          commits: commitsRes.data.length,
          comments: commentsRes.data.length,
          additions: prDetails.additions ?? 0,
          deletions: prDetails.deletions ?? 0,
          reviewers: (pr.requested_reviewers || []).map((r: any) => r.login),
          labels: pr.labels.map((l: any) => l.name),
          creator: {
            username: pr.user?.login,
            avatar: pr.user?.avatar_url,
          },
        };
      }));
    });

    const allPRsNested = await Promise.all(repoPRFetches);
    const allPRs = allPRsNested.flat();

    res.status(200).json(allPRs);
  } catch (err: any) {
    logError('Error fetching active PRs:', err);
    res.status(500).json({ error: 'Failed to fetch active PRs', details: err.message });
  }
};

/**
 * Get weekly activity for a user 
 * /github/weekly-activity - PRIVATE
 * This function fetches the user's contributions, pull requests, and repositories created in the last week.
 * @param req - Request object containing user access token and username
 * @param res - Response object to send the weekly activity data 
 * @returns { dailySummary: Array of daily activity summaries for the last week }
* 
 */
export const getWeeklyActivity = async (req: Request, res: Response) => {
  const accessToken = req.accessToken;
  const username = req.user?.username;

  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 6);

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    const query = `
      query {
        user(login: "${username}") {
          contributionsCollection(from: "${lastWeek.toISOString()}", to: "${today.toISOString()}") {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
            pullRequestContributions(first: 100) {
              nodes {
                pullRequest {
                  createdAt
                }
              }
            }
          }
          repositories(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              name
              createdAt
              isFork
              owner {
                login
              }
            }
          }
        }
      }
    `;

    const { data } = await axios.post(
      'https://api.github.com/graphql',
      { query },
      { headers }
    );

    const user = data.data.user;
    const calendarDays = user.contributionsCollection.contributionCalendar.weeks
      .flatMap((week: any) => week.contributionDays);

    const dailyData: Record<string, { day: string; date: string; commits: number; prs: number; repos: number }> = {};
    for (const day of calendarDays) {
      const dateStr = day.date;
      const dateObj = new Date(dateStr);
      dailyData[dateStr] = {
        day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateStr,
        commits: day.contributionCount,
        prs: 0,
        repos: 0,
      };
    }

    user.contributionsCollection.pullRequestContributions.nodes.forEach((node: any) => {
      const createdAt = new Date(node.pullRequest.createdAt).toISOString().split('T')[0];
      if (dailyData[createdAt]) {
        dailyData[createdAt].prs += 1;
      }
    });

    user.repositories.nodes.forEach((repo: any) => {
      const createdAt = new Date(repo.createdAt).toISOString().split('T')[0];
      if (
        new Date(createdAt) >= lastWeek &&
        repo.owner?.login === username &&
        !repo.isFork &&
        dailyData[createdAt]
      ) {
        dailyData[createdAt].repos += 1;
      }
    });

    const dailySummary = Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({ dailySummary });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to fetch GitHub weekly activity',
      details: err.message,
    });
  }
};