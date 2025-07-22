"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notificationService_1 = require("../services/notificationService");
class NotificationController {
    static async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const onlyUnread = req.query.onlyUnread === 'true';
            const result = await notificationService_1.NotificationService.getUserNotifications(userId, page, limit, onlyUnread);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data,
                    timestamp: new Date().toISOString()
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            console.error('获取通知控制器错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误',
                timestamp: new Date().toISOString()
            });
        }
    }
    static async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const notificationId = parseInt(req.params.id);
            if (isNaN(notificationId)) {
                res.status(400).json({
                    success: false,
                    message: '无效的通知ID',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const result = await notificationService_1.NotificationService.markNotificationAsRead(userId, notificationId);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data,
                    timestamp: new Date().toISOString()
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            console.error('标记通知已读控制器错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误',
                timestamp: new Date().toISOString()
            });
        }
    }
    static async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            const result = await notificationService_1.NotificationService.markAllNotificationsAsRead(userId);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data,
                    timestamp: new Date().toISOString()
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            console.error('标记所有通知已读控制器错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误',
                timestamp: new Date().toISOString()
            });
        }
    }
    static async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const result = await notificationService_1.NotificationService.getUnreadNotificationCount(userId);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data,
                    timestamp: new Date().toISOString()
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            console.error('获取未读通知数量控制器错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误',
                timestamp: new Date().toISOString()
            });
        }
    }
    static async deleteNotification(req, res) {
        try {
            const userId = req.user.id;
            const notificationId = parseInt(req.params.id);
            if (isNaN(notificationId)) {
                res.status(400).json({
                    success: false,
                    message: '无效的通知ID',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const result = await notificationService_1.NotificationService.deleteNotification(userId, notificationId);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data,
                    timestamp: new Date().toISOString()
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            console.error('删除通知控制器错误:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误',
                timestamp: new Date().toISOString()
            });
        }
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=notificationController.js.map