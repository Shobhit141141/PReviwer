import { Router } from 'express';
import { githubAuthMiddleware } from '../middlewares/verifyToken';
import User from '../models/user.model';
import { getGithubAnalytics, getUser } from '../controllers/user.controller';

const router = Router();

router.get('/profile', githubAuthMiddleware, getUser);
router.get('/analytics', githubAuthMiddleware, getGithubAnalytics);

export default router;
