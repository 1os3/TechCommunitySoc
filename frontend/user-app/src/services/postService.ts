import axios from 'axios';
import {
  CreatePostData,
  UpdatePostData,
  PostFilters,
  PostResponse,
  PostListResponse,
  HotPostsResponse,
  ApiError
} from '../types/post';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const postAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
postAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
postAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const postService = {
  /**
   * 获取帖子列表
   */
  async getPosts(filters: PostFilters = {}): Promise<PostListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.orderBy) params.append('orderBy', filters.orderBy);

      const response = await postAPI.get(`/posts?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to fetch posts',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取热门帖子
   */
  async getHotPosts(limit: number = 20): Promise<HotPostsResponse> {
    try {
      const response = await postAPI.get(`/posts/hot?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to fetch hot posts',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取单个帖子详情
   */
  async getPost(id: number, incrementView: boolean = true): Promise<PostResponse> {
    try {
      const params = incrementView ? '?view=true' : '';
      const response = await postAPI.get(`/posts/${id}${params}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to fetch post',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取指定用户的帖子
   */
  async getUserPosts(userId: number, page: number = 1, limit: number = 20): Promise<PostListResponse> {
    try {
      const response = await postAPI.get(`/posts/user/${userId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to fetch user posts',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 创建新帖子 (需要认证)
   */
  async createPost(postData: CreatePostData): Promise<PostResponse> {
    try {
      const response = await postAPI.post('/posts', postData);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to create post',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 更新帖子 (需要认证，只能更新自己的帖子)
   */
  async updatePost(id: number, updateData: UpdatePostData): Promise<PostResponse> {
    try {
      const response = await postAPI.put(`/posts/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to update post',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 删除帖子 (需要认证，只能删除自己的帖子)
   */
  async deletePost(id: number): Promise<{ success: boolean; message?: string; timestamp: string }> {
    try {
      const response = await postAPI.delete(`/posts/${id}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to delete post',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 搜索帖子
   */
  async searchPosts(query: string, filters: PostFilters = {}): Promise<PostListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (query.trim()) params.append('q', query.trim());
      if (filters.author) params.append('author', filters.author.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.orderBy) params.append('orderBy', filters.orderBy);

      const response = await postAPI.get(`/posts/search?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to search posts',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 搜索用户
   */
  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const params = new URLSearchParams();
      
      params.append('q', query.trim());
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await postAPI.get(`/users/search?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to search users',
        timestamp: new Date().toISOString()
      };
    }
  }
};