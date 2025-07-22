import React from 'react';
import { PostFilters } from '../../types/post';

interface PostFilterProps {
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
}

const PostFilter: React.FC<PostFilterProps> = ({ filters, onFiltersChange }) => {
  const handleSortChange = (orderBy: string) => {
    onFiltersChange({
      ...filters,
      orderBy: orderBy as PostFilters['orderBy']
    });
  };

  const handleLimitChange = (limit: number) => {
    onFiltersChange({
      ...filters,
      limit,
      page: 1 // 重置到第一页
    });
  };

  const sortOptions = [
    { value: 'created_at', label: '最新发布' },
    { value: 'updated_at', label: '最近更新' },
    { value: 'hotness_score', label: '热度排序' },
    { value: 'like_count', label: '点赞最多' },
    { value: 'view_count', label: '浏览最多' }
  ];

  const limitOptions = [
    { value: 10, label: '10条/页' },
    { value: 20, label: '20条/页' },
    { value: 50, label: '50条/页' }
  ];

  return (
    <div className="post-filter">
      <div className="filter-section">
        <label className="filter-label">排序方式</label>
        <select 
          className="filter-select"
          value={filters.orderBy || 'created_at'}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label">每页显示</label>
        <select 
          className="filter-select"
          value={filters.limit || 20}
          onChange={(e) => handleLimitChange(Number(e.target.value))}
        >
          {limitOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PostFilter;