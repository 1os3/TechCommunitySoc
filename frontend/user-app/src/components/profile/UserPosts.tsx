import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '../../services/postService';
import { PostListItem } from '../../types/post';
import Modal from '../common/Modal';

interface UserPostsProps {
  userId: number;
}

const UserPosts: React.FC<UserPostsProps> = ({ userId }) => {
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    postId: number | null;
    postTitle: string;
  }>({
    isOpen: false,
    postId: null,
    postTitle: ''
  });

  useEffect(() => {
    loadUserPosts();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.getUserPosts(userId);
      
      if (response.success && response.data) {
        setPosts(response.data.posts || []);
      } else {
        setError(response.message || '获取帖子失败');
      }
    } catch (err) {
      setError('获取帖子时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!deleteModal.postId) return;

    try {
      const response = await postService.deletePost(deleteModal.postId);
      
      if (response.success) {
        setPosts(posts.filter(post => post.id !== deleteModal.postId));
        setDeleteModal({ isOpen: false, postId: null, postTitle: '' });
      } else {
        setError(response.message || '删除帖子失败');
      }
    } catch (err) {
      setError('删除帖子时发生错误');
    }
  };

  const openDeleteModal = (post: PostListItem) => {
    setDeleteModal({
      isOpen: true,
      postId: post.id,
      postTitle: post.title
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, postId: null, postTitle: '' });
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

  const formatContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="user-posts-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-posts-error">
        <p>❌ {error}</p>
        <button className="btn btn-secondary" onClick={loadUserPosts}>
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="user-posts">
      <div className="user-posts-header">
        <h3>我的帖子 ({posts.length})</h3>
        <Link to="/posts/create" className="btn btn-primary">
          发布新帖
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="no-posts">
          <div className="no-posts-icon">📝</div>
          <h4>还没有发布任何帖子</h4>
          <p>分享您的想法和经验，与社区成员交流</p>
          <Link to="/posts/create" className="btn btn-primary">
            发布第一个帖子
          </Link>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post.id} className="post-item">
              <div className="post-header">
                <h4 className="post-title">
                  <Link to={`/posts/${post.id}`}>{post.title}</Link>
                </h4>
                <div className="post-actions">
                  <Link 
                    to={`/posts/${post.id}/edit`} 
                    className="btn btn-sm btn-secondary"
                  >
                    编辑
                  </Link>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => openDeleteModal(post)}
                  >
                    删除
                  </button>
                </div>
              </div>
              
              <div className="post-content">
                <p>{formatContent(post.content)}</p>
              </div>
              
              <div className="post-meta">
                <span className="post-date">
                  发布于 {formatDate(post.created_at)}
                </span>
                {post.updated_at !== post.created_at && (
                  <span className="post-updated">
                    更新于 {formatDate(post.updated_at)}
                  </span>
                )}
              </div>
              
              <div className="post-stats">
                <span className="stat">👁 {post.view_count}</span>
                <span className="stat">👍 {post.like_count}</span>
                <span className="stat">💬 {post.comment_count}</span>
                <span className="stat">🔥 {post.hotness_score.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        title="删除帖子"
      >
        <div className="delete-confirmation">
          <p>确定要删除帖子 <strong>"{deleteModal.postTitle}"</strong> 吗？</p>
          <p className="warning-text">此操作无法撤销，帖子将被永久删除。</p>
          <div className="modal-actions">
            <button 
              className="btn btn-secondary" 
              onClick={closeDeleteModal}
            >
              取消
            </button>
            <button 
              className="btn btn-danger" 
              onClick={handleDeletePost}
            >
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserPosts;