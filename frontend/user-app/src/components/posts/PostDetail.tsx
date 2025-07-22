import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Post } from '../../types/post';
import { postService } from '../../services/postService';
import { useAuth } from '../../contexts/AuthContext';
import MarkdownRenderer from '../common/MarkdownRenderer';
import LikeButton from '../common/LikeButton';
import CommentList from '../comments/CommentList';
import CommentForm from '../comments/CommentForm';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [refreshComments, setRefreshComments] = useState(0);

  const fetchPost = async () => {
    if (!id || isNaN(Number(id))) {
      setError('无效的帖子ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 第一次访问时增加浏览量，后续不增加
      const shouldIncrementView = !viewIncremented;
      const response = await postService.getPost(Number(id), shouldIncrementView);

      if (response.success && response.data) {
        setPost(response.data.post);
        setCommentCount(response.data.post.comment_count);
        if (shouldIncrementView) {
          setViewIncremented(true);
        }
      } else {
        setError(response.message || '获取帖子详情失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 当帖子ID改变时，重置浏览量增加状态
    setViewIncremented(false);
    fetchPost();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const handleEdit = () => {
    navigate(`/posts/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!post || !window.confirm('确定要删除这篇帖子吗？')) {
      return;
    }

    try {
      const response = await postService.deletePost(post.id);
      if (response.success) {
        navigate('/', { replace: true });
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      alert('删除失败，请稍后重试');
    }
  };

  const canEditPost = () => {
    return authState.isAuthenticated && 
           authState.user && 
           post && 
           authState.user.id === post.author_id;
  };

  const handleCommentSuccess = () => {
    setRefreshComments(prev => prev + 1);
  };

  const handleCommentCountChange = (count: number) => {
    setCommentCount(count);
    if (post) {
      setPost({
        ...post,
        comment_count: count
      });
    }
  };

  const handlePostLikeChange = (liked: boolean, newCount: number) => {
    if (post) {
      setPost({
        ...post,
        like_count: newCount
      });
    }
  };

  if (loading) {
    return (
      <div className="post-detail-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-detail-container">
        <div className="error-state">
          <h2>出错了</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button 
              className="btn btn-primary"
              onClick={fetchPost}
            >
              重试
            </button>
            <Link to="/" className="btn btn-secondary">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-container">
        <div className="error-state">
          <h2>帖子不存在</h2>
          <p>您要查看的帖子可能已被删除或不存在</p>
          <Link to="/" className="btn btn-primary">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      <div className="post-detail-header">
        <Link to="/" className="back-link">
          ← 返回帖子列表
        </Link>
        
        {canEditPost() && (
          <div className="post-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleEdit}
            >
              编辑
            </button>
            <button 
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
            >
              删除
            </button>
          </div>
        )}
      </div>

      <article className="post-detail">
        <header className="post-header">
          <h1 className="post-title">{post.title}</h1>
          
          <div className="post-meta">
            <div className="post-author">
              <span className="author-name">作者: {post.author.username}</span>
            </div>
            <div className="post-dates">
              <span className="created-date">
                发布时间: {formatDate(post.created_at)}
              </span>
              {post.updated_at !== post.created_at && (
                <span className="updated-date">
                  更新时间: {formatDate(post.updated_at)}
                </span>
              )}
            </div>
          </div>

          <div className="post-stats">
            <div className="stat-item">
              <span className="stat-icon">👁</span>
              <span className="stat-label">浏览</span>
              <span className="stat-value">{post.view_count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">👍</span>
              <span className="stat-label">点赞</span>
              <span className="stat-value">{post.like_count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💬</span>
              <span className="stat-label">评论</span>
              <span className="stat-value">{commentCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🔥</span>
              <span className="stat-label">热度</span>
              <span className="stat-value">{post.hotness_score.toFixed(1)}</span>
            </div>
          </div>
        </header>

        <div className="post-content">
          <MarkdownRenderer content={post.content} />
        </div>

        <footer className="post-footer">
          <div className="post-interactions">
            <LikeButton
              type="post"
              targetId={post.id}
              initialLikeCount={post.like_count}
              onLikeChange={handlePostLikeChange}
              size="medium"
              showText={true}
            />
          </div>
        </footer>
      </article>

      {/* 评论区域 */}
      <div className="comments-section">
        <h3>评论 ({commentCount})</h3>
        
        {/* 发表评论表单 */}
        <CommentForm
          postId={post.id}
          placeholder="写下你的评论..."
          onSuccess={handleCommentSuccess}
        />
        
        {/* 评论列表 */}
        <CommentList
          postId={post.id}
          refreshTrigger={refreshComments}
          onCommentCountChange={handleCommentCountChange}
        />
      </div>
    </div>
  );
};

export default PostDetail;