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

  // Mobile-specific error handling
  const userAgent = req.get('User-Agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  if (isMobile) {
    // Add mobile-specific headers for better error handling
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }

  sendErrorResponse(res, err, 'Something went wrong');
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Add timeout handler for mobile devices
export const timeoutHandler = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.get('User-Agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    if (isMobile) {
      // Increase timeout for mobile devices
      req.setTimeout(timeout * 2, () => {
        console.error('Request timeout on mobile device');
        res.status(408).json({ error: 'Request timeout. Please try again.' });
      });
    }
    
    next();
  };
};