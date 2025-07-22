import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/auth';

export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const onlyUnread = req.query.onlyUnread === 'true';

      const result = await NotificationService.getUserNotifications(userId, page, limit, onlyUnread);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('获取通知控制器错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const notificationId = parseInt(req.params.id);

      if (isNaN(notificationId)) {
        res.status(400).json({
          success: false,
          message: '无效的通知ID',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await NotificationService.markNotificationAsRead(userId, notificationId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('标记通知已读控制器错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await NotificationService.markAllNotificationsAsRead(userId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('标记所有通知已读控制器错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await NotificationService.getUnreadNotificationCount(userId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('获取未读通知数量控制器错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const notificationId = parseInt(req.params.id);

      if (isNaN(notificationId)) {
        res.status(400).json({
          success: false,
          message: '无效的通知ID',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await NotificationService.deleteNotification(userId, notificationId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('删除通知控制器错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        timestamp: new Date().toISOString()
      });
    }
  }
}