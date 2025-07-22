import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import logger from '../utils/logger';
import User from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: number;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const user = await AuthService.getUserFromToken(token);
    
    if (!user) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

export const requireVerifiedEmail = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'NOT_AUTHENTICATED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (!req.user.is_verified) {
    res.status(403).json({
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required to access this resource',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'NOT_AUTHENTICATED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Admin privileges required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = await AuthService.getUserFromToken(token);
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    logger.warn('Optional auth error (continuing):', error);
    next();
  }
};