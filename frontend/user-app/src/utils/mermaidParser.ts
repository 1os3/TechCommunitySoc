export interface MermaidChart {
  id: string;
  chart: string;
  originalText: string;
}

/**
 * 解析内容中的 Mermaid 图表标记
 * 语法: /mermaid_chart图表代码/mermaid_chart
 */
export const parseMermaidCharts = (content: string): {
  content: string;
  charts: MermaidChart[];
} => {
  const charts: MermaidChart[] = [];
  const regex = /\/mermaid_chart([\s\S]*?)\/mermaid_chart/g;
  let processedContent = content;
  let match;
  let chartIndex = 0;

  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, chartCode] = match;
    const chartId = `mermaid-chart-${chartIndex++}`;
    
    charts.push({
      id: chartId,
      chart: chartCode.trim(),
      originalText: fullMatch,
    });

    // 将原始标记替换为占位符
    processedContent = processedContent.replace(fullMatch, `{{MERMAID_CHART:${chartId}}}`);
  }

  return {
    content: processedContent,
    charts,
  };
};

/**
 * 检查内容是否包含 Mermaid 图表
 */
export const hasMermaidCharts = (content: string): boolean => {
  return /\/mermaid_chart[\s\S]*?\/mermaid_chart/.test(content);
};

/**
 * 提取 Mermaid 图表代码（用于编辑器预览等）
 */
export const extractMermaidCharts = (content: string): string[] => {
  const regex = /\/mermaid_chart([\s\S]*?)\/mermaid_chart/g;
  const charts: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    charts.push(match[1].trim());
  }

  return charts;
};

/**
 * 验证 Mermaid 图表语法的辅助函数（基础验证）
 */
export const validateMermaidSyntax = (chart: string): boolean => {
  if (!chart || typeof chart !== 'string') {
    return false;
  }

  const trimmedChart = chart.trim();
  if (!trimmedChart) {
    return false;
  }

  // 基础语法检查：确保包含常见的 Mermaid 关键字
  const mermaidKeywords = [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 
    'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie',
    'gitgraph', 'mindmap', 'timeline', 'quadrantChart'
  ];

  return mermaidKeywords.some(keyword => 
    trimmedChart.toLowerCase().includes(keyword.toLowerCase())
  );
};