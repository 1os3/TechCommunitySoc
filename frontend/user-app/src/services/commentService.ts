import axios from 'axios';
import { Comment, CreateCommentData, ApiError } from '../types/post';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const commentAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
commentAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
commentAPI.interceptors.response.use(
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

interface CommentResponse {
  success: boolean;
  message?: string;
  data?: {
    comment: Comment;
  };
  timestamp: string;
}

interface CommentsListResponse {
  success: boolean;
  message?: string;
  data?: {
    comments: Comment[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  timestamp: string;
}

interface CommentsTreeResponse {
  success: boolean;
  message?: string;
  data?: {
    commentTree: Comment[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  timestamp: string;
}

export const commentService = {
  /**
   * 创建新评论 (需要认证)
   */
  async createComment(postId: number, commentData: CreateCommentData): Promise<CommentResponse> {
    try {
      const response = await commentAPI.post(`/comments/posts/${postId}`, commentData);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to create comment',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取帖子的评论列表（扁平结构）
   */
  async getPostComments(postId: number, page: number = 1, limit: number = 20, orderBy: string = 'created_at'): Promise<CommentsListResponse> {
    try {
      const response = await commentAPI.get(`/comments/posts/${postId}?page=${page}&limit=${limit}&orderBy=${orderBy}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to fetch comments',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取帖子的评论树形结构
   */
  async getPostCommentsTree(postId: number, page: number = 1, limit: number = 20, orderBy: string = 'created_at', maxDepth: number = 5): Promise<CommentsTreeResponse> {
    try {
      const response = await commentAPI.get(`/comments/posts/${postId}/tree?page=${page}&limit=${limit}&orderBy=${orderBy}&maxDepth=${maxDepth}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to fetch comment tree',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取帖子的评论扁平化结构（带层级信息）
   */
  async getPostCommentsFlattened(postId: number, page: number = 1, limit: number = 50, orderBy: string = 'created_at', maxDepth: number = 5): Promise<CommentsListResponse> {
    try {
      const response = await commentAPI.get(`/comments/posts/${postId}/flattened?page=${page}&limit=${limit}&orderBy=${orderBy}&maxDepth=${maxDepth}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to fetch flattened comments',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取评论的回复
   */
  async getCommentReplies(commentId: number, page: number = 1, limit: number = 10): Promise<CommentsListResponse> {
    try {
      const response = await commentAPI.get(`/comments/${commentId}/replies?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to fetch replies',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取单个评论详情
   */
  async getComment(commentId: number): Promise<CommentResponse> {
    try {
      const response = await commentAPI.get(`/comments/${commentId}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to fetch comment',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 更新评论 (需要认证，只能更新自己的评论)
   */
  async updateComment(commentId: number, content: string): Promise<CommentResponse> {
    try {
      const response = await commentAPI.put(`/comments/${commentId}`, { content });
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to update comment',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 删除评论 (需要认证，只能删除自己的评论)
   */
  async deleteComment(commentId: number): Promise<{ success: boolean; message?: string; timestamp: string }> {
    try {
      const response = await commentAPI.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to delete comment',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 获取用户的评论
   */
  async getUserComments(userId: number, page: number = 1, limit: number = 20): Promise<CommentsListResponse> {
    try {
      const response = await commentAPI.get(`/comments/user/${userId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      const errorData: ApiError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to fetch user comments',
        timestamp: new Date().toISOString()
      };
    }
  }
};