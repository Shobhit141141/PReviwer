import { Express } from 'express';
import { handleResponse } from '../utils/responseHandler';
import githubRoutes from './github.routes';
import userRoutes from './user.routes';
import playgroundRouter from './playground.route';
import { githubAuthMiddleware } from '../middlewares/verifyToken';

const registerRoutes = (app: Express): void => {
   
  app.use('/api/github', githubRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/playground', githubAuthMiddleware, playgroundRouter);
  app.all('*', (_, res) => {
    handleResponse(res, 404, false, 'Route not found');
  });
};

export default registerRoutes;
