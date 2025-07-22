import { Router } from 'express';
import { githubLogin, githubCallback, disconnectFromGitHub, refreshAccessToken } from '../controllers/github.controller';
import { githubAuthMiddleware } from '../middlewares/verifyToken';
import { getActivePullRequests, getRepoStats, getWeeklyActivity } from '../services/github.service';

const router = Router();

router.get('/login', githubLogin);
router.get('/callback', githubCallback);
router.post('/refresh', refreshAccessToken);
router.delete('/disconnect', githubAuthMiddleware, disconnectFromGitHub);

router.get('/active-pull-requests', githubAuthMiddleware, getActivePullRequests);
router.get('/weekly-activity', githubAuthMiddleware, getWeeklyActivity);
router.get('/top-repos', githubAuthMiddleware, getRepoStats);

export default router;
