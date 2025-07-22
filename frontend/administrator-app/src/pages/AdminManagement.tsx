import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { AdminUser } from '../types/admin';
import './AdminManagement.css';

const AdminManagement: React.FC = () => {
  const { adminStatus } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Fetch admins list
  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminService.getAdmins();
      if (response) {
        // Filter out the site admin from the list to prevent accidental deletion
        const filteredAdmins = response.admins.filter(admin => 
          admin.username !== 'aarch64qwe10900fuziruiwork0' && 
          admin.email !== 'bnbyhanqca1x@outlook.com'
        );
        setAdmins(filteredAdmins);
      } else {
        setError('获取管理员列表失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is site admin
    if (adminStatus?.isSiteAdmin) {
      fetchAdmins();
    }
  }, [adminStatus]);

  // Create new admin with auto-generated admin number
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setCreateLoading(true);
    setError(null);
    
    try {
      // Get existing admin numbers to find the next available number
      const adminList = await AdminService.getAdmins();
      if (!adminList) {
        setError('获取管理员列表失败，无法自动生成编号');
        setCreateLoading(false);
        return;
      }
      
      // Extract admin numbers from usernames
      const usedNumbers = new Set<number>();
      const regex = /Adminqwe10900fuzirui(\d+)/;
      
      adminList.admins.forEach(admin => {
        const match = admin.username.match(regex);
        if (match && match[1]) {
          usedNumbers.add(parseInt(match[1]));
        }
      });
      
      // Find the next available number between 1-2000
      let nextAdminNum = 1;
      while (usedNumbers.has(nextAdminNum) && nextAdminNum <= 2000) {
        nextAdminNum++;
      }
      
      if (nextAdminNum > 2000) {
        setError('已达到管理员编号上限（2000）');
        setCreateLoading(false);
        return;
      }
      
      // Generate username and email according to the guide
      const username = `Adminqwe10900fuzirui${nextAdminNum}`;
      const email = `kinyjctaqt63${nextAdminNum}@hotmail.com`;
      
      const response = await AdminService.createAdmin({
        username: username,
        email: email
      });

      if (response.success) {
        alert(`管理员账户创建成功！\n用户名: ${username}\n邮箱: ${email}\n密码: lQ95/y/WIMj+bAMq4Weh1A==`);
        setShowCreateForm(false);
        fetchAdmins(); // Refresh admin list
      } else {
        setError(response.error || '创建管理员失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete admin
  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.isSiteAdmin) {
      alert('不能删除站长账户');
      return;
    }

    if (!window.confirm(`确定要删除管理员 "${admin.username}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const response = await AdminService.deleteAdmin(admin.id);

      if (response.success) {
        alert('管理员删除成功');
        fetchAdmins(); // Refresh admin list
      } else {
        setError(response.error || '删除管理员失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    }
  };

  // Check if current user is site admin
  if (!adminStatus?.isSiteAdmin) {
    return (
      <div className="admin-management access-denied">
        <div className="access-denied-content">
          <div className="access-denied-icon">🚫</div>
          <h2>访问受限</h2>
          <p>只有站长才能访问管理员管理功能</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="admin-management">
      <div className="page-header">
        <h1>管理员管理</h1>
        <p>管理系统管理员账户</p>
        <div className="header-actions">
          <button
            className="create-admin-button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={loading}
          >
            ➕ 添加管理员
          </button>
        </div>
      </div>

      {/* Create Admin Form */}
      {showCreateForm && (
        <div className="create-admin-form-card">
          <h3>创建新管理员</h3>
          <form onSubmit={handleCreateAdmin} className="create-admin-form">
            <div className="form-info">
              <p><strong>账号规则说明：</strong></p>
              <ul>
                <li>用户名格式：Adminqwe10900fuzirui[编号]</li>
                <li>邮箱格式：kinyjctaqt63[编号]@hotmail.com</li>
                <li>统一密码：lQ95/y/WIMj+bAMq4Weh1A==</li>
                <li>编号范围：1-2000</li>
                <li><strong>编号将自动生成，系统会选择下一个可用的编号</strong></li>
              </ul>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="auto-generate-info">
                  <p><strong>自动生成管理员账号</strong></p>
                  <p>系统将自动分配下一个可用的管理员编号 (1-2000)</p>
                  <p>点击"创建管理员"按钮完成创建</p>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={createLoading}
              >
                {createLoading ? '创建中...' : '创建管理员'}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowCreateForm(false);
                  setError(null);
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Admin List */}
      <div className="admin-list-section">
        <h2>管理员列表</h2>
        
        {loading ? (
          <div className="loading-message">加载中...</div>
        ) : admins.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>暂无管理员数据</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>权限类型</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className={admin.isSiteAdmin ? 'site-admin-row' : ''}>
                    <td>{admin.id}</td>
                    <td>
                      <div className="admin-info">
                        <span className="admin-username">{admin.username}</span>
                        {admin.isSiteAdmin && (
                          <span className="site-admin-badge">👑 站长</span>
                        )}
                      </div>
                    </td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`role-badge ${admin.isSiteAdmin ? 'site-admin' : 'admin'}`}>
                        {admin.isSiteAdmin ? '站长' : '管理员'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${(admin.isDeleted || admin.is_deleted) ? 'deleted' : 'active'}`}>
                        {(admin.isDeleted || admin.is_deleted) ? '已删除' : '正常'}
                      </span>
                    </td>
                    <td>{formatDate(admin.createdAt || admin.created_at || '')}</td>
                    <td>
                      <div className="action-buttons">
                        {!admin.isSiteAdmin && !(admin.isDeleted || admin.is_deleted) && (
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteAdmin(admin)}
                            title="删除管理员"
                          >
                            🗑️ 删除
                          </button>
                        )}
                        {admin.isSiteAdmin && (
                          <span className="no-action-text">不可操作</span>
                        )}
                        {(admin.isDeleted || admin.is_deleted) && (
                          <span className="deleted-text">已删除</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;