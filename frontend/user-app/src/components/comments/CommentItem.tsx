import React, { useState } from 'react';
import { Comment } from '../../types/post';
import { useAuth } from '../../contexts/AuthContext';
import MarkdownRenderer from '../common/MarkdownRenderer';
import LikeButton from '../common/LikeButton';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: Comment;
  level?: number;
  maxLevel?: number;
  onReply?: (commentId: number) => void;
  onEdit?: (commentId: number) => void;
  onDelete?: (commentId: number) => void;
  onShowReplies?: (commentId: number) => void;
  showRepliesButton?: boolean;
  replyingTo?: number | null;
  editingComment?: number | null;
  onCommentSuccess?: () => void;
  postId: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  level = 0,
  maxLevel = 999,
  onReply,
  onEdit,
  onDelete,
  onShowReplies,
  showRepliesButton = false,
  replyingTo,
  editingComment,
  onCommentSuccess,
  postId
}) => {
  const { state: authState } = useAuth();
  const [showReplies, setShowReplies] = useState(false);

  // Safety check - return null if comment is invalid
  if (!comment || !comment.id || !comment.content) {
    console.error('Invalid comment data:', comment);
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEditDelete = () => {
    return authState.isAuthenticated && 
           authState.user && 
           authState.user.id === comment.author_id;
  };

  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
    if (onShowReplies && !showReplies) {
      onShowReplies(comment.id);
    }
  };

  return (
    <div className={`comment-item ${level > 0 ? 'comment-reply' : 'comment-root'}`} 
         style={{ 
           paddingLeft: `${Math.min(level * 15, 60)}px`,
           borderLeft: level > 0 ? '2px solid #e3f2fd' : 'none'
         }}>
      <div className="comment-content">
        <div className="comment-header">
          <div className="comment-author-info">
            <span className="comment-author">
              {comment.author?.username || '匿名用户'}
            </span>
            <span className="comment-date">{formatDate(comment.created_at)}</span>
            {comment.updated_at !== comment.created_at && (
              <span className="comment-edited">已编辑</span>
            )}
          </div>
          
          {canEditDelete() && (
            <div className="comment-actions">
              <button 
                className="btn-action btn-edit"
                onClick={() => onEdit?.(comment.id)}
                title="编辑评论"
              >
                编辑
              </button>
              <button 
                className="btn-action btn-delete"
                onClick={() => onDelete?.(comment.id)}
                title="删除评论"
              >
                删除
              </button>
            </div>
          )}
        </div>

        <div className="comment-text">
          <MarkdownRenderer content={comment.content} />
        </div>

        <div className="comment-footer">
          <div className="comment-interactions">
            <LikeButton
              type="comment"
              targetId={comment.id}
              initialLikeCount={comment.like_count || 0}
              size="small"
              showText={false}
            />

            {level < maxLevel && authState.isAuthenticated && (
              <button
                className="btn-interaction btn-reply"
                onClick={() => onReply?.(comment.id)}
                title="回复评论"
              >
                <span className="icon">💬</span>
                <span className="text">回复</span>
              </button>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <button
                className="btn-interaction btn-show-replies"
                onClick={handleToggleReplies}
                title={showReplies ? '隐藏回复' : '显示回复'}
              >
                <span className="icon">{showReplies ? '🔽' : '▶️'}</span>
                <span className="text">
                  {comment.replies.length} 条回复
                </span>
              </button>
            )}

            {showRepliesButton && !comment.replies && (
              <button
                className="btn-interaction btn-show-replies"
                onClick={handleToggleReplies}
                title="查看回复"
              >
                <span className="icon">▶️</span>
                <span className="text">查看回复</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 回复表单 */}
      {replyingTo === comment.id && (
        <div className="comment-reply-form" style={{ 
          paddingLeft: `${Math.min((level + 1) * 15, 75)}px`, 
          marginTop: '10px',
          borderLeft: '2px solid #1976d2'
        }}>
          <CommentForm
            postId={postId}
            parentId={comment.id}
            placeholder={`回复 @${comment.author?.username || '匿名用户'}...`}
            onSuccess={onCommentSuccess}
            onCancel={() => onReply && onReply(-1)} // -1 表示取消回复
          />
        </div>
      )}
      
      {/* 编辑表单 */}
      {editingComment === comment.id && (
        <div className="comment-edit-form" style={{ 
          marginTop: '10px',
          paddingLeft: `${Math.min(level * 15, 60)}px`,
          borderLeft: '2px solid #f57c00'
        }}>
          <CommentForm
            postId={postId}
            commentId={comment.id}
            initialContent={comment.content}
            placeholder="编辑评论..."
            onSuccess={onCommentSuccess}
            onCancel={() => onEdit && onEdit(-1)} // -1 表示取消编辑
            isEditing={true}
          />
        </div>
      )}

      {/* 递归显示回复 */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              maxLevel={maxLevel}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onShowReplies={onShowReplies}
              replyingTo={replyingTo}
              editingComment={editingComment}
              onCommentSuccess={onCommentSuccess}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;