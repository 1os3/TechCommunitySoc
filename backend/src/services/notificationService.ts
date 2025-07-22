import { Notification, User, Post, Comment } from '../models';
import { NotificationCreationAttributes } from '../models/Notification';

export interface NotificationResult {
  success: boolean;
  message: string;
  data?: any;
}

export class NotificationService {
  static async createLikeNotification(
    senderId: number,
    postId: number,
    senderUsername: string,
    postTitle: string
  ): Promise<NotificationResult> {
    try {
      const post = await Post.findByPk(postId, {
        include: [{ model: User, as: 'author' }]
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
      const existingNotification = await Notification.findOne({
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

      const notification = await Notification.create({
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
    } catch (error) {
      console.error('创建点赞通知失败:', error);
      return { success: false, message: '创建点赞通知失败' };
    }
  }

  static async createCommentNotification(
    senderId: number,
    postId: number,
    commentId: number,
    senderUsername: string,
    postTitle: string
  ): Promise<NotificationResult> {
    try {
      const post = await Post.findByPk(postId, {
        include: [{ model: User, as: 'author' }]
      });

      if (!post) {
        return { success: false, message: '帖子不存在' };
      }

      const recipientId = post.author_id;
      
      // 不给自己发送通知
      if (senderId === recipientId) {
        return { success: true, message: '不发送自己评论通知' };
      }

      const notification = await Notification.create({
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
    } catch (error) {
      console.error('创建评论通知失败:', error);
      return { success: false, message: '创建评论通知失败' };
    }
  }

  static async createReplyNotification(
    senderId: number,
    postId: number,
    commentId: number,
    parentCommentId: number,
    senderUsername: string,
    postTitle: string
  ): Promise<NotificationResult> {
    try {
      const parentComment = await Comment.findByPk(parentCommentId, {
        include: [{ model: User, as: 'author' }]
      });

      if (!parentComment) {
        return { success: false, message: '父评论不存在' };
      }

      const recipientId = parentComment.author_id;
      
      // 不给自己发送通知
      if (senderId === recipientId) {
        return { success: true, message: '不发送自己回复通知' };
      }

      const notification = await Notification.create({
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
    } catch (error) {
      console.error('创建回复通知失败:', error);
      return { success: false, message: '创建回复通知失败' };
    }
  }

  static async getUserNotifications(
    userId: number,
    page: number = 1,
    limit: number = 20,
    onlyUnread: boolean = false
  ): Promise<NotificationResult> {
    try {
      const offset = (page - 1) * limit;
      const whereClause: any = { recipient_id: userId };
      
      if (onlyUnread) {
        whereClause.is_read = false;
      }

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'avatar_url']
          },
          {
            model: Post,
            as: 'post',
            attributes: ['id', 'title'],
            required: false
          },
          {
            model: Comment,
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
      const unreadCount = await Notification.count({
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
    } catch (error) {
      console.error('获取通知失败:', error);
      return { success: false, message: '获取通知失败' };
    }
  }

  static async markNotificationAsRead(
    userId: number,
    notificationId: number
  ): Promise<NotificationResult> {
    try {
      const notification = await Notification.findOne({
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
    } catch (error) {
      console.error('标记通知为已读失败:', error);
      return { success: false, message: '标记通知为已读失败' };
    }
  }

  static async markAllNotificationsAsRead(userId: number): Promise<NotificationResult> {
    try {
      const [affectedCount] = await Notification.update(
        { is_read: true },
        {
          where: {
            recipient_id: userId,
            is_read: false
          }
        }
      );

      return {
        success: true,
        message: `已标记${affectedCount}条通知为已读`,
        data: { affectedCount }
      };
    } catch (error) {
      console.error('标记所有通知为已读失败:', error);
      return { success: false, message: '标记所有通知为已读失败' };
    }
  }

  static async getUnreadNotificationCount(userId: number): Promise<NotificationResult> {
    try {
      const count = await Notification.count({
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
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
      return { success: false, message: '获取未读通知数量失败' };
    }
  }

  static async deleteNotification(
    userId: number,
    notificationId: number
  ): Promise<NotificationResult> {
    try {
      const notification = await Notification.findOne({
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
    } catch (error) {
      console.error('删除通知失败:', error);
      return { success: false, message: '删除通知失败' };
    }
  }
}