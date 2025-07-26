import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import MermaidRenderer from './MermaidRenderer';
import { parseMermaidCharts } from '../../utils/mermaidParser';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  allowHtml?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '', 
  allowHtml = false 
}) => {
  const rehypePlugins: any[] = [
    rehypeHighlight, 
    [rehypeKatex, {
      strict: false,
      trust: true,
      throwOnError: false,
      output: 'htmlAndMathml',
      displayMode: false
    }]
  ];  
  const remarkPlugins: any[] = [remarkGfm, remarkMath];

  // 解析 Mermaid 图表
  const { content: processedContent, charts } = parseMermaidCharts(content);

  // Markdown 组件配置
  const markdownComponents = {
    // 自定义组件渲染
    h1: ({ children }: any) => <h1 className="markdown-h1">{children}</h1>,
    h2: ({ children }: any) => <h2 className="markdown-h2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="markdown-h3">{children}</h3>,
    h4: ({ children }: any) => <h4 className="markdown-h4">{children}</h4>,
    h5: ({ children }: any) => <h5 className="markdown-h5">{children}</h5>,
    h6: ({ children }: any) => <h6 className="markdown-h6">{children}</h6>,
    p: ({ children }: any) => <p className="markdown-p">{children}</p>,
    ul: ({ children }: any) => <ul className="markdown-ul">{children}</ul>,
    ol: ({ children }: any) => <ol className="markdown-ol">{children}</ol>,
    li: ({ children }: any) => <li className="markdown-li">{children}</li>,
    blockquote: ({ children }: any) => <blockquote className="markdown-blockquote">{children}</blockquote>,
    code: ({ className, children, ...props }: any) => {
      const inline = !className?.includes('language-');
      return !inline ? (
        <code className={`markdown-code-block ${className || ''}`} {...props}>
          {children}
        </code>
      ) : (
        <code className="markdown-code-inline" {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }: any) => <pre className="markdown-pre">{children}</pre>,
    table: ({ children }: any) => <table className="markdown-table">{children}</table>,
    thead: ({ children }: any) => <thead className="markdown-thead">{children}</thead>,
    tbody: ({ children }: any) => <tbody className="markdown-tbody">{children}</tbody>,
    tr: ({ children }: any) => <tr className="markdown-tr">{children}</tr>,
    th: ({ children }: any) => <th className="markdown-th">{children}</th>,
    td: ({ children }: any) => <td className="markdown-td">{children}</td>,
    a: ({ href, children }: any) => (
      <a 
        href={href} 
        className="markdown-link" 
        target="_blank" 
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    img: ({ src, alt }: any) => (
      <img 
        src={src} 
        alt={alt} 
        className="markdown-img"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1pbWFnZSI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIvPjxwb2x5bGluZSBwb2ludHM9IjIxLDE1IDEzLjUsNy41IDciLz48L3N2Zz4=';
          target.alt = '图片加载失败';
        }}
      />
    ),
    hr: () => <hr className="markdown-hr" />,
    strong: ({ children }: any) => <strong className="markdown-strong">{children}</strong>,
    em: ({ children }: any) => <em className="markdown-em">{children}</em>,
    del: ({ children }: any) => <del className="markdown-del">{children}</del>,
    // LaTeX 让 KaTeX 使用原生样式
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  };

  // 渲染包含 Mermaid 图表的内容
  const renderContent = () => {
    const chartMap = new Map(charts.map(chart => [chart.id, chart]));
    
    // 自定义组件，用于处理Mermaid占位符
    const customComponents = {
      ...markdownComponents,
      p: ({ children, ...props }: any) => {
        // 检查段落是否只包含图表占位符
        if (React.Children.count(children) === 1 && typeof children === 'string') {
          const chartMatch = children.match(/^{{MERMAID_CHART:([^}]+)}}$/);
          if (chartMatch) {
            const chartId = chartMatch[1];
            const chart = chartMap.get(chartId);
            if (chart) {
              return <MermaidRenderer key={chartId} id={chartId} chart={chart.chart} />;
            }
            return null;
          }
        }
        return <p className="markdown-p" {...props}>{children}</p>;
      },
    };
    
    // 始终使用处理后的内容（将 Mermaid 语法替换为占位符）
    return (
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={customComponents}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  return (
    <div className={`markdown-content ${className}`}>
      {renderContent()}
    </div>
  );
};

export default MarkdownRenderer;