import { Router } from 'express';
import { githubAuthMiddleware } from '../middlewares/verifyToken.js';
import { getGithubAnalytics, getUser } from '../controllers/user.controller.js';

const router = Router();

router.get('/profile', githubAuthMiddleware, getUser);
router.get('/analytics', githubAuthMiddleware, getGithubAnalytics);

export default router;
