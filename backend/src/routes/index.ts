import { Express } from 'express';
import { handleResponse } from '../utils/responseHandler.js';
import githubRoutes from './github.routes.js';
import userRoutes from './user.routes.js';
import playgroundRouter from './playground.route.js';
import { githubAuthMiddleware } from '../middlewares/verifyToken.js';

const registerRoutes = (app: Express): void => {
   
  app.use('/api/github', githubRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/playground', githubAuthMiddleware, playgroundRouter);
  app.all('*', (_, res) => {
    handleResponse(res, 404, false, 'Route not found');
  });
};

export default registerRoutes;
