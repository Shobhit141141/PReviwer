import { Router } from 'express';
import { githubAuthMiddleware } from '../middlewares/verifyToken.js';
import {
  clearAnalysisAndPRData,
  clearSpecificPRCache,
  getCacheStats,
} from '../controllers/cache.controller.js';

const router = Router();

// All cache routes require authentication
router.use(githubAuthMiddleware);

/**
 * @route POST /cache/clear-analysis-data
 * @desc Clear analysis and PR data caches for the authenticated user
 * @access Private
 */
router.post('/clear-analysis-data', clearAnalysisAndPRData);

/**
 * @route DELETE /cache/pr/:owner/:repo/:prNumber
 * @desc Clear cache for a specific PR
 * @access Private
 */
router.delete('/pr/:owner/:repo/:prNumber', clearSpecificPRCache);

/**
 * @route GET /cache/stats
 * @desc Get cache statistics and health information
 * @access Private
 */
router.get('/stats', getCacheStats);

export default router;
