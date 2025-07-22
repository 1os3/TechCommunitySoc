import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NotificationService, { NotificationItem } from '../../services/notificationService';
import './../../styles/notifications.css';

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, [filter, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await NotificationService.getNotifications(
        currentPage,
        20,
        filter === 'unread'
      );

      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setTotalPages(response.data.pagination.totalPages);
        setUnreadCount(response.data.pagination.unreadCount);
      } else {
        setError(response.message || '获取通知失败');
      }
    } catch (err) {
      setError('获取通知时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await NotificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await NotificationService.markAllAsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      const response = await NotificationService.deleteNotification(notificationId);
      if (response.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Update unread count if deleted notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilter: 'all' | 'unread') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="notification-page">
        <div className="notification-loading">
          <div className="loading-spinner"></div>
          <p>加载通知中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-page">
      <div className="notification-page-header">
        <h1>消息通知</h1>
        <div className="notification-stats">
          {unreadCount > 0 && (
            <span className="unread-badge">
              {unreadCount} 条未读
            </span>
          )}
        </div>
      </div>

      <div className="notification-controls">
        <div className="notification-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            全部通知
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => handleFilterChange('unread')}
          >
            未读通知 {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            className="btn btn-secondary mark-all-read"
            onClick={handleMarkAllAsRead}
          >
            全部标记已读
          </button>
        )}
      </div>

      {error && (
        <div className="notification-error">
          <p>❌ {error}</p>
          <button className="btn btn-secondary" onClick={loadNotifications}>
            重试
          </button>
        </div>
      )}

      <div className="notification-content">
        {notifications.length === 0 ? (
          <div className="no-notifications-page">
            <div className="no-notifications-icon">🔔</div>
            <h3>
              {filter === 'unread' ? '没有未读通知' : '暂无通知'}
            </h3>
            <p>
              {filter === 'unread' 
                ? '所有通知都已查看' 
                : '当有人点赞或回复您的内容时，会在这里显示通知'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="notification-list-page">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item-page ${notification.is_read ? 'read' : 'unread'}`}
                >
                  <div className="notification-main">
                    <Link
                      to={NotificationService.getNotificationLink(notification)}
                      className="notification-link-page"
                    >
                      <div className="notification-icon-type">
                        {NotificationService.getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content-page">
                        <div className="notification-message-page">
                          {notification.message}
                        </div>
                        {notification.post?.title && (
                          <div className="notification-post-title-page">
                            《{notification.post.title}》
                          </div>
                        )}
                        <div className="notification-meta">
                          <span className="notification-time-page">
                            {NotificationService.formatTimeAgo(notification.created_at)}
                          </span>
                          {notification.sender && (
                            <span className="notification-sender">
                              来自 {notification.sender.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="notification-actions">
                    {!notification.is_read && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="标记为已读"
                      >
                        标记已读
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteNotification(notification.id)}
                      title="删除通知"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="notification-pagination">
                <button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  上一页
                </button>
                
                <div className="pagination-info">
                  第 {currentPage} 页，共 {totalPages} 页
                </div>
                
                <button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {loading && notifications.length > 0 && (
        <div className="notification-loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;