import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PostListItem, PostFilters } from '../../types/post';
import { postService } from '../../services/postService';
import MarkdownRenderer from '../common/MarkdownRenderer';

interface PostListProps {
  title?: string;
  showPagination?: boolean;
  filters?: PostFilters;
  onError?: (error: string) => void;
}

const PostList: React.FC<PostListProps> = ({
  title = '最新帖子',
  showPagination = true,
  filters = {},
  onError
}) => {
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(filters.page || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchPosts = async (page: number = currentPage) => {
    
    setLoading(true);
    setError(null);

    try {
      const response = await postService.getPosts({
        ...filters,
        page
      });

      if (response.success && response.data) {
        setPosts(response.data.posts);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
        setCurrentPage(response.data.pagination.page);
      } else {
        const errorMsg = response.message || '获取帖子列表失败';
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = '网络错误，请稍后重试';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, [filters.orderBy, filters.limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      fetchPosts(page);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes > 0 ? `${minutes}分钟前` : '刚刚';
    }
  };

  if (loading) {
    return (
      <div className="post-list-container">
        <div className="post-list-header">
          <h2>{title}</h2>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-list-container">
        <div className="post-list-header">
          <h2>{title}</h2>
        </div>
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => fetchPosts(currentPage)}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-list-container">
      <div className="post-list-header">
        <h2>{title}</h2>
        <div className="post-stats">
          共 {total} 篇帖子
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>暂无帖子</p>
        </div>
      ) : (
        <>
          <div className="post-list">
            {posts.map((post) => (
              <div key={post.id} className="post-item">
                <div className="post-content">
                  <Link to={`/posts/${post.id}`} className="post-title">
                    {post.title}
                  </Link>
                  <div className="post-excerpt">
                    <MarkdownRenderer content={post.content} className="post-excerpt-content" />
                  </div>
                  <div className="post-meta">
                    <span className="post-author">
                      作者: {post.author.username}
                    </span>
                    <span className="post-time">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                </div>
                <div className="post-stats">
                  <div className="stat-item">
                    <span className="stat-icon">👁</span>
                    <span className="stat-value">{post.view_count}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">👍</span>
                    <span className="stat-value">{post.like_count}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">💬</span>
                    <span className="stat-value">{post.comment_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showPagination && totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                上一页
              </button>
              
              <div className="pagination-pages">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostList;