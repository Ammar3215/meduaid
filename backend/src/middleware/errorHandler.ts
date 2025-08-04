import { Request, Response, NextFunction } from 'express';
import { AppError, sendErrorResponse } from '../utils/errorHandler';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error in production with minimal information
  if (process.env.NODE_ENV === 'production') {
    if (err.isOperational) {
      // Log operational errors with context
      console.error(`Operational Error: ${err.message} - ${req.method} ${req.path}`);
    } else {
      // Log programming errors without sensitive details
      console.error(`System Error: ${req.method} ${req.path} - ${err.name}`);
    }
  }

  sendErrorResponse(res, err, 'Something went wrong');
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};