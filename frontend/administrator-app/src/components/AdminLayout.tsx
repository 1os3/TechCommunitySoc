import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, adminStatus, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: '📊',
      label: '仪表板',
    },
    {
      key: '/users',
      icon: '👥',
      label: '用户管理',
    },
    {
      key: '/content',
      icon: '📄',
      label: '内容管理',
    },
    {
      key: '/logs',
      icon: '📋',
      label: '日志管理',
    },
  ];

  // Add admin management for site admins
  if (adminStatus?.isSiteAdmin) {
    menuItems.push({
      key: '/admin-management',
      icon: '👑',
      label: '管理员管理',
    });
  }

  const onMenuClick = (key: string) => {
    navigate(key);
  };

  // Function to truncate long usernames
  const truncateUsername = (username: string, maxLength: number = 12) => {
    if (username.length <= maxLength) return username;
    return username.substring(0, maxLength) + '...';
  };

  return (
    <div className="admin-layout">
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            {collapsed ? 'TC' : 'Tech Community'}
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.key} className="nav-item">
              <div 
                className={`nav-link ${location.pathname === item.key || location.pathname.startsWith(item.key + '/') ? 'active' : ''}`}
                onClick={() => onMenuClick(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </div>
              
            </div>
          ))}
        </nav>
      </div>

      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <header className="main-header">
          <div className="header-left">
            <button 
              className="collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? '☰' : '✕'}
            </button>
            <h1>管理后台</h1>
          </div>

          <div className="header-right">
            <div className="user-menu">
              <div className="user-avatar">👤</div>
              <div className="user-info">
                <div className="username" title={user?.username}>
                  {truncateUsername(user?.username || '', 15)}
                </div>
                <div className="user-role">
                  {adminStatus?.isSiteAdmin ? '站长' : '管理员'}
                </div>
              </div>
              <div className="user-dropdown">
                <button onClick={handleLogout} className="logout-btn">
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;