import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../../services/postService';
import { UserSearchItem } from '../../types/post';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string, searchType: 'posts' | 'users') => void;
  showUserSuggestions?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '搜索帖子...',
  onSearch,
  showUserSuggestions = true,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<UserSearchItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'posts' | 'users'>('posts');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // 搜索用户建议
  const searchUserSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !showUserSuggestions) {
      setUserSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await postService.searchUsers(searchQuery, 1, 5);
      if (response.success && response.data) {
        setUserSuggestions(response.data.users);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [showUserSuggestions]);

  // 防抖搜索
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      if (searchMode === 'users') {
        searchUserSuggestions(searchQuery);
      }
    }, 300);
  }, [searchUserSuggestions, searchMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      setShowSuggestions(true);
      debouncedSearch(value);
    } else {
      setShowSuggestions(false);
      setUserSuggestions([]);
    }
  };

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    setShowSuggestions(false);
    
    if (onSearch) {
      onSearch(finalQuery, searchMode);
    } else {
      // 如果没有传入onSearch回调，则跳转到搜索页面
      if (searchMode === 'posts') {
        navigate(`/?search=${encodeURIComponent(finalQuery)}`);
      } else {
        navigate(`/?search=${encodeURIComponent(finalQuery)}&type=users`);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleUserClick = (user: UserSearchItem) => {
    setQuery(user.username);
    setShowSuggestions(false);
    navigate(`/?author=${user.id}`);
  };

  const handleModeChange = (mode: 'posts' | 'users') => {
    setSearchMode(mode);
    setUserSuggestions([]);
    setShowSuggestions(false);
  };

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`search-container ${className}`}>
      <div className="search-modes">
        <button
          type="button"
          className={`search-mode-btn ${searchMode === 'posts' ? 'active' : ''}`}
          onClick={() => handleModeChange('posts')}
        >
          搜索帖子
        </button>
        <button
          type="button"
          className={`search-mode-btn ${searchMode === 'users' ? 'active' : ''}`}
          onClick={() => handleModeChange('users')}
        >
          搜索用户
        </button>
      </div>
      
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={searchMode === 'posts' ? '搜索帖子标题或内容...' : '搜索用户名...'}
          className="search-input"
        />
        <button
          type="button"
          onClick={() => handleSearch()}
          className="search-button"
          disabled={!query.trim()}
        >
          🔍
        </button>

        {showSuggestions && searchMode === 'users' && (
          <div className="search-suggestions">
            {isLoading ? (
              <div className="suggestion-item loading">搜索中...</div>
            ) : userSuggestions.length > 0 ? (
              userSuggestions.map((user) => (
                <div
                  key={user.id}
                  className="suggestion-item user-suggestion"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-info">
                    <span className="username">{user.username}</span>
                    <span className="post-count">{user.post_count} 个帖子</span>
                  </div>
                </div>
              ))
            ) : query.trim() && !isLoading ? (
              <div className="suggestion-item no-results">未找到匹配的用户</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;