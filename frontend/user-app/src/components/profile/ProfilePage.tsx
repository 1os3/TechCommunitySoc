import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserPosts from './UserPosts';
import UserComments from './UserComments';
import AccountSettings from './AccountSettings';
import './../../styles/profile.css';

type TabType = 'posts' | 'comments' | 'settings';

const ProfilePage: React.FC = () => {
  const { state: authState } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  if (!authState.user) {
    return (
      <div className="profile-error">
        <p>用户信息加载失败</p>
      </div>
    );
  }

  const renderTabContent = () => {
    if (!authState.user) return null;
    
    switch (activeTab) {
      case 'posts':
        return <UserPosts userId={authState.user.id} />;
      case 'comments':
        return <UserComments userId={authState.user.id} />;
      case 'settings':
        return <AccountSettings />;
      default:
        return <UserPosts userId={authState.user.id} />;
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="user-avatar">
            {authState.user.avatar_url ? (
              <img src={authState.user.avatar_url} alt={authState.user.username} />
            ) : (
              <div className="avatar-placeholder">
                {authState.user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-info">
            <h1>{authState.user.username}</h1>
            <p className="user-email">{authState.user.email}</p>
            <div className="user-status">
              <span className={`status-badge ${authState.user.is_verified ? 'verified' : 'unverified'}`}>
                {authState.user.is_verified ? '✓ 已验证' : '⚠ 未验证'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-nav">
          <button
            className={`nav-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            📝 我的帖子
          </button>
          <button
            className={`nav-tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            💬 我的评论
          </button>
          <button
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ 账号设置
          </button>
        </div>

        <div className="profile-tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;