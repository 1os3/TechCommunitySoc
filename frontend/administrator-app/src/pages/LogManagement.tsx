import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminService, LogEntry } from '../services/adminService';
import './LogManagement.css';

interface LogData {
  logs: LogEntry[];
  total: number;
}

const LogManagement: React.FC = () => {
  const location = useLocation();
  
  // Determine the initial tab based on the current route
  const getInitialTab = (): 'system' | 'errors' | 'admin' => {
    const pathname = location.pathname;
    if (pathname.includes('/logs/errors')) return 'errors';
    if (pathname.includes('/logs/admin-activity')) return 'admin';
    return 'system';
  };

  const [currentTab, setCurrentTab] = useState<'system' | 'errors' | 'admin'>(getInitialTab());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // System logs state
  const [systemLogs, setSystemLogs] = useState<LogData>({ logs: [], total: 0 });
  const [systemPage, setSystemPage] = useState(1);
  const [systemLevel, setSystemLevel] = useState('');
  const [systemStartDate, setSystemStartDate] = useState('');
  const [systemEndDate, setSystemEndDate] = useState('');
  
  // Error logs state
  const [errorLogs, setErrorLogs] = useState<LogData>({ logs: [], total: 0 });
  
  // Admin activity logs state
  const [adminLogs, setAdminLogs] = useState<LogData>({ logs: [], total: 0 });
  
  // Log cleanup state
  const [showCleanupForm, setShowCleanupForm] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleanupLevel, setCleanupLevel] = useState('');
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const limit = 50;

  // Fetch functions
  const fetchSystemLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminService.getSystemLogs(
        systemPage, 
        limit, 
        systemLevel || undefined,
        systemStartDate || undefined,
        systemEndDate || undefined
      );
      
      if (response) {
        setSystemLogs({
          logs: response.logs || [],
          total: response.total || 0
        });
      } else {
        setError('获取系统日志失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchErrorLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminService.getErrorLogs(limit);
      
      if (response) {
        setErrorLogs({
          logs: response.logs || [],
          total: response.total || 0
        });
      } else {
        setError('获取错误日志失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminService.getAdminActivityLogs(limit);
      
      if (response) {
        setAdminLogs({
          logs: response.logs || [],
          total: response.total || 0
        });
      } else {
        setError('获取管理员日志失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // Effect hooks
  useEffect(() => {
    // Update tab when route changes
    setCurrentTab(getInitialTab());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (currentTab === 'system') {
      fetchSystemLogs();
    } else if (currentTab === 'errors') {
      fetchErrorLogs();
    } else if (currentTab === 'admin') {
      fetchAdminLogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, systemPage]);

  // Log cleanup handlers
  const handleClearLogs = async () => {
    if (!window.confirm(`确定要清除${cleanupDays}天前的${cleanupLevel || '所有'}日志吗？此操作不可撤销。`)) {
      return;
    }

    setCleanupLoading(true);
    try {
      const response = await AdminService.clearLogs({
        olderThanDays: cleanupDays,
        level: cleanupLevel || undefined
      });

      if (response?.success) {
        alert(`清除成功！删除了 ${response.data?.removedCount || 0} 条日志。`);
        setShowCleanupForm(false);
        // Refresh current tab data
        if (currentTab === 'system') {
          fetchSystemLogs();
        } else if (currentTab === 'errors') {
          fetchErrorLogs();
        } else if (currentTab === 'admin') {
          fetchAdminLogs();
        }
      } else {
        setError(response?.error || '清除日志失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleClearAllLogs = async () => {
    if (!window.confirm('⚠️ 警告：确定要清除所有日志吗？这将删除所有系统、错误和管理员日志！\n\n此操作不可撤销，请谨慎操作。')) {
      return;
    }

    // 二次确认
    if (!window.confirm('最后确认：真的要清除所有日志吗？点击确定将立即执行。')) {
      return;
    }

    setCleanupLoading(true);
    try {
      const response = await AdminService.clearAllLogs();

      if (response?.success) {
        alert(`🔥 所有日志已清除！删除了 ${response.data?.removedCount || 0} 条日志。`);
        // Refresh all tab data
        setSystemLogs({ logs: [], total: 0 });
        setErrorLogs({ logs: [], total: 0 });
        setAdminLogs({ logs: [], total: 0 });
      } else {
        setError(response?.error || '清除所有日志失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setCleanupLoading(false);
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📄';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return '#ff4d4f';
      case 'warn':
        return '#faad14';
      case 'info':
        return '#1890ff';
      default:
        return '#666666';
    }
  };

  const renderLogList = (logs: LogEntry[]) => {
    if (logs.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>暂无日志数据</p>
        </div>
      );
    }

    return (
      <div className="logs-list">
        {logs.map((log, index) => (
          <div key={`${log.timestamp}-${index}`} className="log-item">
            <div className="log-header">
              <div className="log-level-indicator">
                <span 
                  className="log-level"
                  style={{ color: getLogColor(log.level) }}
                >
                  {getLogIcon(log.level)} {log.level.toUpperCase()}
                </span>
                <span className="log-time">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            </div>
            <div className="log-content">
              <div className="log-message">
                {typeof log.message === 'string' ? log.message : JSON.stringify(log.message)}
              </div>
              {log.service && (
                <div className="log-service">
                  服务: {log.service}
                </div>
              )}
              {log.userId && (
                <div className="log-user">
                  用户ID: {log.userId}
                </div>
              )}
              {log.stack && (
                <details className="log-stack">
                  <summary>错误堆栈</summary>
                  <pre>{log.stack}</pre>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="log-management">
      <div className="page-header">
        <h1>系统日志管理</h1>
        <p>查看和管理系统运行日志</p>
        <div className="header-actions">
          <button
            className="cleanup-button"
            onClick={() => setShowCleanupForm(!showCleanupForm)}
          >
            🗑️ 日志清理
          </button>
          <button
            className="clear-all-button"
            onClick={handleClearAllLogs}
            disabled={cleanupLoading}
          >
            🔥 清除所有日志
          </button>
        </div>
      </div>

      {/* Log Cleanup Form */}
      {showCleanupForm && (
        <div className="cleanup-form-card">
          <h3>日志清理设置</h3>
          <div className="cleanup-form">
            <div className="form-row">
              <label>清理时间范围:</label>
              <div className="input-group">
                <input
                  type="number"
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
                  min="1"
                  className="form-input"
                />
                <span>天前的日志</span>
              </div>
            </div>
            <div className="form-row">
              <label>日志级别过滤:</label>
              <select
                value={cleanupLevel}
                onChange={(e) => setCleanupLevel(e.target.value)}
                className="form-select"
              >
                <option value="">全部级别</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="form-actions">
              <button
                className="clear-button"
                onClick={handleClearLogs}
                disabled={cleanupLoading}
              >
                {cleanupLoading ? '清理中...' : '开始清理'}
              </button>
              <button
                className="cancel-button"
                onClick={() => setShowCleanupForm(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${currentTab === 'system' ? 'active' : ''}`}
          onClick={() => setCurrentTab('system')}
        >
          系统日志
        </button>
        <button
          className={`tab-button ${currentTab === 'errors' ? 'active' : ''}`}
          onClick={() => setCurrentTab('errors')}
        >
          错误日志
        </button>
        <button
          className={`tab-button ${currentTab === 'admin' ? 'active' : ''}`}
          onClick={() => setCurrentTab('admin')}
        >
          管理员日志
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {currentTab === 'system' && (
          <div className="system-logs-tab">
            <div className="filters-section">
              <div className="filters-form">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>日志级别:</label>
                    <select
                      value={systemLevel}
                      onChange={(e) => setSystemLevel(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">全部</option>
                      <option value="info">Info</option>
                      <option value="warn">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>开始日期:</label>
                    <input
                      type="datetime-local"
                      value={systemStartDate}
                      onChange={(e) => setSystemStartDate(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-group">
                    <label>结束日期:</label>
                    <input
                      type="datetime-local"
                      value={systemEndDate}
                      onChange={(e) => setSystemEndDate(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  <button className="filter-button" onClick={fetchSystemLogs}>
                    筛选
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading-message">加载中...</div>
            ) : (
              renderLogList(systemLogs.logs)
            )}

            {/* Pagination for system logs */}
            {Math.ceil(systemLogs.total / limit) > 1 && (
              <div className="pagination">
                <button
                  className="pagination-button"
                  disabled={systemPage === 1}
                  onClick={() => setSystemPage(systemPage - 1)}
                >
                  上一页
                </button>
                <span className="pagination-info">
                  第 {systemPage} 页 / 共 {Math.ceil(systemLogs.total / limit)} 页
                </span>
                <button
                  className="pagination-button"
                  disabled={systemPage === Math.ceil(systemLogs.total / limit)}
                  onClick={() => setSystemPage(systemPage + 1)}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}

        {currentTab === 'errors' && (
          <div className="error-logs-tab">
            <div className="tab-info">
              <h3>最近的错误日志 (最多 {limit} 条)</h3>
              <p>显示系统中最近发生的错误和异常</p>
            </div>
            
            {loading ? (
              <div className="loading-message">加载中...</div>
            ) : (
              renderLogList(errorLogs.logs)
            )}
          </div>
        )}

        {currentTab === 'admin' && (
          <div className="admin-logs-tab">
            <div className="tab-info">
              <h3>管理员操作日志 (最多 {limit} 条)</h3>
              <p>显示管理员的操作记录和活动</p>
            </div>
            
            {loading ? (
              <div className="loading-message">加载中...</div>
            ) : (
              renderLogList(adminLogs.logs)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogManagement;