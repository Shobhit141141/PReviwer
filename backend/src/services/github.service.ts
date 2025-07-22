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

      return Promise.all(
        userPRs.map(async (pr) => {
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
        }),
      );
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

    const { data } = await axios.post('https://api.github.com/graphql', { query }, { headers });

    const user = data.data.user;
    const calendarDays = user.contributionsCollection.contributionCalendar.weeks.flatMap(
      (week: any) => week.contributionDays,
    );

    const dailyData: Record<
      string,
      { day: string; date: string; commits: number; prs: number; repos: number }
    > = {};
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

    const dailySummary = Object.values(dailyData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    res.json({ dailySummary });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to fetch GitHub weekly activity',
      details: err.message,
    });
  }
};

/**
 * Get repository statistics for a user
 * /github/repo-stats - PRIVATE
 * This function fetches statistics for all repositories of a user, including stars, forks, open pull requests, commits, language, last commit date, and contributors.
 * @param req - Request object containing user access token and username
 * @param res - Response object to send the repository statistics data
 * @returns { Array of repository statistics with details }
 */


export const getRepoStats = async (req: Request, res: Response) => {
  const accessToken = req.accessToken;
  const username = req.user?.username as string;

  if (!username) {
    res.status(400).json({ error: "Missing GitHub username" });
    return;
  }

  try {
        const octokit = new Octokit({ auth: accessToken });

    const { data: repos } = await octokit.rest.repos.listForUser({
      username,
      per_page: 100,
      sort: "updated",
    });

    const repoStats = await Promise.all(
      repos.map(async (repo) => {
        try {
          const [prs, contributors, commits, lastCommit] = await Promise.all([
            octokit.rest.pulls.list({
              owner: username,
              repo: repo.name,
              state: "open",
              per_page: 100,
            }),

            octokit.rest.repos.listContributors({
              owner: username,
              repo: repo.name,
              per_page: 100,
            }),

            octokit.paginate(octokit.rest.repos.listCommits, {
              owner: username,
              repo: repo.name,
              sha: repo.default_branch,
              per_page: 100,
            }),

            octokit.rest.repos.getCommit({
              owner: username,
              repo: repo.name,
              ref: repo.default_branch ?? "main",
            }),
          ]);

          const commitCount = commits.length;

          return {
            name: repo.name,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            openPRs: prs.data.length,
            commits: commitCount,
            language: repo.language,
            lastCommit: new Date(
              lastCommit.data.commit.author?.date || ""
            ),
            contributors: contributors.data.length,
            score: commitCount + 10 * (repo.stargazers_count ?? 0) + 5 * prs.data.length,
          };
        } catch (err) {
          console.error(`Error processing repo ${repo.name}:`, err);
          return null;
        }
      })
    );

    const filtered = repoStats
      .filter(Boolean)
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
      .slice(0, 3);

    res.json(filtered);
  } catch (error) {
    console.error("GitHub API error:", error);
    res.status(500).json({ error: "Failed to fetch repository stats" });
  }
};
