import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';
import { AuthenticatedRequest } from './auth';
import logger from '../utils/logger';

// Middleware to require admin access
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const isAdmin = await AdminService.verifyAdminAccess(userId);
    
    if (!isAdmin) {
      logger.warn(`Unauthorized admin access attempt by user: ${userId}`);
      res.status(403).json({
        success: false,
        error: 'Admin access required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Admin access granted to user: ${userId}`);
    next();
  } catch (error) {
    logger.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
};

// Middleware to require site admin access
export const requireSiteAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const isSiteAdmin = await AdminService.verifySiteAdminAccess(userId);
    
    if (!isSiteAdmin) {
      logger.warn(`Unauthorized site admin access attempt by user: ${userId}`);
      res.status(403).json({
        success: false,
        error: 'Site admin access required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Site admin access granted to user: ${userId}`);
    next();
  } catch (error) {
    logger.error('Site admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
};

// Middleware to add admin status to request (optional, doesn't block)
export const addAdminStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (userId) {
      const isAdmin = await AdminService.verifyAdminAccess(userId);
      const isSiteAdmin = await AdminService.verifySiteAdminAccess(userId);
      
      // Add admin status as additional properties
      (req as any).isAdmin = isAdmin;
      (req as any).isSiteAdmin = isSiteAdmin;
    }

    next();
  } catch (error) {
    logger.error('Add admin status middleware error:', error);
    // Don't block the request, just log the error
    next();
  }
};