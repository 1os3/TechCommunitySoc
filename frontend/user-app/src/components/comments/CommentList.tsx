import React, { useState, useEffect } from 'react';
import { Comment } from '../../types/post';
import { commentService } from '../../services/commentService';
import CommentItem from './CommentItem';

interface CommentListProps {
  postId: number;
  refreshTrigger?: number;
  onCommentCountChange?: (count: number) => void;
}

const CommentList: React.FC<CommentListProps> = ({
  postId,
  refreshTrigger,
  onCommentCountChange
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 获取评论列表
  const fetchComments = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await commentService.getPostCommentsTree(postId, pageNum, 20, 'created_at', 50);

      console.log('Comment API response:', response); // Debug log

      if (response.success && response.data) {
        console.log('Comment data:', response.data); // Debug log
        const commentTree = response.data.commentTree || [];
        
        // Convert CommentTree to Comment array with nested replies
        const convertTreeToComments = (trees: any[]): Comment[] => {
          return trees.map(tree => {
            const comment = tree.comment;
            // Add replies from the tree structure
            if (tree.replies && tree.replies.length > 0) {
              comment.replies = convertTreeToComments(tree.replies);
            }
            return comment;
          });
        };
        
        const newComments = convertTreeToComments(commentTree);
        
        // Filter out any invalid comments and ensure author data exists
        const validComments = newComments.filter(comment => 
          comment && 
          comment.id && 
          comment.content !== undefined &&
          comment.created_at &&
          comment.author_id
        );
        
        console.log('Valid comments after filtering:', validComments); // Debug log
        
        if (append) {
          setComments(prev => [...prev, ...validComments]);
        } else {
          setComments(validComments);
        }

        // 更新分页信息
        if (response.data.pagination) {
          const { total, page: currentPage, totalPages } = response.data.pagination;
          setHasMore(currentPage < totalPages);
          onCommentCountChange?.(total);
        }

      } else {
        setError(response.message || '获取评论失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };


  // 处理回复
  const handleReply = (commentId: number) => {
    if (commentId === -1) {
      setReplyingTo(null); // 取消回复
    } else {
      setReplyingTo(commentId);
      setEditingComment(null);
    }
  };

  // 处理编辑
  const handleEdit = (commentId: number) => {
    if (commentId === -1) {
      setEditingComment(null); // 取消编辑
    } else {
      setEditingComment(commentId);
      setReplyingTo(null);
    }
  };

  // 处理删除
  const handleDelete = async (commentId: number) => {
    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      const response = await commentService.deleteComment(commentId);
      
      if (response.success) {
        // 重新获取评论列表
        await fetchComments(1, false);
        setPage(1);
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      alert('删除失败，请稍后重试');
    }
  };

  // 处理评论提交成功
  const handleCommentSuccess = async () => {
    setReplyingTo(null);
    setEditingComment(null);
    // 重新获取评论列表
    await fetchComments(1, false);
    setPage(1);
  };

  // 加载更多评论
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage, true);
    }
  };

  useEffect(() => {
    const loadComments = async () => {
      await fetchComments(1, false);
      setPage(1);
    };
    loadComments();
  }, [postId, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safety check for invalid postId
  if (!postId || postId <= 0) {
    return (
      <div className="comments-error">
        <p>无效的帖子ID</p>
      </div>
    );
  }

  if (loading && comments.length === 0) {
    return (
      <div className="comments-loading">
        <div className="loading-spinner"></div>
        <p>加载评论中...</p>
      </div>
    );
  }

  return (
    <div className="comments-list">
      {error && (
        <div className="comments-error">
          <p>{error}</p>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => fetchComments(1, false)}
          >
            重试
          </button>
        </div>
      )}

      {comments.length === 0 && !loading && !error && (
        <div className="comments-empty">
          <p>暂无评论，来发表第一条评论吧！</p>
        </div>
      )}

      {comments.length > 0 && comments.map(comment => {
        // Additional safety check before rendering each comment
        if (!comment || !comment.id) {
          console.warn('Skipping invalid comment:', comment);
          return null;
        }
        
        return (
          <div key={comment.id}>
            <CommentItem
              comment={comment}
              level={0}
              maxLevel={999}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              replyingTo={replyingTo}
              editingComment={editingComment}
              onCommentSuccess={handleCommentSuccess}
              postId={postId}
            />
          </div>
        );
      })}

      {hasMore && !loading && (
        <div className="comments-load-more">
          <button 
            className="btn btn-secondary"
            onClick={loadMore}
          >
            加载更多评论
          </button>
        </div>
      )}

      {loading && comments.length > 0 && (
        <div className="comments-loading-more">
          <div className="loading-spinner"></div>
          <p>加载更多评论中...</p>
        </div>
      )}
    </div>
  );
};

export default CommentList;