import { Router } from 'express';
import { githubLogin, githubCallback, disconnectFromGitHub, refreshAccessToken } from '../controllers/github.controller';
import { githubAuthMiddleware } from '../middlewares/verifyToken';

const router = Router();

router.get('/login', githubLogin);
router.get('/callback', githubCallback);
router.post('/refresh', githubAuthMiddleware, refreshAccessToken);
router.delete('/disconnect', githubAuthMiddleware, disconnectFromGitHub);

export default router;
