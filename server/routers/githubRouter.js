import express from 'express';
import { githubAuth, githubAuthCallback } from '../controllers/githubController.js';

const router = express.Router();

router.get('/github', githubAuth);
router.get('/github/callback', githubAuthCallback);

export default router;
