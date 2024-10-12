import express from 'express';
import {
  githubAuth,
  githubAuthCallback,
  fetchNewPRs,
  collectAllRepos,
  postCommentOnPR,
  getSpecificPR,
  disconnectFromGitHub,
  getAllActivePRs,
  reviewPullRequest,
  commentOnPullRequest
} from '../controllers/githubController.js';
const router = express.Router();

router.get('/github', githubAuth);
router.get('/github/callback', githubAuthCallback);
router.get('/repos', collectAllRepos);
router.get('/repos/:repo/pulls', fetchNewPRs);
router.post('/repos/:repo/pulls/:pull_number/comments', postCommentOnPR);
router.get('/repos/:repo/pulls/:pull_number', getSpecificPR);
router.post('/disconnect', disconnectFromGitHub);
router.get('/active/prs', getAllActivePRs);
// router.get('/pr/changes', getPullRequestChanges);
router.post('/pr/analysis', reviewPullRequest);
router.post('/pr/comment', commentOnPullRequest);
export default router;
