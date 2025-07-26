import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postService } from '../../services/postService';
import { UpdatePostData, Post } from '../../types/post';
import { useAuth } from '../../contexts/AuthContext';
import MarkdownRenderer from '../common/MarkdownRenderer';

const PostEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [errors, setErrors] = useState<{title?: string; content?: string; general?: string}>({});
  const [showPreview, setShowPreview] = useState(false);
  
  const [postData, setPostData] = useState<UpdatePostData>({
    title: '',
    content: ''
  });

  const postId = id ? parseInt(id, 10) : null;

  useEffect(() => {
    if (!postId || isNaN(postId)) {
      setErrors({ general: '无效的帖子ID' });
      setInitialLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const result = await postService.getPost(postId, false); // 不增加浏览量
        
        if (result.success && result.data?.post) {
          const fetchedPost = result.data.post;
          setPost(fetchedPost);
          setPostData({
            title: fetchedPost.title,
            content: fetchedPost.content
          });
          
          // 检查是否为帖子作者
          if (!authState.user || authState.user.id !== fetchedPost.author_id) {
            setErrors({ general: '您只能编辑自己的帖子' });
          }
        } else {
          setErrors({ general: result.message || '获取帖子信息失败' });
        }
      } catch (error) {
        console.error('Fetch post error:', error);
        setErrors({ general: '获取帖子信息时发生错误' });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchPost();
  }, [postId, authState.user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPostData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!postData.title?.trim()) {
      newErrors.title = '标题不能为空';
    } else if (postData.title.length > 200) {
      newErrors.title = '标题不能超过200个字符';
    }
    
    if (!postData.content?.trim()) {
      newErrors.content = '内容不能为空';
    } else if (postData.content.length > 50000) {
      newErrors.content = '内容不能超过50000个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postId || !validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await postService.updatePost(postId, {
        title: postData.title?.trim(),
        content: postData.content?.trim()
      });

      if (result.success) {
        // 跳转回帖子详情页
        navigate(`/posts/${postId}`);
      } else {
        setErrors({
          general: result.message || '更新帖子失败'
        });
      }
    } catch (error) {
      console.error('Update post error:', error);
      setErrors({
        general: '更新帖子时发生错误，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/posts/${postId}`); // 返回帖子详情页
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="post-edit-container">
        <div className="auth-required">
          <h2>需要登录</h2>
          <p>请先登录后再编辑帖子</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            前往登录
          </button>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="post-edit-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>加载帖子信息中...</p>
        </div>
      </div>
    );
  }

  if (errors.general && !post) {
    return (
      <div className="post-edit-container">
        <div className="error-state">
          <h2>加载失败</h2>
          <p>{errors.general}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-edit-container">
      <div className="post-edit-header">
        <h1>编辑帖子</h1>
        <p>修改您的帖子内容</p>
      </div>

      <form className="post-edit-form" onSubmit={handleSubmit}>
        {errors.general && (
          <div className="error-banner">
            <p>{errors.general}</p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="title" className="form-label">
            帖子标题 <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className={`form-input ${errors.title ? 'error' : ''}`}
            value={postData.title || ''}
            onChange={handleInputChange}
            placeholder="请输入帖子标题（最多200字符）"
            maxLength={200}
            disabled={loading}
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
          <div className="form-help">
            {(postData.title || '').length}/200 字符
          </div>
        </div>

        <div className="form-group">
          <div className="content-header">
            <label htmlFor="content" className="form-label">
              帖子内容 <span className="required">*</span>
            </label>
            <div className="content-tabs">
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
                disabled={!(postData.content || '').trim()}
              >
                预览
              </button>
            </div>
          </div>
          
          {!showPreview ? (
            <>
              <textarea
                id="content"
                name="content"
                className={`form-textarea ${errors.content ? 'error' : ''}`}
                value={postData.content || ''}
                onChange={handleInputChange}
                placeholder="请输入帖子内容（最多50000字符）&#10;&#10;提示：&#10;- 支持Markdown格式&#10;- 代码请使用 ```语言 代码块 ``` 格式&#10;- 详细描述您的问题或见解"
                rows={15}
                maxLength={50000}
                disabled={loading}
              />
              {errors.content && <div className="error-message">{errors.content}</div>}
              <div className="form-help">
                {(postData.content || '').length}/50000 字符 | 支持Markdown格式
              </div>
            </>
          ) : (
            <div className="preview-container">
              {(postData.content || '').trim() ? (
                <MarkdownRenderer content={postData.content || ''} />
              ) : (
                <p className="preview-empty">暂无内容可预览</p>
              )}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !postData.title?.trim() || !postData.content?.trim()}
          >
            {loading ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>

      {post && (
        <div className="post-edit-info">
          <h3>📝 帖子信息</h3>
          <ul>
            <li><strong>创建时间：</strong>{new Date(post.created_at).toLocaleString('zh-CN')}</li>
            <li><strong>最后修改：</strong>{new Date(post.updated_at).toLocaleString('zh-CN')}</li>
            <li><strong>浏览次数：</strong>{post.view_count}</li>
            <li><strong>点赞数：</strong>{post.like_count}</li>
            <li><strong>评论数：</strong>{post.comment_count}</li>
          </ul>
        </div>
      )}

      <div className="post-edit-tips">
        <h3>✨ 编辑提示</h3>
        <ul>
          <li><strong>Markdown支持：</strong>支持标准 Markdown 格式</li>
          <li><strong>图表支持：</strong>使用 <code>/mermaid_chart图表代码/mermaid_chart</code> 插入图表</li>
          <li><strong>数学公式：</strong>使用 <code>$公式$</code> 插入行内公式，<code>$$公式$$</code> 插入块级公式</li>
          <li><strong>预览功能：</strong>可切换到预览模式查看效果</li>
        </ul>
        
        <div className="mermaid-help-compact">
          <h4>📊 图表语法</h4>
          <p>flowchart、sequenceDiagram、classDiagram、gantt</p>
        </div>
      </div>
    </div>
  );
};

export default PostEdit;