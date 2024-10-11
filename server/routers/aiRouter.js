import express from 'express';
import { handlePrompt } from '../controllers/aiController.js';

const router = express.Router();

router.post('/prompt', handlePrompt);

export default router;
