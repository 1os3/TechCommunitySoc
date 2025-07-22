import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import PostModal from '../components/PostModal';
import './ContentManagement.css';

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  author_id: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: number;
  content: string;
  author: string;
  author_id: number;
  post_id: number;
  post_title: string;
  parent_id?: number;
  like_count: number;
  reply_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface ViolationStats {
  userId: number;
  username: string;
  violationCount: number;
  lastViolation: string;
}

interface ViolationWord {
  id: number;
  word: string;
  is_regex: boolean;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// interface Violation {
//   id: number;
//   user_id: number;
//   username: string;
//   content_type: string;
//   content_id: number;
//   violation_word_id: number;
//   violation_word: string;
//   is_regex: boolean;
//   matched_text: string;
//   content_snippet: string;
//   status: 'pending' | 'reviewed' | 'ignored';
//   notes?: string;
//   created_at: string;
//   updated_at: string;
// }

const ContentManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'posts' | 'comments' | 'words'>('posts');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsSearch, setPostsSearch] = useState('');

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsSearch, setCommentsSearch] = useState('');
  const [commentsPostId, setCommentsPostId] = useState('');

  // Violation stats state
  const [violationStats, setViolationStats] = useState<ViolationStats[]>([]);

  // Violation words state
  const [violationWords, setViolationWords] = useState<ViolationWord[]>([]);
  const [newWord, setNewWord] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [showAddWordForm, setShowAddWordForm] = useState(false);

  // Post modal state
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const limit = 20;

  // Fetch functions
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminService.getPosts({
        page: postsPage,
        limit,
        search: postsSearch || undefined
      });

      if (response.success && response.data) {
        const postsData = response.data.posts || [];
        const totalCount = response.data.pagination?.total || 0;
        
        const transformedPosts = postsData.map((post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          author: post.author?.username || 'Unknown',
          author_id: post.author_id,
          view_count: post.view_count || 0,
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0,
          is_deleted: post.is_deleted || false,
          created_at: post.created_at,
          updated_at: post.updated_at
        }));
        
        // Filter out deleted posts
        const activePosts = transformedPosts.filter((post: any) => !post.is_deleted);
        setPosts(activePosts);
        setPostsTotal(totalCount);
      } else {
        setError(response.error || '获取帖子失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminService.getComments({
        page: commentsPage,
        limit,
        search: commentsSearch || undefined,
        postId: commentsPostId || undefined
      });

      if (response.success && response.data) {
        const commentsData = response.data.comments || [];
        const totalCount = response.data.pagination?.total || 0;
        
        setComments(commentsData);
        setCommentsTotal(totalCount);
      } else {
        setError(response.error || '获取评论失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };


  const fetchViolationStats = async () => {
    try {
      const response = await AdminService.getViolationStats(10, 15);
      if (response.success && response.data) {
        // 使用正确的数据路径，并修复字段名映射
        const rawStats = response.data.stats || [];
        
        // 在前端进行字段名映射，以防后端映射失效
        const mappedStats = rawStats.map((stat: any) => ({
          userId: stat.userId || stat.user_id,
          username: stat.username,
          violationCount: parseInt(stat.violationCount || stat.violation_count) || 0,
          lastViolation: stat.lastViolation || stat.last_violation
        }));
        
        setViolationStats(mappedStats);
      }
    } catch (err) {
      console.error('获取违规统计失败:', err);
    }
  };

  const fetchViolationWords = async () => {
    try {
      const response = await AdminService.getViolationWords();
      if (response.success) {
        setViolationWords(response.data.violation_words);
      }
    } catch (err) {
      console.error('获取违规词失败:', err);
    }
  };

  // Effect hooks
  useEffect(() => {
    if (currentTab === 'posts') {
      fetchPosts();
    } else if (currentTab === 'comments') {
      fetchComments();
    } else if (currentTab === 'words') {
      fetchViolationWords();
      fetchViolationStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, postsPage, commentsPage]);

  // Action handlers
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('确定要删除这个帖子吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await AdminService.deletePost(postId);
      if (response.success) {
        fetchPosts();
      } else {
        setError(response.error || '删除帖子失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('确定要删除这个评论吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await AdminService.deleteComment(commentId);
      if (response.success) {
        fetchComments();
      } else {
        setError(response.error || '删除评论失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    }
  };

  const handleAddViolationWord = async () => {
    if (!newWord.trim()) {
      alert('请输入违规词');
      return;
    }

    try {
      const response = await AdminService.addViolationWord(newWord.trim(), isRegex);
      if (response.success) {
        setNewWord('');
        setIsRegex(false);
        setShowAddWordForm(false);
        fetchViolationWords();
      } else {
        alert(response.error || '添加违规词失败');
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
    }
  };

  const handleRemoveViolationWord = async (wordId: number) => {
    if (!window.confirm('确定要删除这个违规词吗？')) {
      return;
    }

    try {
      const response = await AdminService.removeViolationWord(wordId);
      if (response.success) {
        fetchViolationWords();
      } else {
        alert(response.error || '删除违规词失败');
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
    }
  };


  const handleViewPost = (postId: number) => {
    setSelectedPostId(postId);
    setIsPostModalOpen(true);
  };

  const handleClosePostModal = () => {
    setIsPostModalOpen(false);
    setSelectedPostId(null);
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div className="content-management">
      <div className="page-header">
        <h1>内容管理</h1>
        <p>管理论坛内容、违规词和违规统计</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${currentTab === 'posts' ? 'active' : ''}`}
          onClick={() => setCurrentTab('posts')}
        >
          帖子管理
        </button>
        <button
          className={`tab-button ${currentTab === 'comments' ? 'active' : ''}`}
          onClick={() => setCurrentTab('comments')}
        >
          评论管理
        </button>
        <button
          className={`tab-button ${currentTab === 'words' ? 'active' : ''}`}
          onClick={() => setCurrentTab('words')}
        >
          违规词管理
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {currentTab === 'posts' && (
          <div className="posts-tab">
            <div className="search-section">
              <div className="search-form">
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="搜索帖子标题或内容..."
                    value={postsSearch}
                    onChange={(e) => setPostsSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
                    className="search-input"
                  />
                  <button className="search-button" onClick={fetchPosts}>
                    搜索
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading-message">加载中...</div>
            ) : (
              <>
                <div className="content-table">
                  <table>
                    <thead>
                      <tr>
                        <th>标题</th>
                        <th>作者</th>
                        <th>统计</th>
                        <th>创建时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post) => (
                        <tr key={post.id}>
                          <td>
                            <div className="post-title">{post.title}</div>
                          </td>
                          <td>{post.author}</td>
                          <td>
                            <div className="stats">
                              <div>👀 {post.view_count}</div>
                              <div>👍 {post.like_count}</div>
                              <div>💬 {post.comment_count}</div>
                            </div>
                          </td>
                          <td>{formatDate(post.created_at)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="delete-button"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                删除
                              </button>
                              <button
                                className="view-button"
                                onClick={() => handleViewPost(post.id)}
                              >
                                查看
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {Math.ceil(postsTotal / limit) > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-button"
                      disabled={postsPage === 1}
                      onClick={() => setPostsPage(postsPage - 1)}
                    >
                      上一页
                    </button>
                    <span className="pagination-info">
                      第 {postsPage} 页 / 共 {Math.ceil(postsTotal / limit)} 页
                    </span>
                    <button
                      className="pagination-button"
                      disabled={postsPage === Math.ceil(postsTotal / limit)}
                      onClick={() => setPostsPage(postsPage + 1)}
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {currentTab === 'comments' && (
          <div className="comments-tab">
            <div className="search-section">
              <div className="search-form">
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="搜索评论内容..."
                    value={commentsSearch}
                    onChange={(e) => setCommentsSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchComments()}
                    className="search-input"
                  />
                  <input
                    type="text"
                    placeholder="帖子ID..."
                    value={commentsPostId}
                    onChange={(e) => setCommentsPostId(e.target.value)}
                    className="search-input"
                  />
                  <button className="search-button" onClick={fetchComments}>
                    搜索
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading-message">加载中...</div>
            ) : (
              <>
                <div className="content-table">
                  <table>
                    <thead>
                      <tr>
                        <th>评论内容</th>
                        <th>作者</th>
                        <th>所属帖子</th>
                        <th>统计</th>
                        <th>创建时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comments.map((comment) => (
                        <tr key={comment.id}>
                          <td>
                            <div className="comment-content">
                              {comment.parent_id && <div className="reply-indicator">回复评论</div>}
                              <div>{truncateContent(comment.content)}</div>
                            </div>
                          </td>
                          <td>{comment.author}</td>
                          <td>
                            <div className="post-info">
                              <div className="post-title">{comment.post_title}</div>
                              <div className="post-id">ID: {comment.post_id}</div>
                            </div>
                          </td>
                          <td>
                            <div className="stats">
                              <div>👍 {comment.like_count}</div>
                            </div>
                          </td>
                          <td>{formatDate(comment.created_at)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="delete-button"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {Math.ceil(commentsTotal / limit) > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-button"
                      disabled={commentsPage === 1}
                      onClick={() => setCommentsPage(commentsPage - 1)}
                    >
                      上一页
                    </button>
                    <span className="pagination-info">
                      第 {commentsPage} 页 / 共 {Math.ceil(commentsTotal / limit)} 页
                    </span>
                    <button
                      className="pagination-button"
                      disabled={commentsPage === Math.ceil(commentsTotal / limit)}
                      onClick={() => setCommentsPage(commentsPage + 1)}
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}


        {currentTab === 'words' && (
          <div className="words-tab">
            <div className="violations-layout">
              <div className="violations-main">
                <div className="section-header">
                  <h2>违规词管理</h2>
                  <button 
                    className="add-word-button"
                    onClick={() => setShowAddWordForm(!showAddWordForm)}
                  >
                    {showAddWordForm ? '取消' : '添加违规词'}
                  </button>
                </div>

                {showAddWordForm && (
                  <div className="add-word-form">
                    <div className="form-row">
                      <input
                        type="text"
                        placeholder="输入违规词或正则表达式"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        className="form-input"
                      />
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={isRegex}
                          onChange={(e) => setIsRegex(e.target.checked)}
                        />
                        正则表达式
                      </label>
                      <button className="add-button" onClick={handleAddViolationWord}>
                        添加
                      </button>
                    </div>
                    {isRegex && (
                      <div className="regex-help">
                        <small>正则表达式示例: <code>\b(垃圾|广告)\b</code></small>
                      </div>
                    )}
                  </div>
                )}

                <div className="violation-words-grid">
                  {violationWords.map((word) => (
                    <div key={word.id} className="violation-word-item">
                      <div className="word-content">
                        <span className="word-text">{word.word}</span>
                        {word.is_regex && <span className="regex-badge">正则</span>}
                      </div>
                      <button 
                        className="delete-button"
                        onClick={() => handleRemoveViolationWord(word.id)}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="violation-stats-sidebar">
                <h3>违规用户统计</h3>
                <p className="stats-subtitle">10天内尝试违规超过15次的用户</p>
                {violationStats.length > 0 ? (
                  <div className="violation-stats-list">
                    {violationStats.map((stat, index) => (
                      <div key={`violation-${stat.userId || index}`} className="violation-stat-item">
                        <div className="stat-username">{stat.username || '未知用户'}</div>
                        <div className="stat-count">违规: {stat.violationCount || 0} 次</div>
                        <div className="stat-date">
                          最近: {stat.lastViolation ? formatDate(stat.lastViolation) : '未知'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-violations">暂无违规用户</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Modal */}
      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          isOpen={isPostModalOpen}
          onClose={handleClosePostModal}
        />
      )}
    </div>
  );
};

export default ContentManagement;