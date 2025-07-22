"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const models_1 = require("../models");
class NotificationService {
    static async createLikeNotification(senderId, postId, senderUsername, postTitle) {
        try {
            const post = await models_1.Post.findByPk(postId, {
                include: [{ model: models_1.User, as: 'author' }]
            });
            if (!post) {
                return { success: false, message: '帖子不存在' };
            }
            const recipientId = post.author_id;
            // 不给自己发送通知
            if (senderId === recipientId) {
                return { success: true, message: '不发送自己点赞通知' };
            }
            // 检查是否已存在相同的点赞通知
            const existingNotification = await models_1.Notification.findOne({
                where: {
                    recipient_id: recipientId,
                    sender_id: senderId,
                    type: 'like',
                    post_id: postId
                }
            });
            if (existingNotification) {
                return { success: true, message: '通知已存在' };
            }
            const notification = await models_1.Notification.create({
                recipient_id: recipientId,
                sender_id: senderId,
                type: 'like',
                post_id: postId,
                message: `${senderUsername} 赞了您的帖子《${postTitle.length > 20 ? postTitle.substring(0, 20) + '...' : postTitle}》`
            });
            return {
                success: true,
                message: '点赞通知创建成功',
                data: { notificationId: notification.id }
            };
        }
        catch (error) {
            console.error('创建点赞通知失败:', error);
            return { success: false, message: '创建点赞通知失败' };
        }
    }
    static async createCommentNotification(senderId, postId, commentId, senderUsername, postTitle) {
        try {
            const post = await models_1.Post.findByPk(postId, {
                include: [{ model: models_1.User, as: 'author' }]
            });
            if (!post) {
                return { success: false, message: '帖子不存在' };
            }
            const recipientId = post.author_id;
            // 不给自己发送通知
            if (senderId === recipientId) {
                return { success: true, message: '不发送自己评论通知' };
            }
            const notification = await models_1.Notification.create({
                recipient_id: recipientId,
                sender_id: senderId,
                type: 'comment',
                post_id: postId,
                comment_id: commentId,
                message: `${senderUsername} 评论了您的帖子《${postTitle.length > 20 ? postTitle.substring(0, 20) + '...' : postTitle}》`
            });
            return {
                success: true,
                message: '评论通知创建成功',
                data: { notificationId: notification.id }
            };
        }
        catch (error) {
            console.error('创建评论通知失败:', error);
            return { success: false, message: '创建评论通知失败' };
        }
    }
    static async createReplyNotification(senderId, postId, commentId, parentCommentId, senderUsername, postTitle) {
        try {
            const parentComment = await models_1.Comment.findByPk(parentCommentId, {
                include: [{ model: models_1.User, as: 'author' }]
            });
            if (!parentComment) {
                return { success: false, message: '父评论不存在' };
            }
            const recipientId = parentComment.author_id;
            // 不给自己发送通知
            if (senderId === recipientId) {
                return { success: true, message: '不发送自己回复通知' };
            }
            const notification = await models_1.Notification.create({
                recipient_id: recipientId,
                sender_id: senderId,
                type: 'reply',
                post_id: postId,
                comment_id: commentId,
                message: `${senderUsername} 回复了您在《${postTitle.length > 20 ? postTitle.substring(0, 20) + '...' : postTitle}》中的评论`
            });
            return {
                success: true,
                message: '回复通知创建成功',
                data: { notificationId: notification.id }
            };
        }
        catch (error) {
            console.error('创建回复通知失败:', error);
            return { success: false, message: '创建回复通知失败' };
        }
    }
    static async getUserNotifications(userId, page = 1, limit = 20, onlyUnread = false) {
        try {
            const offset = (page - 1) * limit;
            const whereClause = { recipient_id: userId };
            if (onlyUnread) {
                whereClause.is_read = false;
            }
            const { count, rows: notifications } = await models_1.Notification.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: models_1.User,
                        as: 'sender',
                        attributes: ['id', 'username', 'avatar_url']
                    },
                    {
                        model: models_1.Post,
                        as: 'post',
                        attributes: ['id', 'title'],
                        required: false
                    },
                    {
                        model: models_1.Comment,
                        as: 'comment',
                        attributes: ['id', 'content'],
                        required: false
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });
            const totalPages = Math.ceil(count / limit);
            const unreadCount = await models_1.Notification.count({
                where: { recipient_id: userId, is_read: false }
            });
            return {
                success: true,
                message: '获取通知成功',
                data: {
                    notifications,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalCount: count,
                        unreadCount
                    }
                }
            };
        }
        catch (error) {
            console.error('获取通知失败:', error);
            return { success: false, message: '获取通知失败' };
        }
    }
    static async markNotificationAsRead(userId, notificationId) {
        try {
            const notification = await models_1.Notification.findOne({
                where: {
                    id: notificationId,
                    recipient_id: userId
                }
            });
            if (!notification) {
                return { success: false, message: '通知不存在或无权限' };
            }
            if (notification.is_read) {
                return { success: true, message: '通知已为已读状态' };
            }
            await notification.update({ is_read: true });
            return {
                success: true,
                message: '通知已标记为已读',
                data: { notificationId: notification.id }
            };
        }
        catch (error) {
            console.error('标记通知为已读失败:', error);
            return { success: false, message: '标记通知为已读失败' };
        }
    }
    static async markAllNotificationsAsRead(userId) {
        try {
            const [affectedCount] = await models_1.Notification.update({ is_read: true }, {
                where: {
                    recipient_id: userId,
                    is_read: false
                }
            });
            return {
                success: true,
                message: `已标记${affectedCount}条通知为已读`,
                data: { affectedCount }
            };
        }
        catch (error) {
            console.error('标记所有通知为已读失败:', error);
            return { success: false, message: '标记所有通知为已读失败' };
        }
    }
    static async getUnreadNotificationCount(userId) {
        try {
            const count = await models_1.Notification.count({
                where: {
                    recipient_id: userId,
                    is_read: false
                }
            });
            return {
                success: true,
                message: '获取未读通知数量成功',
                data: { unreadCount: count }
            };
        }
        catch (error) {
            console.error('获取未读通知数量失败:', error);
            return { success: false, message: '获取未读通知数量失败' };
        }
    }
    static async deleteNotification(userId, notificationId) {
        try {
            const notification = await models_1.Notification.findOne({
                where: {
                    id: notificationId,
                    recipient_id: userId
                }
            });
            if (!notification) {
                return { success: false, message: '通知不存在或无权限' };
            }
            await notification.destroy();
            return {
                success: true,
                message: '通知删除成功',
                data: { notificationId }
            };
        }
        catch (error) {
            console.error('删除通知失败:', error);
            return { success: false, message: '删除通知失败' };
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notificationService.js.map