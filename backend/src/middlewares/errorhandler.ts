import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger.js';
import { handleResponse } from '../utils/responseHandler.js';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logError('Unhandled Server Error:', err);
    handleResponse(res, 500, false, 'Internal server error');
};

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});