import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PostList from './PostList';
import PostFilter from './PostFilter';
import HotPosts from './HotPosts';
import SearchBar from '../common/SearchBar';
import SearchResults from './SearchResults';
import Modal from '../common/Modal';
import NotificationIcon from '../common/NotificationIcon';
import { PostFilters } from '../../types/post';
import { useAuth } from '../../contexts/AuthContext';

const PostBrowse: React.FC = () => {
  const { state: authState } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<PostFilters>({
    page: 1,
    limit: 20,
    orderBy: 'created_at'
  });
  const [error, setError] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{ isOpen: boolean; title: string; content: React.ReactNode }>({
    isOpen: false,
    title: '',
    content: null
  });
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'posts' | 'users'>('posts');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // 处理URL参数
  useEffect(() => {
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const author = searchParams.get('author');
    
    if (search) {
      setSearchQuery(search);
      setIsSearchMode(true);
      setSearchType(type === 'users' ? 'users' : 'posts');
    } else if (author) {
      setFilters(prev => ({ ...prev, author: parseInt(author) }));
      setIsSearchMode(false);
    } else {
      setIsSearchMode(false);
      setSearchQuery('');
    }
  }, [searchParams]);

  const handleFiltersChange = (newFilters: PostFilters) => {
    setFilters(newFilters);
    setError(null);
    
    // 更新URL参数
    const newParams = new URLSearchParams();
    if (newFilters.author) {
      newParams.set('author', newFilters.author.toString());
    }
    setSearchParams(newParams);
  };

  const handleSearch = (query: string, type: 'posts' | 'users') => {
    setSearchQuery(query);
    setSearchType(type);
    setIsSearchMode(true);
    
    // 更新URL参数
    const newParams = new URLSearchParams();
    newParams.set('search', query);
    if (type === 'users') {
      newParams.set('type', 'users');
    }
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setSearchType('posts');
    // 清除所有过滤器，包括author过滤器
    setFilters({
      page: 1,
      limit: 20,
      orderBy: 'created_at'
    });
    setSearchParams(new URLSearchParams());
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const openModal = (title: string, content: React.ReactNode) => {
    setModalContent({ isOpen: true, title, content });
  };

  const closeModal = () => {
    setModalContent({ isOpen: false, title: '', content: null });
  };

  const PostingRules = () => (
    <div>
      <h4>📋 发帖规则</h4>
      <ol>
        <li><strong>内容要求</strong>
          <ul>
            <li>发布与技术相关的内容，包括但不限于编程、算法、系统设计、技术分享等</li>
            <li>标题要简洁明了，准确概括帖子内容</li>
            <li>内容要详细具体，提供足够的背景信息</li>
          </ul>
        </li>
        <li><strong>格式规范</strong>
          <ul>
            <li>代码片段请使用代码块格式</li>
            <li>长篇内容建议使用段落分隔，便于阅读</li>
            <li>如有图片或链接，请确保其有效性</li>
          </ul>
        </li>
        <li><strong>禁止内容</strong>
          <ul>
            <li>禁止发布广告、垃圾信息</li>
            <li>禁止发布与技术无关的内容</li>
            <li>禁止恶意刷屏或重复发帖</li>
            <li>禁止发布侵犯他人版权的内容</li>
          </ul>
        </li>
        <li><strong>提问建议</strong>
          <ul>
            <li>提问前请先搜索是否已有相关讨论</li>
            <li>描述问题时请提供完整的错误信息和代码</li>
            <li>说明你已经尝试过的解决方案</li>
          </ul>
        </li>
      </ol>
    </div>
  );

  const CommunityGuidelines = () => (
    <div>
      <h4>🤝 社区公约</h4>
      <div>
        <h5>我们的使命</h5>
        <p>技术社区论坛致力于为广大技术爱好者提供一个开放、友好、专业的交流平台，促进技术知识的分享与传播。</p>
        
        <h5>核心价值观</h5>
        <ul>
          <li><strong>开放包容</strong> - 欢迎不同技术背景和经验水平的开发者</li>
          <li><strong>互助共享</strong> - 分享知识，帮助他人成长</li>
          <li><strong>专业严谨</strong> - 保持技术讨论的专业性和准确性</li>
          <li><strong>尊重友善</strong> - 尊重每个人的观点和贡献</li>
        </ul>

        <h5>行为准则</h5>
        <ol>
          <li><strong>尊重他人</strong>
            <ul>
              <li>使用礼貌和专业的语言</li>
              <li>避免人身攻击和恶意评论</li>
              <li>尊重不同的技术观点和解决方案</li>
            </ul>
          </li>
          <li><strong>建设性参与</strong>
            <ul>
              <li>提供有价值的技术见解和建议</li>
              <li>给出具体的解决方案而非模糊的建议</li>
              <li>承认错误并愿意学习改进</li>
            </ul>
          </li>
          <li><strong>保护社区环境</strong>
            <ul>
              <li>举报不当内容和行为</li>
              <li>不传播恶意信息或谣言</li>
              <li>维护讨论的专业性</li>
            </ul>
          </li>
        </ol>

        <h5>违规处理</h5>
        <p>对于违反社区公约的行为，管理员将根据情况采取以下措施：</p>
        <ul>
          <li>警告提醒</li>
          <li>删除违规内容</li>
          <li>临时禁言</li>
          <li>永久封号</li>
        </ul>
      </div>
    </div>
  );

  const FAQ = () => (
    <div>
      <h4>❓ 常见问题</h4>
      
      <h5>账户相关</h5>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Q: 如何注册账户？</strong><br/>
        A: 点击右上角"注册"按钮，填写用户名、邮箱和密码即可完成注册。
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Q: 忘记密码怎么办？</strong><br/>
        A: 请通过邮箱 qer10900@outlook.com 联系技术支持，我们会协助您重置密码。
      </div>

      <h5>发帖相关</h5>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Q: 如何发布新帖？</strong><br/>
        A: 登录后点击"发布新帖"按钮，填写标题和内容即可发布。
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Q: 可以编辑已发布的帖子吗？</strong><br/>
        A: 可以，在帖子详情页面点击"编辑"按钮即可修改内容。
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Q: 如何删除帖子？</strong><br/>
        A: 只能删除自己发布的帖子，在帖子详情页面点击"删除"按钮。
      </div>

      <h5>互动功能</h5>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Q: 如何点赞帖子？</strong><br/>
        A: 在帖子详情页面点击"👍 点赞"按钮即可。
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Q: 如何评论帖子？</strong><br/>
        A: 评论功能正在开发中，敬请期待。
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Q: 什么是热度分数？</strong><br/>
        A: 热度分数是基于帖子的点赞数、评论数、浏览量和发布时间计算的综合评分。
      </div>

      <h5>技术支持</h5>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Q: 遇到技术问题怎么办？</strong><br/>
        A: 可以通过邮箱 qer10900@outlook.com 联系我们的技术支持团队。
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Q: 如何举报不当内容？</strong><br/>
        A: 请发送邮件到 qer10900@outlook.com，详细说明问题内容。
      </div>
    </div>
  );

  const ContactInfo = () => (
    <div>
      <h4>📧 联系我们</h4>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <h5>技术支持</h5>
        <p>如果您在使用过程中遇到任何技术问题，请联系我们：</p>
        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
          <strong>邮箱：</strong> <a href="mailto:qer10900@outlook.com">qer10900@outlook.com</a>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          我们会在24小时内回复您的邮件。
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h5>意见反馈</h5>
        <p>我们重视您的每一条建议，请通过以下方式向我们反馈：</p>
        <ul>
          <li>功能建议和改进意见</li>
          <li>Bug反馈和问题报告</li>
          <li>用户体验优化建议</li>
          <li>内容审核相关问题</li>
        </ul>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h5>商务合作</h5>
        <p>如有商务合作需求，欢迎通过邮箱联系我们，我们期待与您的合作。</p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h5>社区管理</h5>
        <p>如需举报违规内容或用户行为，请发送详细信息至我们的邮箱，我们会及时处理。</p>
      </div>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        <p><strong>技术社区论坛</strong></p>
        <p>让技术连接世界，让知识创造价值</p>
      </div>
    </div>
  );

  const HotPostsModal = () => (
    <div>
      <HotPosts 
        limit={50} 
        showViewCounts={true}
        className="modal-hot-posts"
      />
    </div>
  );

  return (
    <div className="post-browse-container">
      <div className="post-browse-header">
        <div className="header-content">
          <h1>技术社区论坛</h1>
          <p>分享技术，交流经验，共同成长</p>
        </div>
        
        {authState.isAuthenticated && (
          <div className="header-actions">
            <NotificationIcon className="header-notification" />
            <Link 
              to="/profile"
              className="btn btn-secondary"
            >
              个人中心
            </Link>
            <Link 
              to="/posts/create"
              className="btn btn-primary"
            >
              发布新帖
            </Link>
          </div>
        )}
      </div>

      <div className="post-browse-layout">
        <main className="post-browse-main">
          {/* 搜索栏 */}
          <div className="search-section">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="搜索帖子标题或内容..."
            />
            
            {isSearchMode && (
              <div className="search-controls">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={handleClearSearch}
                >
                  清除搜索
                </button>
                <span className="search-info">
                  搜索: "{searchQuery}"
                </span>
              </div>
            )}
          </div>

          {!isSearchMode && (
            <div className="post-browse-controls">
              <PostFilter 
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          )}

          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setError(null)}
              >
                关闭
              </button>
            </div>
          )}

          {isSearchMode ? (
            <SearchResults
              query={searchQuery}
              searchType={searchType}
              filters={filters}
              onError={handleError}
            />
          ) : (
            <PostList 
              title={filters.author ? "用户帖子" : "帖子列表"}
              filters={filters}
              onError={handleError}
            />
          )}
        </main>

        <aside className="post-browse-sidebar">
          <HotPosts 
            limit={10} 
            onViewAll={() => openModal('热门帖子', <HotPostsModal />)}
          />
          

          {!authState.isAuthenticated && (
            <div className="sidebar-section">
              <h3>加入我们</h3>
              <p>注册账户，参与讨论，分享您的技术见解</p>
              <div className="auth-actions">
                <Link to="/register" className="btn btn-primary btn-block">
                  注册账户
                </Link>
                <Link to="/login" className="btn btn-secondary btn-block">
                  立即登录
                </Link>
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <h3>帮助信息</h3>
            <ul className="help-links">
              <li><button className="link-button" onClick={() => openModal('发帖规则', <PostingRules />)}>发帖规则</button></li>
              <li><button className="link-button" onClick={() => openModal('社区公约', <CommunityGuidelines />)}>社区公约</button></li>
              <li><button className="link-button" onClick={() => openModal('常见问题', <FAQ />)}>常见问题</button></li>
              <li><button className="link-button" onClick={() => openModal('联系我们', <ContactInfo />)}>联系我们</button></li>
            </ul>
          </div>
        </aside>
      </div>

      <Modal
        isOpen={modalContent.isOpen}
        onClose={closeModal}
        title={modalContent.title}
      >
        {modalContent.content}
      </Modal>
    </div>
  );
};

export default PostBrowse;