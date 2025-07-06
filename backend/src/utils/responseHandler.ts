import { Response } from 'express';

export const handleResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: unknown,
) => {
  res.status(statusCode).json({
    success,
    message,
    data,
  });
};
