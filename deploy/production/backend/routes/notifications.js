"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
// 获取用户通知列表
router.get('/', auth_1.authenticateToken, notificationController_1.NotificationController.getNotifications);
// 获取未读通知数量
router.get('/unread-count', auth_1.authenticateToken, notificationController_1.NotificationController.getUnreadCount);
// 标记单个通知为已读
router.put('/:id/read', auth_1.authenticateToken, notificationController_1.NotificationController.markAsRead);
// 标记所有通知为已读
router.put('/mark-all-read', auth_1.authenticateToken, notificationController_1.NotificationController.markAllAsRead);
// 删除单个通知
router.delete('/:id', auth_1.authenticateToken, notificationController_1.NotificationController.deleteNotification);
exports.default = router;
//# sourceMappingURL=notifications.js.map