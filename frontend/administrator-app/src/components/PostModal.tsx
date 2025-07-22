import React, { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import api from '../services/api';
import './PostModal.css';

interface PostDetail {
  id: number;
  title: string;
  content: string;
  author: string;
  author_id: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

interface PostModalProps {
  postId: number;
  isOpen: boolean;
  onClose: () => void;
}

const PostModal: React.FC<PostModalProps> = ({ postId, isOpen, onClose }) => {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPostDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 使用配置好的api实例调用帖子API
      const response = await api.get(`/posts/${postId}`);
      
      console.log('API Response:', response.data); // 添加调试日志
      
      if (response.data.success && response.data.data && response.data.data.post) {
        const postData = response.data.data.post;
        console.log('Post Data:', postData); // 添加调试日志
        
        setPost({
          id: postData.id,
          title: postData.title || 'Untitled',
          content: postData.content || '',
          author: postData.author?.username || postData.author || 'Unknown',
          author_id: postData.author_id,
          view_count: postData.view_count || 0,
          like_count: postData.like_count || 0,
          comment_count: postData.comment_count || 0,
          created_at: postData.created_at,
          updated_at: postData.updated_at
        });
      } else {
        console.log('API response structure:', response.data); // 调试信息
        setError('帖子不存在或已被删除');
      }
    } catch (err: any) {
      console.error('获取帖子详情失败:', err);
      console.error('Error response:', err.response?.data); // 添加错误调试信息
      if (err.response?.status === 404) {
        setError('帖子不存在或已被删除');
      } else {
        setError('网络错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (isOpen && postId) {
      fetchPostDetail();
    }
  }, [isOpen, postId, fetchPostDetail]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const renderMarkdown = (content: string) => {
    // 确保content存在且是字符串
    if (!content || typeof content !== 'string') {
      return { __html: '' };
    }

    try {
      // 配置marked选项
      marked.setOptions({
        breaks: true, // 支持换行
        gfm: true, // 支持GitHub风格的Markdown
      });
      
      // 使用同步版本的marked
      const html = marked.parse(content, { async: false }) as string;
      return { __html: html };
    } catch (error) {
      console.error('Markdown渲染失败:', error);
      // 如果marked解析失败，回退到简单的文本显示
      return { __html: content.replace(/\n/g, '<br>') };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <div className="post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="post-modal-header">
          <h2>帖子详情</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="post-modal-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button className="retry-button" onClick={fetchPostDetail}>
                重试
              </button>
            </div>
          ) : post ? (
            <div className="post-detail">
              <div className="post-header">
                <h1 className="post-title">{post.title}</h1>
                <div className="post-meta">
                  <span className="author">作者: {post.author}</span>
                  <span className="date">发布时间: {formatDate(post.created_at)}</span>
                </div>
                <div className="post-stats">
                  <span className="stat">👀 {post.view_count} 浏览</span>
                  <span className="stat">👍 {post.like_count} 点赞</span>
                  <span className="stat">💬 {post.comment_count} 评论</span>
                </div>
              </div>

              <div className="post-content">
                <div 
                  className="markdown-content"
                  dangerouslySetInnerHTML={renderMarkdown(post.content || '')}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PostModal;