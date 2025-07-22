import { BackendResponse } from '../types/auth';

export interface NotificationItem {
  id: number;
  recipient_id: number;
  sender_id: number;
  type: 'like' | 'comment' | 'reply';
  post_id?: number;
  comment_id?: number;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  post?: {
    id: number;
    title: string;
  };
  comment?: {
    id: number;
    content: string;
  };
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    unreadCount: number;
  };
}

export interface UnreadCountResponse {
  unreadCount: number;
}

class NotificationService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private static getBaseUrl(): string {
    return process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';
  }

  static async getNotifications(
    page: number = 1,
    limit: number = 20,
    onlyUnread: boolean = false
  ): Promise<BackendResponse<NotificationListResponse>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(onlyUnread && { onlyUnread: 'true' }),
      });

      const response = await fetch(
        `${this.getBaseUrl()}/notifications?${params}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as BackendResponse<NotificationListResponse>;
    } catch (error) {
      console.error('获取通知失败:', error);
      return {
        success: false,
        message: '获取通知失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async getUnreadCount(): Promise<BackendResponse<UnreadCountResponse>> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/notifications/unread-count`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as BackendResponse<UnreadCountResponse>;
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
      return {
        success: false,
        message: '获取未读通知数量失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async markAsRead(notificationId: number): Promise<BackendResponse> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as BackendResponse;
    } catch (error) {
      console.error('标记通知为已读失败:', error);
      return {
        success: false,
        message: '标记通知为已读失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async markAllAsRead(): Promise<BackendResponse> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/notifications/mark-all-read`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as BackendResponse;
    } catch (error) {
      console.error('标记所有通知为已读失败:', error);
      return {
        success: false,
        message: '标记所有通知为已读失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async deleteNotification(notificationId: number): Promise<BackendResponse> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as BackendResponse;
    } catch (error) {
      console.error('删除通知失败:', error);
      return {
        success: false,
        message: '删除通知失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  static formatNotificationMessage(notification: NotificationItem): string {
    switch (notification.type) {
      case 'like':
        return `${notification.sender?.username || '用户'} 赞了您的帖子`;
      case 'comment':
        return `${notification.sender?.username || '用户'} 评论了您的帖子`;
      case 'reply':
        return `${notification.sender?.username || '用户'} 回复了您的评论`;
      default:
        return notification.message;
    }
  }

  static getNotificationIcon(type: string): string {
    switch (type) {
      case 'like':
        return '👍';
      case 'comment':
        return '💬';
      case 'reply':
        return '↳';
      default:
        return '🔔';
    }
  }

  static getNotificationLink(notification: NotificationItem): string {
    if (notification.comment_id) {
      return `/posts/${notification.post_id}#comment-${notification.comment_id}`;
    }
    return `/posts/${notification.post_id}`;
  }

  static formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}分钟前`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}小时前`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }
}

export default NotificationService;