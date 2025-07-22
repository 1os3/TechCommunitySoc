import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import NotificationService, { NotificationItem } from '../../services/notificationService';
import './../../styles/notifications.css';

interface NotificationIconProps {
  className?: string;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ className = '' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await NotificationService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadRecentNotifications = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await NotificationService.getNotifications(1, 5);
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async () => {
    if (!isDropdownOpen) {
      await loadRecentNotifications();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMarkAsRead = async (notificationId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      const response = await NotificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        loadUnreadCount(); // Refresh count
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

  return (
    <div className={`notification-icon-container ${className}`} ref={dropdownRef}>
      <button
        className={`notification-icon ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={handleNotificationClick}
        aria-label={`通知 ${unreadCount > 0 ? `(${unreadCount}条未读)` : ''}`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h4>通知</h4>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                全部已读
              </button>
            )}
          </div>

          <div className="notification-dropdown-content">
            {loading ? (
              <div className="notification-loading">
                <div className="loading-spinner"></div>
                <p>加载中...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="no-notifications-icon">🔔</div>
                <p>暂无通知</p>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                  >
                    <Link
                      to={NotificationService.getNotificationLink(notification)}
                      className="notification-link"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="notification-icon-type">
                        {NotificationService.getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <div className="notification-message">
                          {notification.message}
                        </div>
                        {notification.post?.title && (
                          <div className="notification-post-title">
                            《{notification.post.title.length > 30 
                              ? notification.post.title.substring(0, 30) + '...' 
                              : notification.post.title}》
                          </div>
                        )}
                        <div className="notification-time">
                          {NotificationService.formatTimeAgo(notification.created_at)}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <button
                          className="mark-read-btn"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="标记为已读"
                        >
                          ●
                        </button>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="notification-dropdown-footer">
            <Link
              to="/notifications"
              className="view-all-notifications"
              onClick={() => setIsDropdownOpen(false)}
            >
              查看全部通知
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;