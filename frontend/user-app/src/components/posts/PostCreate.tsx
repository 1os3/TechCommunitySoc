import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../../services/postService';
import { CreatePostData } from '../../types/post';
import { useAuth } from '../../contexts/AuthContext';
import MarkdownRenderer from '../common/MarkdownRenderer';
import UserStatusGuard from '../common/UserStatusGuard';

const PostCreate: React.FC = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{title?: string; content?: string; general?: string}>({});
  const [showPreview, setShowPreview] = useState(false);
  
  const [postData, setPostData] = useState<CreatePostData>({
    title: '',
    content: ''
  });

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
    
    if (!postData.title.trim()) {
      newErrors.title = '标题不能为空';
    } else if (postData.title.length > 200) {
      newErrors.title = '标题不能超过200个字符';
    }
    
    if (!postData.content.trim()) {
      newErrors.content = '内容不能为空';
    } else if (postData.content.length > 50000) {
      newErrors.content = '内容不能超过50000个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await postService.createPost({
        title: postData.title.trim(),
        content: postData.content.trim()
      });

      if (result.success && result.data?.post) {
        // 跳转到新创建的帖子详情页
        navigate(`/posts/${result.data.post.id}`);
      } else {
        setErrors({
          general: result.message || '创建帖子失败'
        });
      }
    } catch (error) {
      console.error('Create post error:', error);
      setErrors({
        general: '创建帖子时发生错误，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // 返回上一页
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="post-create-container">
        <div className="auth-required">
          <h2>需要登录</h2>
          <p>请先登录后再发布帖子</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            前往登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <UserStatusGuard action="发布帖子">
      <div className="post-create-container">
        <div className="post-create-header">
          <h1>发布新帖</h1>
          <p>分享您的技术见解，与社区成员一起讨论</p>
        </div>

        <form className="post-create-form" onSubmit={handleSubmit}>
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
            value={postData.title}
            onChange={handleInputChange}
            placeholder="请输入帖子标题（最多200字符）"
            maxLength={200}
            disabled={loading}
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
          <div className="form-help">
            {postData.title.length}/200 字符
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
                disabled={!postData.content.trim()}
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
                value={postData.content}
                onChange={handleInputChange}
                placeholder="请输入帖子内容（最多50000字符）&#10;&#10;提示：&#10;- 支持Markdown格式&#10;- 代码请使用 ```语言 代码块 ``` 格式&#10;- 详细描述您的问题或见解"
                rows={15}
                maxLength={50000}
                disabled={loading}
              />
              {errors.content && <div className="error-message">{errors.content}</div>}
              <div className="form-help">
                {postData.content.length}/50000 字符 | 支持Markdown格式
              </div>
            </>
          ) : (
            <div className="preview-container">
              {postData.content.trim() ? (
                <MarkdownRenderer content={postData.content} />
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
            disabled={loading || !postData.title.trim() || !postData.content.trim()}
          >
            {loading ? '发布中...' : '发布帖子'}
          </button>
        </div>
      </form>

      <div className="post-create-tips">
        <h3>📝 发帖小贴士</h3>
        <ul>
          <li><strong>清晰的标题：</strong>用简洁明了的标题概括您的内容</li>
          <li><strong>详细的描述：</strong>提供足够的背景信息和具体细节</li>
          <li><strong>代码格式：</strong>使用代码块来显示代码片段</li>
          <li><strong>图表支持：</strong>使用 <code>/mermaid_chart图表代码/mermaid_chart</code> 插入图表</li>
          <li><strong>数学公式：</strong>使用 <code>$公式$</code> 插入行内公式，<code>$$公式$$</code> 插入块级公式</li>
          <li><strong>相关内容：</strong>确保内容与技术相关</li>
          <li><strong>搜索现有：</strong>发帖前搜索是否已有相关讨论</li>
        </ul>
        
        <div className="mermaid-help">
          <h4>📊 图表语法示例</h4>
          <div className="mermaid-example">
            <p><strong>流程图：</strong></p>
            <pre><code>{`/mermaid_chart
flowchart TD
    A[开始] --> B{条件判断}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[结束]
    D --> E
/mermaid_chart`}</code></pre>
            <p><strong>序列图：</strong></p>
            <pre><code>{`/mermaid_chart
sequenceDiagram
    用户->>服务器: 发送请求
    服务器->>数据库: 查询数据
    数据库-->>服务器: 返回结果
    服务器-->>用户: 响应数据
/mermaid_chart`}</code></pre>
          </div>
          
          <h4>🔢 数学公式语法示例</h4>
          <div className="mermaid-example">
            <p><strong>行内公式：</strong></p>
            <pre><code>这是一个行内公式 $E=mc^2$ 的示例</code></pre>
            <p><strong>块级公式：</strong></p>
            <pre><code>{`$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$`}</code></pre>
          </div>
        </div>
      </div>
    </div>
    </UserStatusGuard>
  );
};

export default PostCreate;