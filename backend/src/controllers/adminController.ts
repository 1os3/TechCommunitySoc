import { Request, Response } from 'express';
import { AdminService } from '../services/adminService';
import { PostService } from '../services/postService';
import { CommentService } from '../services/commentService';
import { LogService } from '../services/logService';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class AdminController {
  // Create new admin account (site admin only)
  static async createAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { username, email } = req.body;
      const siteAdminId = req.user?.id;

      if (!siteAdminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!username || !email) {
        res.status(400).json({
          success: false,
          error: 'Username and email are required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await AdminService.createAdminAccount(siteAdminId, { username, email });

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            user: result.user?.toSafeJSON(),
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Create admin controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Delete admin account (site admin only)
  static async deleteAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { adminId } = req.params;
      const siteAdminId = req.user?.id;

      if (!siteAdminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const targetAdminId = parseInt(adminId);
      if (isNaN(targetAdminId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid admin ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await AdminService.deleteAdminAccount(siteAdminId, targetAdminId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 
                          result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Delete admin controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get list of admin accounts (admin access required)
  static async getAdmins(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestingUserId = req.user?.id;

      if (!requestingUserId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await AdminService.getAdminAccounts(requestingUserId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            admins: result.users?.map(user => user.toSafeJSON()),
            total: result.users?.length || 0,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Get admins controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get current user's admin status
  static async getAdminStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const isSiteAdmin = await AdminService.verifySiteAdminAccess(userId);

      res.status(200).json({
        success: true,
        data: {
          isAdmin,
          isSiteAdmin,
          userId,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get admin status controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Admin delete post (admin access required)
  static async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const postIdNum = parseInt(postId);
      if (isNaN(postIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid post ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await PostService.adminDeletePost(postIdNum, adminId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Admin delete post controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Admin delete comment (admin access required)
  static async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const commentIdNum = parseInt(commentId);
      if (isNaN(commentIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid comment ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await CommentService.adminDeleteComment(commentIdNum, adminId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Admin delete comment controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Admin delete user (admin access required)
  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await AdminService.deleteUserAccount(adminId, userIdNum);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 
                          result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Admin delete user controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Enable user account (admin access required)
  static async enableUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await AdminService.enableUserAccount(adminId, userIdNum);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 
                          result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Admin enable user controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Restore soft deleted user account (admin access required)
  static async restoreUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { username, email } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await AdminService.restoreUserAccount(adminId, userIdNum, username, email);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 
                          result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Admin restore user controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get soft deleted users (admin access required)
  static async getSoftDeletedUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const searchQuery = req.query.q as string;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await AdminService.getSoftDeletedUserList(adminId, page, limit, searchQuery);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            users: result.users?.map(user => user.toSafeJSON()),
            page,
            limit,
            total: result.total || 0,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Get soft deleted users controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get user list (admin access required)
  static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await AdminService.getUserList(adminId, page, limit);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            users: result.users?.map(user => user.toSafeJSON()),
            page,
            limit,
            total: result.total || 0,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Get users controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get system logs (admin access required)
  static async getSystemLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const level = req.query.level as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await LogService.getSystemLogs(adminId, page, limit, level, startDate, endDate);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            logs: result.logs,
            page,
            limit,
            total: result.total,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Get system logs controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get error logs (admin access required)
  static async getErrorLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await LogService.getErrorLogs(adminId, limit);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            logs: result.logs,
            total: result.total,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Get error logs controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get admin activity logs (admin access required)
  static async getAdminActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 100;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await LogService.getAdminActivityLogs(adminId, limit);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            logs: result.logs,
            total: result.total,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Get admin activity logs controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Clear logs (admin access required)
  static async clearLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      const olderThanDays = parseInt(req.body.olderThanDays) || 30;
      const level = req.body.level as string;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await LogService.clearLogs(adminId, olderThanDays, level);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            removedCount: result.total,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Clear logs controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Clear all logs (admin access required)
  static async clearAllLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await LogService.clearAllLogs(adminId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            removedCount: result.total,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Clear all logs controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}