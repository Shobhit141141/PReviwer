import { Router } from 'express';
import {
  configureModel,
  testModelConnection,
  testSystemPrompt,
  abTestPrompts,
  savePrompts,
  getPlaygroundConfig,
  generateAdvAnalysisReport,
  getTemplateVariables,
  generateTemplatedAnalysisReport,
  previewSystemPromptTemplate,
} from '../controllers/playground.controller.js';

const router = Router();

router.post('/configure', configureModel);
router.post('/test-connection', testModelConnection);
router.post('/test-system-prompt', testSystemPrompt);
router.post('/ab-test', abTestPrompts);
router.post('/save-prompts', savePrompts);
router.get('/config', getPlaygroundConfig);
router.post('/generate-analysis', generateAdvAnalysisReport);

router.get('/template-variables', getTemplateVariables);
router.post('/generate-templated-analysis', generateTemplatedAnalysisReport);
router.post('/preview-template', previewSystemPromptTemplate);

export default router;
