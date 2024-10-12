import express from 'express';
import {
  githubAuth,
  githubAuthCallback,
  fetchNewPRs,
  collectAllRepos,
  postCommentOnPR,
  getSpecificPR,
  disconnectFromGitHub
} from '../controllers/githubController.js';
const router = express.Router();

router.get('/github', githubAuth);
router.get('/github/callback', githubAuthCallback);
router.get('/repos', collectAllRepos);
router.get('/repos/:repo/pulls', fetchNewPRs);
router.post('/repos/:owner/:repo/pulls/:pull_number/comments', postCommentOnPR);
router.get('/repos/:owner/:repo/pulls/:pull_number', getSpecificPR);
router.post('/disconnect', disconnectFromGitHub);
export default router;