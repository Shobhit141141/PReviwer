import { Router } from 'express';
import {
  githubLogin,
  githubCallback,
  disconnectFromGitHub,
  refreshAccessToken,
  getRecentActivityController,
  getPRDetailsController,
  commentOnPRController,
} from '../controllers/github.controller.js';
import { githubAuthMiddleware } from '../middlewares/verifyToken.js';
import { getActivePullRequests, getRepoStats, getWeeklyActivity } from '../services/github.service.js';

const router = Router();

router.get('/login', githubLogin);
router.get('/callback', githubCallback);
router.post('/refresh', refreshAccessToken);
router.delete('/disconnect', githubAuthMiddleware, disconnectFromGitHub);

router.get('/active-pull-requests', githubAuthMiddleware, getActivePullRequests);
router.get('/weekly-activity', githubAuthMiddleware, getWeeklyActivity);
router.get('/top-repos', githubAuthMiddleware, getRepoStats);
router.get('/recent-activity', githubAuthMiddleware, getRecentActivityController);
router.get('/pr-details/:owner/:repo/:prNumber', githubAuthMiddleware, getPRDetailsController);
router.post('/comment-on-pr', githubAuthMiddleware, commentOnPRController);
export default router;
