import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import api from '../services/api';
import './UserManagement.css';

interface User {
  id: number;
  username: string;
  email: string;
  is_verified?: boolean;
  is_admin?: boolean;
  is_active?: boolean;
  role?: string;
  created_at?: string;
  last_login?: string;
}

interface SearchUser {
  id: number;
  username: string;
  avatar_url?: string;
  postCount: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [enableLoading, setEnableLoading] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<'active' | 'disabled'>('active');
  const [disabledUsers, setDisabledUsers] = useState<User[]>([]);
  const [disabledCurrentPage, setDisabledCurrentPage] = useState(1);
  const [totalDisabledUsers, setTotalDisabledUsers] = useState(0);
  const [restoreLoading, setRestoreLoading] = useState<number | null>(null);
  const [disabledSearchTerm, setDisabledSearchTerm] = useState('');
  const [disabledSearchLoading, setDisabledSearchLoading] = useState(false);
  const [isDisabledSearchMode, setIsDisabledSearchMode] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    if (!isSearchMode) {
      if (currentTab === 'active') {
        loadUsers(currentPage);
      } else {
        loadDisabledUsers(disabledCurrentPage);
      }
    }
  }, [currentPage, disabledCurrentPage, currentTab, isSearchMode]);

  useEffect(() => {
    if (currentTab === 'disabled' && !isSearchMode) {
      loadDisabledUsers(disabledCurrentPage);
    }
  }, [currentTab]);

  const loadUsers = async (page: number) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await AdminService.getUsers(page, pageSize);
      
      if (result) {
        setUsers(result.users || []);
        setTotalUsers(result.total || 0);
      } else {
        setError('获取用户列表失败');
        setUsers([]);
      }
    } catch (error) {
      console.error('Load users error:', error);
      setError('获取用户列表失败');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDisabledUsers = async (page: number, searchQuery?: string) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await AdminService.getSoftDeletedUsers(page, pageSize, searchQuery);
      
      if (result) {
        setDisabledUsers(result.users || []);
        setTotalDisabledUsers(result.total || 0);
      } else {
        setError('获取被禁用用户列表失败');
        setDisabledUsers([]);
      }
    } catch (error) {
      console.error('Load disabled users error:', error);
      setError('获取被禁用用户列表失败');
      setDisabledUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const searchDisabledUsers = async (query: string) => {
    if (!query.trim()) {
      setIsDisabledSearchMode(false);
      loadDisabledUsers(1);
      return;
    }

    try {
      setDisabledSearchLoading(true);
      setError('');
      
      const result = await AdminService.getSoftDeletedUsers(1, pageSize, query.trim());
      
      if (result) {
        setDisabledUsers(result.users || []);
        setTotalDisabledUsers(result.total || 0);
        setIsDisabledSearchMode(true);
        setDisabledCurrentPage(1);
      } else {
        setError('搜索被禁用用户失败');
        setDisabledUsers([]);
      }
    } catch (error) {
      console.error('Search disabled users error:', error);
      setError('搜索被禁用用户失败');
      setDisabledUsers([]);
    } finally {
      setDisabledSearchLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setError('');
      
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}&limit=50`);
      
      if (response.data.success) {
        setSearchResults(response.data.data.users || []);
        setIsSearchMode(true);
      } else {
        setError('搜索用户失败');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search users error:', error);
      setError('搜索用户失败');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDisabledSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabledSearchTerm.trim()) {
      searchDisabledUsers(disabledSearchTerm.trim());
    } else {
      setIsDisabledSearchMode(false);
      loadDisabledUsers(1);
    }
  };

  const handleDisabledSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisabledSearchTerm(value);
    
    // Auto search when input is cleared
    if (!value.trim()) {
      setIsDisabledSearchMode(false);
      loadDisabledUsers(1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      searchUsers(searchTerm.trim());
    } else {
      setIsSearchMode(false);
      setSearchResults([]);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Auto search when input is cleared
    if (!value.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`确定要禁用用户 "${username}" 吗？`)) {
      return;
    }

    try {
      setDeleteLoading(userId);
      setError('');
      
      const result = await AdminService.deleteUser(userId);
      
      if (result.success) {
        // Refresh the current view
        if (isSearchMode && searchTerm.trim()) {
          await searchUsers(searchTerm.trim());
        } else if (currentTab === 'active') {
          await loadUsers(currentPage);
        }
        // Also refresh disabled users count
        if (currentTab !== 'disabled') {
          await loadDisabledUsers(1);
        }
        
        alert('用户禁用成功');
      } else {
        setError(result.error || '禁用用户失败');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      setError('禁用用户失败');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEnableUser = async (userId: number, username: string) => {
    if (!window.confirm(`确定要启用用户 "${username}" 吗？`)) {
      return;
    }

    try {
      setEnableLoading(userId);
      setError('');
      
      const result = await AdminService.enableUser(userId);
      
      if (result.success) {
        // Refresh the current view
        if (isSearchMode && searchTerm.trim()) {
          await searchUsers(searchTerm.trim());
        } else if (currentTab === 'active') {
          await loadUsers(currentPage);
        }
        
        alert('用户启用成功');
      } else {
        setError(result.error || '启用用户失败');
      }
    } catch (error) {
      console.error('Enable user error:', error);
      setError('启用用户失败');
    } finally {
      setEnableLoading(null);
    }
  };

  const handleRestoreUser = async (userId: number, username: string) => {
    if (!window.confirm(`确定要恢复用户 "${username}" 吗？`)) {
      return;
    }

    try {
      setRestoreLoading(userId);
      setError('');
      
      const result = await AdminService.restoreUser(userId);
      
      if (result.success) {
        // Refresh the disabled users list
        await loadDisabledUsers(disabledCurrentPage);
        // Also refresh active users count
        await loadUsers(1);
        
        alert('用户恢复成功');
      } else {
        setError(result.error || '恢复用户失败');
      }
    } catch (error) {
      console.error('Restore user error:', error);
      setError('恢复用户失败');
    } finally {
      setRestoreLoading(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const formatUserRole = (user: User) => {
    if (user.role === 'admin' || user.is_admin) {
      return '管理员';
    }
    return '普通用户';
  };

  const getUserStatus = (user: User) => {
    if (user.is_active === false) {
      return '已禁用';
    }
    return user.is_verified ? '已验证' : '未验证';
  };

  const getUserStatusClass = (user: User) => {
    if (user.is_active === false) {
      return 'disabled';
    }
    return user.is_verified ? 'verified' : 'unverified';
  };

  const totalPages = currentTab === 'active' 
    ? Math.ceil(totalUsers / pageSize) 
    : Math.ceil(totalDisabledUsers / pageSize);

  const currentPageState = currentTab === 'active' ? currentPage : disabledCurrentPage;
  const setCurrentPageState = currentTab === 'active' ? setCurrentPage : setDisabledCurrentPage;

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>用户管理</h1>
        <p>管理系统中的所有用户账户</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${currentTab === 'active' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('active');
            setIsSearchMode(false);
            setSearchTerm('');
            setSearchResults([]);
          }}
        >
          活跃用户 ({totalUsers})
        </button>
        <button
          className={`tab-button ${currentTab === 'disabled' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('disabled');
            setIsSearchMode(false);
            setSearchTerm('');
            setSearchResults([]);
          }}
        >
          被禁用用户 ({totalDisabledUsers})
        </button>
      </div>

      {/* Search Section */}
      {(currentTab === 'active' || currentTab === 'disabled') && (
        <div className="search-section">
          {currentTab === 'active' ? (
            <>
              <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-group">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    placeholder="搜索用户名..."
                    className="search-input"
                  />
                  <button 
                    type="submit" 
                    className="search-button"
                    disabled={searchLoading}
                  >
                    {searchLoading ? '搜索中...' : '搜索'}
                  </button>
                </div>
              </form>
              
              {isSearchMode && (
                <div className="search-info">
                  <span>搜索结果: "{searchTerm}" ({searchResults.length} 个用户)</span>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearchMode(false);
                      setSearchResults([]);
                    }}
                    className="clear-search-button"
                  >
                    清除搜索
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <form onSubmit={handleDisabledSearch} className="search-form">
                <div className="search-input-group">
                  <input
                    type="text"
                    value={disabledSearchTerm}
                    onChange={handleDisabledSearchInputChange}
                    placeholder="搜索被禁用用户名..."
                    className="search-input"
                  />
                  <button 
                    type="submit" 
                    className="search-button"
                    disabled={disabledSearchLoading}
                  >
                    {disabledSearchLoading ? '搜索中...' : '搜索'}
                  </button>
                </div>
              </form>
              
              {isDisabledSearchMode && (
                <div className="search-info">
                  <span>搜索结果: "{disabledSearchTerm}" ({disabledUsers.length} 个用户)</span>
                  <button 
                    onClick={() => {
                      setDisabledSearchTerm('');
                      setIsDisabledSearchMode(false);
                      loadDisabledUsers(1);
                    }}
                    className="clear-search-button"
                  >
                    清除搜索
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* User List */}
      <div className="user-list-section">
        {loading ? (
          <div className="loading-message">加载中...</div>
        ) : (
          <>
            {isSearchMode && currentTab === 'active' ? (
              /* Search Results - Only for active users */
              <div className="user-table">
                <table>
                  <thead>
                    <tr>
                      <th>用户ID</th>
                      <th>用户名</th>
                      <th>发帖数</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>
                            <div className="user-info">
                              <div className="user-avatar">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="头像" />
                                ) : (
                                  <span>👤</span>
                                )}
                              </div>
                              <span>{user.username}</span>
                            </div>
                          </td>
                          <td>{user.postCount}</td>
                          <td>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              disabled={deleteLoading === user.id}
                              className="delete-button"
                            >
                              {deleteLoading === user.id ? '禁用中...' : '禁用'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="no-data">
                          未找到匹配的用户
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : currentTab === 'active' ? (
              /* Active User List */
              <div className="user-table">
                <table>
                  <thead>
                    <tr>
                      <th>用户ID</th>
                      <th>用户名</th>
                      <th>邮箱</th>
                      <th>角色</th>
                      <th>状态</th>
                      <th>注册时间</th>
                      <th>最后登录</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`role-badge ${user.role || 'user'}`}>
                              {formatUserRole(user)}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${getUserStatusClass(user)}`}>
                              {getUserStatus(user)}
                            </span>
                          </td>
                          <td>{formatDate(user.created_at)}</td>
                          <td>{user.last_login ? formatDate(user.last_login) : '从未登录'}</td>
                          <td>
                            {!user.is_admin && (
                              <div className="user-actions">
                                {user.is_active === false ? (
                                  <button
                                    onClick={() => handleEnableUser(user.id, user.username)}
                                    disabled={enableLoading === user.id}
                                    className="enable-button"
                                  >
                                    {enableLoading === user.id ? '启用中...' : '启用'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                    disabled={deleteLoading === user.id}
                                    className="delete-button"
                                  >
                                    {deleteLoading === user.id ? '禁用中...' : '禁用'}
                                  </button>
                                )}
                              </div>
                            )}
                            {user.is_admin && (
                              <span className="admin-note">管理员账户</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="no-data">
                          暂无用户数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Disabled User List */
              <div className="user-table">
                <table>
                  <thead>
                    <tr>
                      <th>用户ID</th>
                      <th>原用户名</th>
                      <th>原邮箱</th>
                      <th>角色</th>
                      <th>禁用时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disabledUsers.length > 0 ? (
                      disabledUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>
                            <span className="disabled-info">
                              {user.username}
                            </span>
                          </td>
                          <td>
                            <span className="disabled-info">
                              {user.email}
                            </span>
                          </td>
                          <td>
                            <span className={`role-badge ${user.role || 'user'}`}>
                              {formatUserRole(user)}
                            </span>
                          </td>
                          <td>{formatDate(user.created_at)}</td>
                          <td>
                            {!user.is_admin && (
                              <button
                                onClick={() => handleRestoreUser(user.id, user.username || '')}
                                disabled={restoreLoading === user.id}
                                className="restore-button"
                              >
                                {restoreLoading === user.id ? '恢复中...' : '恢复'}
                              </button>
                            )}
                            {user.is_admin && (
                              <span className="admin-note">管理员账户</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="no-data">
                          暂无被禁用的用户
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {(!isSearchMode && !isDisabledSearchMode) && totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPageState(prev => Math.max(1, prev - 1))}
                  disabled={currentPageState === 1}
                  className="pagination-button"
                >
                  上一页
                </button>
                
                <span className="pagination-info">
                  第 {currentPageState} 页 / 共 {totalPages} 页 (总计 {currentTab === 'active' ? totalUsers : totalDisabledUsers} 个用户)
                </span>
                
                <button
                  onClick={() => setCurrentPageState(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPageState === totalPages}
                  className="pagination-button"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagement;