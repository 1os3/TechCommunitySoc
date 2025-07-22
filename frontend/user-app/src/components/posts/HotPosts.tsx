import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PostListItem } from '../../types/post';
import { postService } from '../../services/postService';

interface HotPostsProps {
  limit?: number;
  showViewCounts?: boolean;
  className?: string;
  onViewAll?: () => void;
}

const HotPosts: React.FC<HotPostsProps> = ({ 
  limit = 10, 
  showViewCounts = true,
  className = '',
  onViewAll
}) => {
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHotPosts = async () => {
    
    setLoading(true);
    setError(null);

    try {
      const response = await postService.getHotPosts(limit);

      if (response.success && response.data) {
        setPosts(response.data.posts);
      } else {
        setError(response.message || '获取热门帖子失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotPosts();
  }, [limit]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const truncateTitle = (title: string, maxLength: number = 40) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  if (loading) {
    return (
      <div className={`hot-posts ${className}`}>
        <div className="hot-posts-header">
          <h3>🔥 热门帖子</h3>
        </div>
        <div className="loading-state">
          <div className="loading-spinner-sm"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`hot-posts ${className}`}>
        <div className="hot-posts-header">
          <h3>🔥 热门帖子</h3>
        </div>
        <div className="error-state">
          <p className="error-message-sm">{error}</p>
          <button 
            className="btn btn-sm btn-primary"
            onClick={fetchHotPosts}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`hot-posts ${className}`}>
      <div className="hot-posts-header">
        <h3>🔥 热门帖子</h3>
        {onViewAll ? (
          <button className="view-all-link" onClick={onViewAll}>
            查看全部
          </button>
        ) : (
          <span className="view-all-link disabled">
            查看全部
          </span>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>暂无热门帖子</p>
        </div>
      ) : (
        <div className="hot-posts-list">
          {posts.map((post, index) => (
            <div key={post.id} className="hot-post-item">
              <div className="hot-post-rank">
                {index + 1}
              </div>
              
              <div className="hot-post-content">
                <Link 
                  to={`/posts/${post.id}`} 
                  className="hot-post-title"
                  title={post.title}
                >
                  {truncateTitle(post.title)}
                </Link>
                
                <div className="hot-post-meta">
                  <span className="hot-post-author">
                    {post.author.username}
                  </span>
                  <span className="hot-post-time">
                    {formatDate(post.created_at)}
                  </span>
                </div>
              </div>

              <div className="hot-post-stats">
                <div className="hot-stat">
                  <span className="hot-stat-icon">🔥</span>
                  <span className="hot-stat-value">
                    {post.hotness_score.toFixed(1)}
                  </span>
                </div>
                
                {showViewCounts && (
                  <>
                    <div className="hot-stat">
                      <span className="hot-stat-icon">👍</span>
                      <span className="hot-stat-value">{post.like_count}</span>
                    </div>
                    <div className="hot-stat">
                      <span className="hot-stat-icon">💬</span>
                      <span className="hot-stat-value">{post.comment_count}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HotPosts;