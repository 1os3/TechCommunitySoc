import React, { useState, useEffect } from 'react';
import { likeService } from '../../services/likeService';
import { useAuth } from '../../contexts/AuthContext';
import { useUserStatus } from '../../hooks/useUserStatus';

interface LikeButtonProps {
  type: 'post' | 'comment';
  targetId: number;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  onLikeChange?: (liked: boolean, newCount: number) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  type,
  targetId,
  initialLikeCount = 0,
  initialIsLiked = false,
  onLikeChange,
  className = '',
  size = 'medium',
  showText = true
}) => {
  const { state: authState } = useAuth();
  const { isUserDisabled } = useUserStatus();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取点赞状态
  const fetchLikeStatus = async () => {
    if (!authState.isAuthenticated) return;

    try {
      const response = type === 'post' 
        ? await likeService.getPostLikeStatus(targetId)
        : await likeService.getCommentLikeStatus(targetId);

      if (response.success && response.data) {
        setIsLiked(response.data.liked);
        if (response.data.like_count !== undefined) {
          setLikeCount(response.data.like_count);
        }
      }
    } catch (error) {
      console.error('Failed to fetch like status:', error);
    }
  };

  // 切换点赞状态
  const handleToggleLike = async () => {
    if (!authState.isAuthenticated) {
      alert('请先登录');
      return;
    }

    if (isUserDisabled) {
      alert('您的账户已被禁用，无法点赞');
      return;
    }

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = type === 'post'
        ? await likeService.togglePostLike(targetId)
        : await likeService.toggleCommentLike(targetId);

      if (response.success && response.data) {
        const newIsLiked = response.data.liked;
        setIsLiked(newIsLiked);

        // 更新点赞数
        const newCount = newIsLiked 
          ? likeCount + 1 
          : Math.max(likeCount - 1, 0);
        setLikeCount(newCount);

        // 通知父组件
        onLikeChange?.(newIsLiked, newCount);
      } else {
        setError(response.message || '操作失败');
        // 显示错误消息后自动清除
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchLikeStatus();
    }
  }, [authState.isAuthenticated, targetId, type]); // eslint-disable-line react-hooks/exhaustive-deps

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'like-button-small';
      case 'large':
        return 'like-button-large';
      default:
        return 'like-button-medium';
    }
  };

  const getButtonClasses = () => {
    const baseClasses = `like-button ${getSizeClasses()} ${className}`;
    const stateClasses = [
      isLiked ? 'liked' : '',
      loading ? 'loading' : '',
      !authState.isAuthenticated ? 'disabled' : '',
      error ? 'error' : ''
    ].filter(Boolean).join(' ');
    
    return `${baseClasses} ${stateClasses}`.trim();
  };

  const getTitle = () => {
    if (!authState.isAuthenticated) {
      return '请先登录';
    }
    if (error) {
      return error;
    }
    if (loading) {
      return '处理中...';
    }
    return isLiked ? '取消点赞' : '点赞';
  };

  return (
    <button
      className={getButtonClasses()}
      onClick={handleToggleLike}
      disabled={!authState.isAuthenticated || loading || isUserDisabled}
      title={getTitle()}
    >
      <span className="like-icon">
        {loading ? '⏳' : (isLiked ? '👍' : '👍')}
      </span>
      
      {showText && (
        <span className="like-text">
          {size === 'small' ? '' : (isLiked ? '已赞' : '点赞')}
        </span>
      )}
      
      <span className="like-count">
        {likeCount}
      </span>

      {error && (
        <div className="like-error-tooltip">
          {error}
        </div>
      )}
    </button>
  );
};

export default LikeButton;