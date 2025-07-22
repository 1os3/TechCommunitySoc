import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errorResponse: ErrorResponse = {
    error: {
      code: err.name || 'UNKNOWN_ERROR',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    },
  };

  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  const statusCode = getStatusCodeFromError(err);
  res.status(statusCode).json(errorResponse);
};

function getStatusCodeFromError(error: Error): number {
  switch (error.name) {
    case 'ValidationError':
      return 400;
    case 'UnauthorizedError':
      return 401;
    case 'ForbiddenError':
      return 403;
    case 'NotFoundError':
      return 404;
    case 'ConflictError':
      return 409;
    case 'SequelizeValidationError':
      return 400;
    case 'SequelizeUniqueConstraintError':
      return 409;
    case 'SequelizeForeignKeyConstraintError':
      return 400;
    default:
      return 500;
  }
}

export default errorHandler;