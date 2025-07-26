import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  chart: string;
  id?: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart, id }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const uniqueId = useRef(id || `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // 初始化 Mermaid 配置
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
      sequence: {
        useMaxWidth: true,
        wrap: true,
      },
      gantt: {
        useMaxWidth: true,
      },
    });

    const renderChart = async () => {
      if (elementRef.current && chart.trim()) {
        try {
          // 清空容器
          elementRef.current.innerHTML = '';
          
          // 验证图表语法
          const isValid = await mermaid.parse(chart);
          if (isValid) {
            // 渲染图表
            const { svg } = await mermaid.render(uniqueId.current, chart);
            elementRef.current.innerHTML = svg;
          } else {
            throw new Error('Invalid mermaid syntax');
          }
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          elementRef.current.innerHTML = `
            <div class="mermaid-error">
              <p>图表渲染失败</p>
              <details>
                <summary>查看详情</summary>
                <pre>${error instanceof Error ? error.message : '未知错误'}</pre>
                <pre>${chart}</pre>
              </details>
            </div>
          `;
        }
      }
    };

    renderChart();
  }, [chart]);

  return (
    <div 
      ref={elementRef} 
      className="mermaid-container"
      style={{
        textAlign: 'center',
        margin: '1rem 0',
        padding: '1rem',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
      }}
    />
  );
};

export default MermaidRenderer;