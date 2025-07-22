import React, { useState, useRef, useEffect } from 'react';
import { commentService } from '../../services/commentService';
import { useAuth } from '../../contexts/AuthContext';
import MarkdownRenderer from '../common/MarkdownRenderer';
import UserStatusGuard from '../common/UserStatusGuard';

interface CommentFormProps {
  postId: number;
  parentId?: number;
  commentId?: number; // For editing
  initialContent?: string;
  placeholder?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  parentId,
  commentId,
  initialContent = '',
  placeholder = '写下你的评论...',
  onSuccess,
  onCancel,
  isEditing = false
}) => {
  const { state: authState } = useAuth();
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // 自动聚焦到文本框
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Safety check for invalid postId
  if (!isEditing && (!postId || postId <= 0)) {
    return (
      <div className="comment-form-error">
        <p>无效的帖子ID</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authState.isAuthenticated) {
      setError('请先登录');
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError('评论内容不能为空');
      return;
    }

    if (trimmedContent.length > 5000) {
      setError('评论内容不能超过5000个字符');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (isEditing && commentId) {
        // 编辑评论
        response = await commentService.updateComment(commentId, trimmedContent);
      } else {
        // 创建新评论
        response = await commentService.createComment(postId, {
          content: trimmedContent,
          parent_id: parentId
        });
      }

      if (response.success) {
        setContent('');
        onSuccess?.();
      } else {
        setError(response.message || `${isEditing ? '编辑' : '发布'}评论失败`);
      }
    } catch (error) {
      setError(`${isEditing ? '编辑' : '发布'}评论时发生错误，请稍后重试`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      setContent(initialContent);
    } else {
      setContent('');
    }
    setError(null);
    setShowPreview(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter 提交
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="comment-form-login-prompt">
        <p>请先<a href="/login">登录</a>后发表评论</p>
      </div>
    );
  }

  return (
    <UserStatusGuard action="发表评论">
      <form className="comment-form" onSubmit={handleSubmit}>
      <div className="comment-form-header">
        <div className="comment-form-tabs">
          <button
            type="button"
            className={`tab-button ${!showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(false)}
          >
            编辑
          </button>
          <button
            type="button"
            className={`tab-button ${showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(true)}
            disabled={!content.trim()}
          >
            预览
          </button>
        </div>
      </div>

      <div className="comment-form-content">
        {!showPreview ? (
          <div className="comment-input-container">
            <textarea
              ref={textareaRef}
              className="comment-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={loading}
              rows={4}
              maxLength={5000}
            />
            <div className="comment-input-footer">
              <div className="character-count">
                <span className={content.length > 4500 ? 'warning' : ''}>
                  {content.length}/5000
                </span>
              </div>
              <div className="markdown-hint">
                支持 Markdown 格式
              </div>
            </div>
          </div>
        ) : (
          <div className="comment-preview">
            {content.trim() ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="preview-empty">暂无内容可预览</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="comment-form-error">
          <p>{error}</p>
        </div>
      )}

      <div className="comment-form-actions">
        <div className="form-actions-left">
          <div className="keyboard-hint">
            Ctrl+Enter 快速{isEditing ? '保存' : '发布'}
          </div>
        </div>
        
        <div className="form-actions-right">
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCancel}
              disabled={loading}
            >
              取消
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={loading || !content.trim()}
          >
            {loading ? '处理中...' : (isEditing ? '保存' : '发布评论')}
          </button>
        </div>
      </div>
    </form>
    </UserStatusGuard>
  );
};

export default CommentForm;