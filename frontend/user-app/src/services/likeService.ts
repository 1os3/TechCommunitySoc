import axios from 'axios';
import { ApiError } from '../types/post';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const likeAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
likeAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
likeAPI.interceptors.response.use(
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

interface LikeToggleResponse {
  success: boolean;
  message?: string;
  data?: {
    liked: boolean;
    like?: {
      id: number;
      user_id: number;
      target_type: string;
      target_id: number;
      created_at: string;
    } | null;
  };
  timestamp: string;
}

interface LikeStatusResponse {
  success: boolean;
  message?: string;
  data?: {
    liked: boolean;
    like_count?: number;
  };
  timestamp: string;
}

interface LikeCountResponse {
  success: boolean;
  message?: string;
  data?: {
    like_count: number;
  };
  timestamp: string;
}

interface BatchLikeStatusRequest {
  targets: Array<{
    type: 'post' | 'comment';
    id: number;
  }>;
}

interface BatchLikeStatusResponse {
  success: boolean;
  message?: string;
  data?: {
    statuses: Array<{
      type: string;
      id: number;
      liked: boolean;
      like_count: number;
    }>;
  };
  timestamp: string;
}

export const likeService = {
  /**
   * 切换帖子点赞状态 (需要认证)
   */
  async togglePostLike(postId: number): Promise<LikeToggleResponse> {
    try {
      const response = await likeAPI.post(`/likes/posts/${postId}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to toggle post like',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 切换评论点赞状态 (需要认证)
   */
  async toggleCommentLike(commentId: number): Promise<LikeToggleResponse> {
    try {
      const response = await likeAPI.post(`/likes/comments/${commentId}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to toggle comment like',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取帖子点赞状态 (需要认证)
   */
  async getPostLikeStatus(postId: number): Promise<LikeStatusResponse> {
    try {
      const response = await likeAPI.get(`/likes/posts/${postId}/status`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to get post like status',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取评论点赞状态 (需要认证)
   */
  async getCommentLikeStatus(commentId: number): Promise<LikeStatusResponse> {
    try {
      const response = await likeAPI.get(`/likes/comments/${commentId}/status`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to get comment like status',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 批量获取点赞状态 (需要认证)
   */
  async getBatchLikeStatus(targets: BatchLikeStatusRequest['targets']): Promise<BatchLikeStatusResponse> {
    try {
      const response = await likeAPI.post('/likes/batch/status', { targets });
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to get batch like status',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取帖子点赞数量 (公开端点)
   */
  async getPostLikeCount(postId: number): Promise<LikeCountResponse> {
    try {
      const response = await likeAPI.get(`/likes/posts/${postId}/count`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to get post like count',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取评论点赞数量 (公开端点)
   */
  async getCommentLikeCount(commentId: number): Promise<LikeCountResponse> {
    try {
      const response = await likeAPI.get(`/likes/comments/${commentId}/count`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to get comment like count',
        timestamp: new Date().toISOString()
      };
    }
  }
};