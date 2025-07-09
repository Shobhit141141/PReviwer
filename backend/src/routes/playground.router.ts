import { Router } from 'express';
import {
  configureModel,
  testModelConnection,
  testSystemPrompt,
  abTestPrompts,
  savePrompts,
  getPlaygroundConfig,
} from '../controllers/playground.controller';

const router = Router();

router.post('/configure', configureModel);
router.post('/test-connection', testModelConnection);
router.post('/test-system-prompt', testSystemPrompt);
router.post('/ab-test', abTestPrompts);
router.post('/save-prompts', savePrompts);
router.get('/config', getPlaygroundConfig);

export default router;
