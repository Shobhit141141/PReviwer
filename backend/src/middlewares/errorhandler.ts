import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger.js';
import { handleResponse } from '../utils/responseHandler.js';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logError('Unhandled Server Error:', err);
  handleResponse(res, 500, false, 'Internal server error');
};

// Note: Process handlers moved to index.ts to avoid conflicts with graceful shutdown
