import { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import { logDebug, logError, logger } from '../utils/logger.js';
import axios from 'axios';
import {
  getRedisCache,
  setRedisCache,
  deleteRedisCache,
  clearRedisCachePattern,
  CACHE_TTL,
  connectToRedis,
} from '../config/redis.js';
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

  const cacheKey = `active_prs:${username}`;

  try {
    // Check cache first
    const cachedData = await getRedisCache(cacheKey);
    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

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

    // Cache for 10 minutes - PRs change frequently
    await setRedisCache(cacheKey, JSON.stringify(allPRs), CACHE_TTL.SHORT * 2);

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

  if (!accessToken || !username) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const cacheKey = `weekly_activity:${username}`;

  try {
    // Check cache first
    const cachedData = await getRedisCache(cacheKey);
    if (cachedData) {
      res.json(JSON.parse(cachedData));
      return;
    }

    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

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

    const result = { dailySummary };

    // Cache for 1 hour - weekly activity doesn't change very frequently
    await setRedisCache(cacheKey, JSON.stringify(result), CACHE_TTL.LONG);

    res.json(result);
  } catch (err: any) {
    logError('Error fetching weekly activity:', err);
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
    res.status(400).json({ error: 'Missing GitHub username' });
    return;
  }

  const cacheKey = `repo_stats:${username}`;

  try {
    // Check cache first
    const cachedData = await getRedisCache(cacheKey);
    if (cachedData) {
      res.json(JSON.parse(cachedData));
      return;
    }

    const octokit = new Octokit({ auth: accessToken });

    const { data: repos } = await octokit.rest.repos.listForUser({
      username,
      per_page: 100,
      sort: 'updated',
    });

    const repoStats = await Promise.all(
      repos.map(async (repo) => {
        try {
          const [prs, contributors, commits, lastCommit] = await Promise.all([
            octokit.rest.pulls.list({
              owner: username,
              repo: repo.name,
              state: 'open',
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
              ref: repo.default_branch ?? 'main',
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
            lastCommit: new Date(lastCommit.data.commit.author?.date || ''),
            contributors: contributors.data.length,
            score: commitCount + 10 * (repo.stargazers_count ?? 0) + 5 * prs.data.length,
          };
        } catch (err: any) {
          logError(`Error processing repo ${repo.name}:`, err);
          return null;
        }
      }),
    );

    const filtered = repoStats
      .filter(Boolean)
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
      .slice(0, 3);

    // Cache for 1 hour - repo stats don't change very frequently
    await setRedisCache(cacheKey, JSON.stringify(filtered), CACHE_TTL.LONG);

    res.json(filtered);
  } catch (error: any) {
    logError('GitHub API error:', error);
    res.status(500).json({ error: 'Failed to fetch repository stats' });
  }
};

/**
 * Get recent GitHub activity for the authenticated user
 * /github/recent-activity - PRIVATE
 * This function fetches the recent 3 activities (events) for the user with relevant details.
 * @param req - Request object containing user access token and username
 * @param res - Response object to send the recent activity data
 * @returns { Array of recent activity details }
 */
export const getRecentActivity = async (req: Request, res: Response) => {
  const accessToken = req.accessToken;
  const username = req.user?.username;

  if (!accessToken || !username) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const cacheKey = `recent_activity:${username}`;

  try {
    // Check cache first
    const cachedData = await getRedisCache(cacheKey);
    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    const octokit = new Octokit({ auth: accessToken });

    // Get user's recent events
    const { data: events } = await octokit.rest.activity.listEventsForAuthenticatedUser({
      username,
      per_page: 10,
    });

    // Pick the top 3 meaningful events with details
    const recentActivities = events
      .slice(0, 10)
      .filter(
        (e) =>
          e.type === 'PushEvent' ||
          e.type === 'PullRequestEvent' ||
          e.type === 'IssuesEvent' ||
          e.type === 'CreateEvent',
      )
      .slice(0, 3)
      .map((event) => {
        const base = {
          id: event.id,
          type: event.type,
          repo: event.repo.name,
          created_at: event.created_at,
        };

        switch (event.type) {
          case 'PushEvent':
            return {
              ...base,
              action: `Pushed ${(event.payload as any).commits?.length || 0} commit(s)`,
              branch: (event.payload as any).ref?.replace('refs/heads/', ''),
              commits: (event.payload as any).commits?.map((c: any) => ({
                message: c.message,
                url: c.url,
              })),
            };

          case 'PullRequestEvent': {
            const payload = event.payload as {
              action?: string;
              pull_request?: {
                number?: number;
                title?: string;
                html_url?: string;
              };
            };
            return {
              ...base,
              action: `${payload.action} pull request #${payload.pull_request?.number}`,
              title: payload.pull_request?.title,
              url: payload.pull_request?.html_url,
            };
          }

          case 'IssuesEvent':
            return {
              ...base,
              action: `${event.payload.action} issue #${event.payload.issue?.number}`,
              title: event.payload.issue?.title,
              url: event.payload.issue?.html_url,
            };

          case 'CreateEvent': {
            const payload = event.payload as { ref_type?: string; ref?: string };
            return {
              ...base,
              action: `Created ${payload.ref_type} ${payload.ref || ''}`,
            };
          }

          default:
            return base;
        }
      });

    const result = { recentActivities };

    // Cache for 15 minutes - recent activity changes frequently
    await setRedisCache(cacheKey, JSON.stringify(result), CACHE_TTL.MEDIUM);

    res.status(200).json(result);
  } catch (err: any) {
    logError('Error fetching recent activity:', err);
    res.status(500).json({ error: 'Failed to fetch recent activity', details: err.message });
  }
};

/**
 * Get pull request details for a specific PR
 * /github/pr-details/:owner/:repo/:prNumber - PRIVATE
 * This function fetches detailed information about a specific pull request.
 * @param req - Request object containing user access token, owner, repo, and PR number
 * @param res - Response object to send the PR details data
 * @returns { Detailed PR information including stats, files, commits, and merge status }
 */
export const getPRDetails = async (req: Request, res: Response) => {
  const accessToken = req.accessToken;
  const { owner, repo, prNumber } = req.params;

  if (!owner || !repo || !prNumber) {
    res.status(400).json({ error: 'Missing required parameters: owner, repo, or prNumber' });
    return;
  }
  const cacheKey = `pr_details:${owner}:${repo}:${prNumber}`;

  try {
    // Try to get user data from cache
    const cachedPR = await getRedisCache(cacheKey);
    if (cachedPR) {
      logger(' CACHE ', `PR data served from cacheKey: ${cacheKey}`, 'green');
      res.json(JSON.parse(cachedPR));
      return;
    }
  } catch (cacheError) {
    logError(
      'Redis cache read error for getPRDetails',
      cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
    );
  }

  try {
    const octokit = new Octokit({ auth: accessToken });
    // Fetch PR details
    const { data: prData } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: parseInt(prNumber),
    });
    // Fetch PR commits
    const { data: commits } = await octokit.rest.pulls.listCommits({
      owner,
      repo,
      pull_number: parseInt(prNumber),
    });

    // Fetch PR files
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: parseInt(prNumber),
    });

    // Fetch PR reviews
    const { data: reviews } = await octokit.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: parseInt(prNumber),
    });

    // Fetch PR comments
    const { data: comments } = await octokit.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: parseInt(prNumber),
    });

    // Get issue comments (general PR comments)
    const { data: issueComments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: parseInt(prNumber),
    });

    // Calculate statistics
    const totalComments = comments.length + issueComments.length;
    const additions = files.reduce((sum, file) => sum + file.additions, 0);
    const deletions = files.reduce((sum, file) => sum + file.deletions, 0);
    const changedFiles = files.length;

    // Get reviewers from reviews and requested reviewers
    const reviewers = [
      ...(prData.requested_reviewers?.map((reviewer) => ({
        login: reviewer.login,
        avatar_url: reviewer.avatar_url,
        name: reviewer.name || reviewer.login,
        type: 'requested',
      })) || []),
      ...reviews
        .filter(
          (review, index, self) =>
            self.findIndex((r) => r.user?.login === review.user?.login) === index,
        )
        .map((review) => ({
          login: review.user?.login || '',
          avatar_url: review.user?.avatar_url || '',
          name: review.user?.name || review.user?.login || '',
          type: 'reviewed',
        })),
    ];

    // Format the response
    const prDetails = {
      id: prData.id.toString(),
      number: prData.number,
      title: prData.title,
      description: prData.body || '',
      state: prData.state,
      author: {
        login: prData.user?.login || '',
        avatar_url: prData.user?.avatar_url || '',
        name: prData.user?.name || prData.user?.login || '',
      },
      assignees:
        prData.assignees?.map((assignee) => ({
          login: assignee.login,
          avatar_url: assignee.avatar_url,
          name: assignee.name || assignee.login,
        })) || [],
      reviewers: reviewers,
      labels:
        prData.labels?.map((label) => ({
          name: typeof label === 'string' ? label : label.name,
          color: typeof label === 'string' ? 'cccccc' : label.color,
        })) || [],
      created_at: prData.created_at,
      updated_at: prData.updated_at,
      merged_at: prData.merged_at,
      base: {
        ref: prData.base.ref,
        repo: {
          name: prData.base.repo.name,
          full_name: prData.base.repo.full_name,
        },
      },
      head: {
        ref: prData.head.ref,
        repo: {
          name: prData.head.repo?.name || '',
          full_name: prData.head.repo?.full_name || '',
        },
      },
      stats: {
        commits: commits.length,
        additions,
        deletions,
        changed_files: changedFiles,
        comments: totalComments,
      },
      mergeable: prData.mergeable,
      merge_conflict: prData.mergeable === false,
      draft: prData.draft,
      can_merge: prData.mergeable !== false,
      merge_status:
        prData.mergeable === true ? 'clean' : prData.mergeable === false ? 'conflicts' : 'unknown',
      files: files.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
      })),
      commits: commits.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          login: commit.author?.login || commit.commit.author?.name || '',
          avatar_url: commit.author?.avatar_url || '',
          name: commit.commit.author?.name || '',
        },
        date: commit.commit.author?.date || commit.commit.committer?.date || '',
        url: commit.html_url,
      })),
      reviews: reviews.map((review) => ({
        id: review.id,
        state: review.state,
        body: review.body,
        user: {
          login: review.user?.login || '',
          avatar_url: review.user?.avatar_url || '',
          name: review.user?.name || review.user?.login || '',
        },
        submitted_at: review.submitted_at,
      })),
    };
    // Cache the PR details for 15 minutes (900 seconds)
    try {
      await setRedisCache(cacheKey, JSON.stringify(prDetails), CACHE_TTL.MEDIUM);
      logger(' CACHE ', `PR details cached for ID: ${prNumber}`, 'blue');
    } catch (cacheError) {
      logError(
        'Redis cache write error for getPRDetails',
        cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
      );
    }
    logger(' CACHE ', `PR details cached for ID: ${prNumber}`, 'blue');
    res.status(200).json(prDetails);
  } catch (err: any) {
    // logError('Error fetching PR details:', err);
    res.status(500).json({ error: 'Failed to fetch PR details', details: err.message });
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {

    const {comment,owner,repo,prNumber} = req.body;
    const { accessToken } = req;

    if (!owner || !repo || !prNumber) {
      return res.status(400).json({ error: "Repository owner, name, and PR number are required query parameters." });
    }
    if (!comment) {
      return res.status(400).json({ error: "The request body must include a 'comment'." });
    }
    const issue_number = parseInt(prNumber, 10);
    if (isNaN(issue_number)) {
      return res.status(400).json({ error: "Invalid pull request number provided." });
    }
    const octokit = new Octokit({ auth: accessToken });
    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
      owner,
      repo,
      issue_number: issue_number,
      body: comment,
    });

    return res.status(201).json({ success: true, message: "Comment added successfully." });

  } catch (error: any) {
    logError("Error creating general comment on PR:", error);

    const status = error.status || 500;
    const message = error.message || "Failed to post comment on PR.";

    return res.status(status).json({ error: message });
  }
};
