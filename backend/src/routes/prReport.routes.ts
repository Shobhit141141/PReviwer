import { Router } from 'express';
import {
  savePRReport,
  getUserPRReports,
  getPRReport,
  getPRReports,
  deletePRReport,
  exportPRReport,
} from '../controllers/prReport.controller.js';
import { githubAuthMiddleware } from '../middlewares/verifyToken.js';

const router = Router();

// All routes require authentication
router.use(githubAuthMiddleware);

// Save a PR report
router.post('/save', savePRReport);

// Get all PR reports for a user
router.get('/user', getUserPRReports);

// Get all reports for a specific PR
router.get('/pr/:prIdentifier', getPRReports);

// Get a specific PR report by ID
router.get('/:reportId', getPRReport);

// Delete a PR report
router.delete('/:reportId', deletePRReport);

// Export PR report in different formats
router.get('/:reportId/export/:format', exportPRReport);

export default router;
