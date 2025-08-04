import { Express } from 'express';
import { handleResponse } from '../utils/responseHandler.js';
import githubRoutes from './github.routes.js';
import userRoutes from './user.routes.js';
import playgroundRouter from './playground.route.js';
import { githubAuthMiddleware } from '../middlewares/verifyToken.js';

const registerRoutes = (app: Express): void => {
  // API routes
  app.use('/api/github', githubRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/playground', githubAuthMiddleware, playgroundRouter);

  // Health check endpoint
  app.get('/health', (_, res) => {
    handleResponse(res, 200, true, 'Server is healthy');
  });

  // unmatched API routes
  app.all('/api/*', (_, res) => {
    handleResponse(res, 404, false, 'API Route not found');
  });
};

export default registerRoutes;
