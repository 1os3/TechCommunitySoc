import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import './CommentManagement.css';

interface Comment {
  id: number;
  content: string;
  author: string;
  author_id: number;
  post_title: string;
  post_id: number;
  parent_id: number | null;
  like_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface Violation {
  id: number;
  user_id: number;
  content_type: 'post' | 'comment';
  content_id: number;
  violation_word_id: number;
  matched_text: string;
  content_snippet: string;
  detected_at: string;
  status: 'pending' | 'reviewed' | 'ignored';
  reviewed_by?: number;
  reviewed_at?: string;
  notes?: string;
  user?: {
    id: number;
    username: string;
  };
  violation_word?: {
    id: number;
    word: string;
    is_regex: boolean;
  };
}

interface ViolationStats {
  userId: number;
  username: string;
  violationCount: number;
  lastViolation: string;
}

const CommentManagement: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [violationStats, setViolationStats] = useState<ViolationStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters for comments
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'deleted'
  const [postFilter, setPostFilter] = useState(''); // filter by post ID
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters for violations
  const [violationStatus, setViolationStatus] = useState<'pending' | 'reviewed' | 'ignored' | ''>('');
  const [violationPage, setViolationPage] = useState(1);
  const [violationTotalPages, setViolationTotalPages] = useState(1);

  const [activeTab, setActiveTab] = useState<'comments' | 'violations'>('comments');

  const limit = 20;

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminService.getComments({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        postId: postFilter || undefined
      });

