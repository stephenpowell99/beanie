import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error for server-side debugging
  console.error('Global error handler caught:', {
    message: err.message,
    stack: err.stack,
    details: err.details
  });

  const statusCode = err.statusCode || 500;
  
  // In development, send the full error details
  // In production, you might want to limit what's sent to the client
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(statusCode).json({
    error: {
      message: err.message || 'An unexpected error occurred',
      statusCode,
      ...(isDev && { stack: err.stack }),
      ...(isDev && err.details && { details: err.details })
    }
  });
};

// Helper function to throw API errors
export const throwApiError = (message: string, statusCode: number = 500, details?: any): never => {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  throw error;
};

// Async route wrapper to automatically catch Promise rejections
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 