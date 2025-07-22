import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { commentService } from '../../services/commentService';

interface CommentItem {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  post_id: number;
  post_title?: string;
  parent_id?: number;
  like_count?: number;
}

interface UserCommentsProps {
  userId: number;
}

const UserComments: React.FC<UserCommentsProps> = ({ userId }) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserComments();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await commentService.getUserComments(userId);
      
      if (response.success && response.data) {
        setComments(response.data.comments || []);
      } else {
        setError(response.message || '获取评论失败');
      }
    } catch (err) {
      setError('获取评论时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="user-comments-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-comments-error">
        <p>❌ {error}</p>
        <button className="btn btn-secondary" onClick={loadUserComments}>
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="user-comments">
      <div className="user-comments-header">
        <h3>我的评论 ({comments.length})</h3>
      </div>

      {comments.length === 0 ? (
        <div className="no-comments">
          <div className="no-comments-icon">💬</div>
          <h4>还没有发表任何评论</h4>
          <p>参与讨论，分享您的观点和见解</p>
          <Link to="/" className="btn btn-primary">
            浏览帖子
          </Link>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-meta">
                  {comment.parent_id ? (
                    <span className="comment-type reply">↳ 回复评论</span>
                  ) : (
                    <span className="comment-type">💬 评论</span>
                  )}
                  <span className="comment-date">
                    {formatDate(comment.created_at)}
                  </span>
                  {comment.updated_at !== comment.created_at && (
                    <span className="comment-updated">
                      (已编辑)
                    </span>
                  )}
                </div>
                <div className="comment-stats">
                  <span className="stat">👍 {comment.like_count || 0}</span>
                </div>
              </div>
              
              <div className="comment-content">
                <p>{formatContent(comment.content)}</p>
              </div>
              
              {comment.post_title && (
                <div className="comment-post-info">
                  <span>在帖子: </span>
                  <Link 
                    to={`/posts/${comment.post_id}`}
                    className="post-link"
                  >
                    {comment.post_title}
                  </Link>
                </div>
              )}
              
              <div className="comment-actions">
                <Link 
                  to={`/posts/${comment.post_id}#comment-${comment.id}`}
                  className="btn btn-sm btn-secondary"
                >
                  查看详情
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserComments;