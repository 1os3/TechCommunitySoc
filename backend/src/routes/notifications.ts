import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { NotificationController } from '../controllers/notificationController';

const router = Router();

// 获取用户通知列表
router.get('/', authenticateToken, NotificationController.getNotifications);

// 获取未读通知数量
router.get('/unread-count', authenticateToken, NotificationController.getUnreadCount);

// 标记单个通知为已读
router.put('/:id/read', authenticateToken, NotificationController.markAsRead);

// 标记所有通知为已读
router.put('/mark-all-read', authenticateToken, NotificationController.markAllAsRead);

// 删除单个通知
router.delete('/:id', authenticateToken, NotificationController.deleteNotification);

export default router;