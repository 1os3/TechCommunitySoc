import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import './PostManagement.css';

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  author_id: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface ViolationStats {
  userId: number;
  username: string;
  violationCount: number;
  lastViolation: string;
}

interface ViolationWord {
  id: number;
  word: string;
  is_regex: boolean;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

const PostManagement: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [violationStats, setViolationStats] = useState<ViolationStats[]>([]);
  const [violationWords, setViolationWords] = useState<ViolationWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Violation word management
  const [newWord, setNewWord] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [showAddWordForm, setShowAddWordForm] = useState(false);

  const limit = 20;

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminService.getPosts({
        page: currentPage,
        limit,
        search: searchTerm || undefined
      });

      if (response.success && response.data) {
        // Adapt the API response structure
        const postsData = response.data.posts || [];
        const totalCount = response.data.pagination?.total || 0;
        
        // Transform posts data to match our interface
        const transformedPosts = postsData.map((post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          author: post.author?.username || 'Unknown',
          author_id: post.author_id,
          view_count: post.view_count || 0,
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0,
          is_deleted: post.is_deleted || false,
          created_at: post.created_at,
          updated_at: post.updated_at
        }));
        
        setPosts(transformedPosts);
        setTotalPages(Math.ceil(totalCount / limit));
      } else {
        setError(response.error || '获取帖子失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
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

  const fetchViolationWords = async () => {
    try {
      const response = await AdminService.getViolationWords();
      if (response.success) {
        setViolationWords(response.data.violation_words);
      }
    } catch (err) {
      console.error('获取违规词失败:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  useEffect(() => {
    fetchViolationStats();
    fetchViolationWords();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPosts();
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('确定要删除这个帖子吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await AdminService.deletePost(postId);
      if (response.success) {
        fetchPosts(); // 刷新列表
      } else {
        setError(response.error || '删除帖子失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    }
  };

  const handleAddViolationWord = async () => {
    if (!newWord.trim()) {
      alert('请输入违规词');
      return;
    }

    try {
      const response = await AdminService.addViolationWord(newWord.trim(), isRegex);
      if (response.success) {
        setNewWord('');
        setIsRegex(false);
        setShowAddWordForm(false);
        fetchViolationWords();
      } else {
        alert(response.error || '添加违规词失败');
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
    }
  };

  const handleRemoveViolationWord = async (wordId: number) => {
    if (!window.confirm('确定要删除这个违规词吗？')) {
      return;
    }

    try {
      const response = await AdminService.removeViolationWord(wordId);
      if (response.success) {
        fetchViolationWords();
      } else {
        alert(response.error || '删除违规词失败');
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

  return (
    <div className="post-management">
      <div className="management-header">
        <h1>帖子管理</h1>
        <p>管理论坛帖子、违规词和用户违规统计</p>
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
        {/* 违规词管理 */}
        <div className="violation-words-section">
          <div className="section-header">
            <h2>违规词管理</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddWordForm(!showAddWordForm)}
            >
              {showAddWordForm ? '取消' : '添加违规词'}
            </button>
          </div>

          {showAddWordForm && (
            <div className="add-word-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="输入违规词或正则表达式"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="form-input"
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isRegex}
                    onChange={(e) => setIsRegex(e.target.checked)}
                  />
                  正则表达式
                </label>
                <button className="btn btn-success" onClick={handleAddViolationWord}>
                  添加
                </button>
              </div>
              {isRegex && (
                <div className="regex-help">
                  <small>正则表达式示例: <code>\b(垃圾|广告)\b</code></small>
                </div>
              )}
            </div>
          )}

          <div className="violation-words-grid">
            {violationWords.map((word) => (
              <div key={word.id} className="violation-word-item">
                <div className="word-content">
                  <span className="word-text">{word.word}</span>
                  {word.is_regex && <span className="regex-badge">正则</span>}
                </div>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemoveViolationWord(word.id)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 帖子搜索和筛选 */}
        <div className="posts-section">
          <div className="section-header">
            <h2>帖子列表</h2>
          </div>

          <div className="search-filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder="搜索帖子标题或内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              <button className="btn btn-primary" onClick={handleSearch}>
                搜索
              </button>
            </div>

          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <>
              <div className="posts-table">
                <div className="table-header">
                  <div className="col-title">标题</div>
                  <div className="col-author">作者</div>
                  <div className="col-stats">统计</div>
                  <div className="col-date">创建时间</div>
                  <div className="col-actions">操作</div>
                </div>

                {posts.map((post) => (
                  <div key={post.id} className="table-row">
                    <div className="col-title">
                      <div className="post-title">{post.title}</div>
                      <div className="post-content">{truncateContent(post.content)}</div>
                    </div>
                    <div className="col-author">{post.author}</div>
                    <div className="col-stats">
                      <div>👀 {post.view_count}</div>
                      <div>👍 {post.like_count}</div>
                      <div>💬 {post.comment_count}</div>
                    </div>
                    <div className="col-date">{formatDate(post.created_at)}</div>
                    <div className="col-actions">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        删除
                      </button>
                      <a
                        href={`/posts/${post.id}`}
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
      </div>
    </div>
  );
};

export default PostManagement;