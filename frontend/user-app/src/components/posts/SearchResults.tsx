import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '../../services/postService';
import { PostListItem, PostFilters, UserSearchItem, PaginationInfo } from '../../types/post';

interface SearchResultsProps {
  query: string;
  searchType: 'posts' | 'users';
  filters?: PostFilters;
  onError?: (error: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  searchType,
  filters = {},
  onError
}) => {
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [users, setUsers] = useState<UserSearchItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPosts = async () => {
    if (!query.trim()) {
      setPosts([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await postService.searchPosts(query, filters);
      
      if (response.success && response.data) {
        setPosts(response.data.posts);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || '搜索失败');
        if (onError) onError(response.message || '搜索失败');
      }
    } catch (err) {
      const errorMessage = '搜索帖子时发生错误';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!query.trim()) {
      setUsers([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await postService.searchUsers(query, filters.page || 1, filters.limit || 20);
      
      if (response.success && response.data) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || '搜索失败');
        if (onError) onError(response.message || '搜索失败');
      }
    } catch (err) {
      const errorMessage = '搜索用户时发生错误';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchType === 'posts') {
      searchPosts();
    } else {
      searchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchType, filters]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : part
    );
  };

  if (loading) {
    return (
      <div className="search-results">
        <div className="search-loading">
          <div className="loading-spinner"></div>
          <p>搜索中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results">
        <div className="search-error">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="search-results">
        <div className="search-empty">
          <p>请输入搜索关键词</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="search-results-header">
        <h3>
          {searchType === 'posts' ? '帖子' : '用户'}搜索结果
          <span className="search-query">"{query}"</span>
        </h3>
        <p className="search-stats">
          找到 {pagination.total} 个结果
        </p>
      </div>

      {searchType === 'posts' ? (
        <div className="posts-results">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="search-result-item post-item">
                <div className="post-header">
                  <h4 className="post-title">
                    <Link to={`/posts/${post.id}`}>
                      {highlightSearchTerm(post.title, query)}
                    </Link>
                  </h4>
                  <div className="post-meta">
                    <span className="author">
                      作者: <Link to={`/?author=${post.author.id}`}>{post.author.username}</Link>
                    </span>
                    <span className="date">{formatDate(post.created_at)}</span>
                  </div>
                </div>
                <div className="post-content">
                  <p>{highlightSearchTerm(formatContent(post.content), query)}</p>
                </div>
                <div className="post-stats">
                  <span className="stat">👁 {post.view_count}</span>
                  <span className="stat">👍 {post.like_count}</span>
                  <span className="stat">💬 {post.comment_count}</span>
                  <span className="stat">🔥 {post.hotness_score.toFixed(2)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>未找到匹配的帖子</p>
              <p>尝试：</p>
              <ul>
                <li>检查拼写是否正确</li>
                <li>尝试不同的关键词</li>
                <li>使用更简单的搜索词</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="users-results">
          {users.length > 0 ? (
            users.map((user) => (
              <div key={user.id} className="search-result-item user-item">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-details">
                    <h4 className="username">
                      <Link to={`/?author=${user.id}`}>
                        {highlightSearchTerm(user.username, query)}
                      </Link>
                    </h4>
                    <p className="user-stats">
                      {user.post_count} 个帖子
                    </p>
                  </div>
                </div>
                <div className="user-actions">
                  <Link 
                    to={`/?author=${user.id}`}
                    className="btn btn-sm btn-primary"
                  >
                    查看帖子
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>未找到匹配的用户</p>
              <p>尝试：</p>
              <ul>
                <li>检查用户名拼写</li>
                <li>尝试部分用户名</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="search-pagination">
          <div className="pagination-info">
            第 {pagination.page} 页，共 {pagination.totalPages} 页
          </div>
          {/* 分页组件可以在这里添加 */}
        </div>
      )}
    </div>
  );
};

export default SearchResults;