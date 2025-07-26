import React, { useState, useEffect, useCallback } from 'react';
import { Marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import 'katex/dist/katex.min.css';
import api from '../services/api';
import './PostModal.css';
import './enhanced-markdown.css';
import MermaidRenderer from './MermaidRenderer';
import { parseMermaidCharts } from '../utils/mermaidParser';

// 创建一个独立的 marked 实例，避免全局污染和重复插件注册
const createMarkedInstance = () => {
  const markedInstance = new Marked();
  
  // 只添加一次 KaTeX 插件
  markedInstance.use(markedKatex({
    throwOnError: false,
    nonStandard: true,
    strict: false,
    trust: true,
    output: 'htmlAndMathml',
    displayMode: false
  } as any));
  
  markedInstance.setOptions({
    breaks: true,
    gfm: true,
  });
  
  return markedInstance;
};

// 使用 WeakMap 或单例模式确保只创建一次实例
let markedInstance: Marked | null = null;
const getMarkedInstance = () => {
  if (!markedInstance) {
    markedInstance = createMarkedInstance();
  }
  return markedInstance;
};

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

  const renderMarkdownWithMermaid = (content: string) => {
    // 确保content存在且是字符串
    if (!content || typeof content !== 'string') {
      return <div></div>;
    }

    // 获取配置好的 marked 实例
    const markedInstance = getMarkedInstance();

    // 解析 Mermaid 图表
    const { content: processedContent, charts } = parseMermaidCharts(content);

    if (charts.length === 0) {
      // 没有图表，直接渲染原始内容
      try {
        const html = markedInstance.parse(content, { async: false }) as string;
        return (
          <div 
            className="markdown-content enhanced-markdown"
            dangerouslySetInnerHTML={{ __html: html }} 
          />
        );
      } catch (error) {
        console.error('Markdown渲染失败:', error);
        return <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }} />;
      }
    }

    // 有图表，先完整渲染markdown，再替换图表占位符
    try {
      // 先完整处理内容，确保LaTeX正确渲染
      const html = markedInstance.parse(processedContent, { async: false }) as string;
      const chartMap = new Map(charts.map(chart => [chart.id, chart]));
      
      // 使用React处理HTML和图表的混合内容
      const renderHtmlWithCharts = () => {
        const parts = html.split(/({{MERMAID_CHART:[^}]+}})/);
        
        return parts.map((part, index) => {
          const chartMatch = part.match(/{{MERMAID_CHART:([^}]+)}}/);
          if (chartMatch) {
            const chartId = chartMatch[1];
            const chart = chartMap.get(chartId);
            if (chart) {
              return <MermaidRenderer key={`chart-${index}`} id={chartId} chart={chart.chart} />;
            }
            return null;
          }
          
          // 对于HTML部分，直接使用dangerouslySetInnerHTML
          if (part.trim()) {
            return <div key={`html-${index}`} dangerouslySetInnerHTML={{ __html: part }} />;
          }
          
          return null;
        }).filter(Boolean);
      };
      
      return (
        <div className="markdown-content enhanced-markdown">
          {renderHtmlWithCharts()}
        </div>
      );
    } catch (error) {
      console.error('Markdown渲染失败:', error);
      return <div className="markdown-content enhanced-markdown" dangerouslySetInnerHTML={{ __html: processedContent.replace(/\n/g, '<br>') }} />;
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
                <div className="markdown-content">
                  {renderMarkdownWithMermaid(post.content || '')}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PostModal;