      if (response.success) {
        setComments(response.data.comments);
        setTotalPages(Math.ceil(response.data.total / limit));
      } else {
        setError(response.error || '获取评论失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchViolations = async () => {
    setViolationsLoading(true);
    try {
      const response = await AdminService.getViolations({
        page: violationPage,
        limit,
        status: violationStatus || undefined
      });

      if (response.success) {
        setViolations(response.data.violations);
        setViolationTotalPages(Math.ceil(response.data.total / limit));
      }
    } catch (err) {
      console.error('获取违规记录失败:', err);
    } finally {
      setViolationsLoading(false);
    }
  };

  const fetchViolationStats = async () => {
    try {
      const response = await AdminService.getViolationStats(10, 15);
      if (response.success) {
        setViolationStats(response.data.stats);
      }
    } catch (err) {
      console.error('获取违规统计失败:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    } else {
      fetchViolations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, violationPage, statusFilter, violationStatus]);

  useEffect(() => {
    fetchViolationStats();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchComments();
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('确定要删除这个评论吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await AdminService.deleteComment(commentId);
      if (response.success) {
        fetchComments(); // 刷新列表
      } else {
        setError(response.error || '删除评论失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    }
  };

  const handleUpdateViolationStatus = async (
    violationId: number, 
    status: 'pending' | 'reviewed' | 'ignored',
    notes?: string
  ) => {
    try {
      const response = await AdminService.updateViolationStatus(violationId, status, notes);
      if (response.success) {
        fetchViolations(); // 刷新违规列表
      } else {
        alert(response.error || '更新违规状态失败');
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'reviewed': return '#28a745';
      case 'ignored': return '#6c757d';
      default: return '#007bff';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'reviewed': return '已审核';
      case 'ignored': return '已忽略';
      default: return status;
    }
  };

  return (
    <div className="comment-management">
      <div className="management-header">
        <h1>评论管理</h1>
        <p>管理论坛评论和违规内容审核</p>
      </div>

      {/* 违规统计侧边栏 */}
      <div className="violation-stats-sidebar">
        <h3>违规用户统计</h3>
        <p className="stats-subtitle">10天内违规超过15次的用户</p>
        {violationStats.length > 0 ? (
          <div className="violation-stats-list">
            {violationStats.map((stat) => (
              <div key={stat.userId} className="violation-stat-item">
                <div className="stat-username">{stat.username}</div>
                <div className="stat-count">{stat.violationCount}次</div>
                <div className="stat-date">
                  最近: {formatDate(stat.lastViolation)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-violations">暂无违规用户</div>
        )}
      </div>

      <div className="main-content">
        {/* 标签切换 */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            评论列表
          </button>
          <button 
            className={`tab-btn ${activeTab === 'violations' ? 'active' : ''}`}
            onClick={() => setActiveTab('violations')}
          >
            违规审核
          </button>
        </div>

        {activeTab === 'comments' ? (
          <div className="comments-section">
            {/* 评论搜索和筛选 */}
            <div className="search-filters">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="搜索评论内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input"
                />
                <input
                  type="text"
                  placeholder="帖子ID筛选"
                  value={postFilter}
                  onChange={(e) => setPostFilter(e.target.value)}
                  className="post-filter-input"
                />
                <button className="btn btn-primary" onClick={handleSearch}>
                  搜索
                </button>
              </div>

              <div className="status-filter">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">全部评论</option>
                  <option value="active">正常评论</option>
                  <option value="deleted">已删除评论</option>
                </select>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
              <div className="loading">加载中...</div>
            ) : (
              <>
                <div className="comments-table">
                  <div className="table-header">
                    <div className="col-content">内容</div>
                    <div className="col-author">作者</div>
                    <div className="col-post">所属帖子</div>
                    <div className="col-stats">点赞</div>
                    <div className="col-date">创建时间</div>
                    <div className="col-status">状态</div>
                    <div className="col-actions">操作</div>
                  </div>

                  {comments.map((comment) => (
                    <div key={comment.id} className="table-row">
                      <div className="col-content">
                        <div className="comment-content">{truncateContent(comment.content)}</div>
                        {comment.parent_id && (
                          <div className="reply-indicator">回复评论 #{comment.parent_id}</div>
                        )}
                      </div>
                      <div className="col-author">{comment.author}</div>
                      <div className="col-post">
                        <div className="post-info">
                          <div className="post-title">{truncateContent(comment.post_title, 50)}</div>
                          <div className="post-id">ID: {comment.post_id}</div>
                        </div>
                      </div>
                      <div className="col-stats">👍 {comment.like_count}</div>
                      <div className="col-date">{formatDate(comment.created_at)}</div>
                      <div className="col-status">
                        <span className={`status-badge ${comment.is_deleted ? 'deleted' : 'active'}`}>
                          {comment.is_deleted ? '已删除' : '正常'}
                        </span>
                      </div>
                      <div className="col-actions">
                        {!comment.is_deleted && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            删除
                          </button>
                        )}
                        <a
                          href={`/posts/${comment.post_id}#comment-${comment.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          查看
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-secondary"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      上一页
                    </button>
                    
                    <span className="page-info">
                      第 {currentPage} 页，共 {totalPages} 页
                    </span>
                    
                    <button
                      className="btn btn-secondary"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="violations-section">
            {/* 违规筛选 */}
            <div className="violation-filters">
              <select 
                value={violationStatus} 
                onChange={(e) => setViolationStatus(e.target.value as any)}
                className="filter-select"
              >
                <option value="">全部违规</option>
                <option value="pending">待处理</option>
                <option value="reviewed">已审核</option>
                <option value="ignored">已忽略</option>
              </select>
            </div>

            {violationsLoading ? (
              <div className="loading">加载中...</div>
            ) : (
              <>
                <div className="violations-list">
                  {violations.map((violation) => (
                    <div key={violation.id} className="violation-item">
                      <div className="violation-header">
                        <div className="violation-info">
                          <span className="violation-type">{violation.content_type === 'post' ? '帖子' : '评论'}</span>
                          <span className="violation-user">{violation.user?.username}</span>
                          <span className="violation-date">{formatDate(violation.detected_at)}</span>
                        </div>
                        <div 
                          className="violation-status"
                          style={{ color: getStatusColor(violation.status) }}
                        >
                          {getStatusText(violation.status)}
                        </div>
                      </div>

                      <div className="violation-details">
                        <div className="violation-rule">
                          <strong>触发规则:</strong> 
                          <code>{violation.violation_word?.word}</code>
                          {violation.violation_word?.is_regex && <span className="regex-badge">正则</span>}
                        </div>
                        <div className="violation-match">
                          <strong>匹配文本:</strong> 
                          <span className="matched-text">{violation.matched_text}</span>
                        </div>
                        <div className="violation-snippet">
                          <strong>内容片段:</strong>
                          <div className="content-snippet">{violation.content_snippet}</div>
                        </div>

                        {violation.notes && (
                          <div className="violation-notes">
                            <strong>审核备注:</strong> {violation.notes}
                          </div>
                        )}
                      </div>

                      {violation.status === 'pending' && (
                        <div className="violation-actions">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleUpdateViolationStatus(violation.id, 'reviewed', '内容已审核')}
                          >
                            标记已审核
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              const notes = prompt('请输入忽略原因（可选）:');
                              handleUpdateViolationStatus(violation.id, 'ignored', notes || '');
                            }}
                          >
                            忽略
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 违规分页 */}
                {violationTotalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-secondary"
                      disabled={violationPage === 1}
                      onClick={() => setViolationPage(violationPage - 1)}
                    >
                      上一页
                    </button>
                    
                    <span className="page-info">
                      第 {violationPage} 页，共 {violationTotalPages} 页
                    </span>
                    
                    <button
                      className="btn btn-secondary"
                      disabled={violationPage === violationTotalPages}
                      onClick={() => setViolationPage(violationPage + 1)}
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentManagement;