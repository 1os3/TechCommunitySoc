import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminService, LogEntry } from '../services/adminService';
import './Dashboard.css';

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalAdmins: number;
}

const Dashboard: React.FC = () => {
  const { user, adminStatus } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalAdmins: 0
  });
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load basic stats from actual APIs
        const [adminList, userList, postsStats, systemLogs, errorLogs] = await Promise.all([
          AdminService.getAdmins(),
          AdminService.getUsers(1, 1), // Just get first page to get total count
          AdminService.getPostsStats(),
          AdminService.getSystemLogs(1, 10),
          AdminService.getErrorLogs(5)
        ]);

        // Update stats
        setStats({
          totalUsers: userList?.total || 0,
          totalPosts: postsStats?.total || 0,
          totalAdmins: adminList?.total || 0,
        });

        // Combine and sort logs
        const allLogs = [
          ...(systemLogs?.logs || []),
          ...(errorLogs?.logs || [])
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
         .slice(0, 10);

        setRecentLogs(allLogs);
      } catch (error: any) {
        console.error('Failed to load dashboard data:', error?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      default:
        return '✅';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return '#ff4d4f';
      case 'warn':
        return '#faad14';
      default:
        return '#52c41a';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>加载仪表板数据...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">仪表板</h1>
      
      <div className="welcome-alert">
        <div className="alert-icon">✅</div>
        <div className="alert-content">
          <div className="alert-message">欢迎回来，{user?.username}！</div>
          <div className="alert-description">
            您的角色是：{adminStatus?.isSiteAdmin ? '站长' : '管理员'}。当前时间：{new Date().toLocaleString('zh-CN')}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon user-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">用户总数</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon post-icon">📄</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalPosts}</div>
            <div className="stat-label">帖子总数</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon admin-icon">👑</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalAdmins}</div>
            <div className="stat-label">管理员总数</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3 className="card-title">系统状态</h3>
          <div className="status-list">
            <div className="status-item">
              <div className="status-indicator success"></div>
              <span>数据库连接正常</span>
            </div>
            <div className="status-item">
              <div className="status-indicator success"></div>
              <span>API服务运行正常</span>
            </div>
            <div className="status-item">
              <div className="status-indicator success"></div>
              <span>认证服务正常</span>
            </div>
            <div className="status-item">
              <div className="status-indicator processing"></div>
              <span>日志系统运行中</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">最近日志</h3>
          {recentLogs.length > 0 ? (
            <div className="logs-list">
              {recentLogs.map((log, index) => (
                <div key={index} className="log-item">
                  <div className="log-time">
                    {new Date(log.timestamp).toLocaleString('zh-CN')}
                  </div>
                  <div className="log-content">
                    <span 
                      className="log-level"
                      style={{ color: getLogColor(log.level) }}
                    >
                      {getLogIcon(log.level)} {log.level.toUpperCase()}
                    </span>
                    <span className="log-message">
                      {typeof log.message === 'string' ? log.message : JSON.stringify(log.message)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>暂无日志数据</p>
            </div>
          )}
        </div>
      </div>

      <div className="quick-actions-card">
        <h3 className="card-title">快速操作</h3>
        <div className="quick-actions">
          <span className="action-icon">🕐</span>
          <span>今日操作：查看日志、管理用户、审核内容</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;