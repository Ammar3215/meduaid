import { Response, Request, NextFunction } from 'express';

export interface ApiError {
  message: string;
  statusCode: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const sendErrorResponse = (res: Response, error: any, defaultMessage: string = 'An error occurred') => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const validationErrors = Object.values(error.errors).map((err: any) => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  // Handle Mongoose duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // Handle Mongoose cast errors
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format'
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    message: defaultMessage
  });
};

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};