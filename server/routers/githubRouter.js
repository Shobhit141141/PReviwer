import express from 'express';
import {
  githubAuth,
  githubAuthCallback,
  fetchNewPRs,
  collectAllRepos,
  getSpecificPR,
  disconnectFromGitHub,
  getAllActivePRs,
  reviewPullRequest,
  commentOnPullRequest
} from '../controllers/githubController.js';
import {verifyJWT} from '../middleware/verifyToken.js';
const router = express.Router();

router.get('/github', githubAuth);
router.get('/github/callback', githubAuthCallback);
router.get('/repos', verifyJWT, collectAllRepos);
router.get('/repos/:repo/pulls', verifyJWT, fetchNewPRs);
router.get('/repos/pull', verifyJWT, getSpecificPR);
router.post('/disconnect', verifyJWT, disconnectFromGitHub);
router.get('/active/prs', verifyJWT, getAllActivePRs);
router.post('/pr/analysis', verifyJWT, reviewPullRequest);
router.post('/pr/comment', verifyJWT, commentOnPullRequest);
export default router;
