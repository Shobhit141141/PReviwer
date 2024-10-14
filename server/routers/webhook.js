import express from 'express';
import { checkPRWebhook, connectPRWebhook, disconnectPRWebhook, getConnectedRepo, handlePREvent } from '../controllers/webhookController.js';
import { verifyJWT } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/connect-webhook',verifyJWT, connectPRWebhook);

router.post('/pr-events',verifyJWT, handlePREvent);

router.post('/disconnect-webhook',verifyJWT, disconnectPRWebhook);

router.post('/check',verifyJWT, checkPRWebhook);

router.get('/connected-repo', verifyJWT, getConnectedRepo);

export default router;
