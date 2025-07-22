import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AccountDeleteData {
  password: string;
  confirmation: string;
}

const AccountSettings: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState<'password' | 'delete' | null>(null);
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deleteData, setDeleteData] = useState<AccountDeleteData>({
    password: '',
    confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('新密码确认不匹配');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('新密码长度至少6位');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1'}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('密码修改成功');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setActiveSection(null);
      } else {
        setError(data.message || '密码修改失败');
      }
    } catch (err) {
      setError('密码修改时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (deleteData.confirmation !== '删除我的账号') {
      setError('请正确输入确认文本');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1'}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({
          password: deleteData.password
        })
      });

      const data = await response.json();
      
      if (data.success) {
        logout();
        navigate('/register');
      } else {
        setError(data.message || '账号删除失败');
      }
    } catch (err) {
      setError('账号删除时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="account-settings">
      <div className="settings-header">
        <h3>账号设置</h3>
      </div>

      {error && (
        <div className="error-banner">
          <p>❌ {error}</p>
          <button className="close-btn" onClick={clearMessages}>×</button>
        </div>
      )}

      {success && (
        <div className="success-banner">
          <p>✅ {success}</p>
          <button className="close-btn" onClick={clearMessages}>×</button>
        </div>
      )}

      <div className="settings-sections">
        <div className="settings-section">
          <div className="section-header">
            <h4>🔒 密码管理</h4>
            <p>修改您的登录密码</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
          >
            {activeSection === 'password' ? '取消' : '修改密码'}
          </button>
        </div>

        {activeSection === 'password' && (
          <div className="settings-form">
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="currentPassword">当前密码</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value
                  })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword">新密码</label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value
                  })}
                  minLength={6}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">确认新密码</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value
                  })}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '修改中...' : '确认修改'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="settings-section">
          <div className="section-header">
            <h4>🚪 退出登录</h4>
            <p>退出当前账号</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleLogout}
          >
            退出登录
          </button>
        </div>

        <div className="settings-section danger-section">
          <div className="section-header">
            <h4>⚠️ 危险操作</h4>
            <p>删除账号将无法恢复</p>
          </div>
          <button
            className="btn btn-danger"
            onClick={() => setActiveSection(activeSection === 'delete' ? null : 'delete')}
          >
            {activeSection === 'delete' ? '取消' : '删除账号'}
          </button>
        </div>

        {activeSection === 'delete' && (
          <div className="settings-form danger-form">
            <div className="warning-box">
              <h5>⚠️ 警告</h5>
              <p>删除账号将会：</p>
              <ul>
                <li>永久删除您的账号和个人信息</li>
                <li>删除您发布的所有帖子和评论</li>
                <li>此操作无法撤销</li>
              </ul>
            </div>
            
            <form onSubmit={handleAccountDelete}>
              <div className="form-group">
                <label htmlFor="deletePassword">输入当前密码确认</label>
                <input
                  type="password"
                  id="deletePassword"
                  value={deleteData.password}
                  onChange={(e) => setDeleteData({
                    ...deleteData,
                    password: e.target.value
                  })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deleteConfirmation">
                  输入 <strong>"删除我的账号"</strong> 确认删除
                </label>
                <input
                  type="text"
                  id="deleteConfirmation"
                  value={deleteData.confirmation}
                  onChange={(e) => setDeleteData({
                    ...deleteData,
                    confirmation: e.target.value
                  })}
                  placeholder="删除我的账号"
                  required
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-danger"
                  disabled={loading || deleteData.confirmation !== '删除我的账号'}
                >
                  {loading ? '删除中...' : '确认删除账号'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;