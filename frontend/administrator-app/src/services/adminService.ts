import api, { ApiResponse } from './api';
import { AdminUser, AdminLoginData, AdminAuthResult, AdminStatus } from '../types/admin';

export interface LoginResponse {
  user: AdminUser;
  token: string;
}

export interface UserListResponse {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
}

export interface AdminListResponse {
  admins: AdminUser[];
  total: number;
}

export interface LogEntry {
  id?: string;
  level: string;
  message: string;
  timestamp: string;
  service?: string;
  userId?: number;
  stack?: string;
  metadata?: any;
}

export interface LogResponse {
  logs: LogEntry[];
  page?: number;
  limit?: number;
  total: number;
}

export class AdminService {
  // Authentication
  static async login(credentials: AdminLoginData): Promise<AdminAuthResult> {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        
        // Verify admin status (either admin or site admin)
        // Backend returns snake_case fields, need to check both formats
        const isAdmin = (user as any).is_admin || user.isAdmin || (user as any).role === 'admin';
        const isSiteAdmin = (user.username === 'aarch64qwe10900fuziruiwork0' && user.email === 'bnbyhanqca1x@outlook.com') || user.isSiteAdmin;
        
        if (!isAdmin && !isSiteAdmin) {
          return {
            success: false,
            error: 'Access denied: Admin privileges required'
          };
        }
        
        // Store token and user info
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(user));
        
        return {
          success: true,
          user,
          token,
          message: 'Login successful'
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Login failed'
        };
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      let errorMessage = 'Login failed';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  static async logout(): Promise<void> {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }

  static getCurrentUser(): AdminUser | null {
    const userStr = localStorage.getItem('adminUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  static getToken(): string | null {
    return localStorage.getItem('adminToken');
  }

  static isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  // Admin status and verification
  static async getAdminStatus(): Promise<AdminStatus | null> {
    try {
      const response = await api.get<ApiResponse<AdminStatus>>('/admin/status');
      console.log('Admin status response:', response.data);
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object') {
        // Check if it's an error object with code, message, timestamp
        if ('code' in response.data && 'message' in response.data && 'timestamp' in response.data) {
          console.error('Admin status API returned error object:', response.data);
          return null;
        }
        
        // Standard API response format
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Admin status error:', error);
      return null;
    }
  }

  // Admin management
  static async getAdmins(): Promise<AdminListResponse | null> {
    try {
      const response = await api.get<ApiResponse<AdminListResponse>>('/admin/list');
      return response.data.success && response.data.data ? response.data.data : null;
    } catch (error) {
      return null;
    }
  }

  static async createAdmin(adminData: { username: string; email: string }): Promise<ApiResponse> {
    try {
      const response = await api.post<ApiResponse>('/admin/create', adminData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create admin',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async deleteAdmin(adminId: number): Promise<ApiResponse> {
    try {
      const response = await api.delete<ApiResponse>(`/admin/admin/${adminId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete admin',
        timestamp: new Date().toISOString()
      };
    }
  }

  // User management
  static async getUsers(page: number = 1, limit: number = 20): Promise<UserListResponse | null> {
    try {
      const response = await api.get<ApiResponse<UserListResponse>>(`/admin/users?page=${page}&limit=${limit}`);
      return response.data.success && response.data.data ? response.data.data : null;
    } catch (error) {
      return null;
    }
  }

  static async deleteUser(userId: number): Promise<ApiResponse> {
    try {
      const response = await api.delete<ApiResponse>(`/admin/users/${userId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete user',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async enableUser(userId: number): Promise<ApiResponse> {
    try {
      const response = await api.put<ApiResponse>(`/admin/users/${userId}/enable`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to enable user',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async getSoftDeletedUsers(page: number = 1, limit: number = 20, searchQuery?: string): Promise<UserListResponse | null> {
    try {
      let url = `/admin/users/soft-deleted?page=${page}&limit=${limit}`;
      if (searchQuery && searchQuery.trim()) {
        url += `&q=${encodeURIComponent(searchQuery.trim())}`;
      }
      const response = await api.get<ApiResponse<UserListResponse>>(url);
      return response.data.success && response.data.data ? response.data.data : null;
    } catch (error) {
      return null;
    }
  }

  static async restoreUser(userId: number, username?: string, email?: string): Promise<ApiResponse> {
    try {
      const response = await api.put<ApiResponse>(`/admin/users/${userId}/restore`, {
        username,
        email
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to restore user',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Content management
  static async deletePost(postId: number): Promise<ApiResponse> {
    try {
      const response = await api.delete<ApiResponse>(`/admin/posts/${postId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete post',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async deleteComment(commentId: number): Promise<ApiResponse> {
    try {
      const response = await api.delete<ApiResponse>(`/admin/comments/${commentId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete comment',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Log management
  static async getSystemLogs(
    page: number = 1,
    limit: number = 100,
    level?: string,
    startDate?: string,
    endDate?: string
  ): Promise<LogResponse | null> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (level) params.append('level', level);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get<ApiResponse<LogResponse>>(`/admin/logs/system?${params.toString()}`);
      return response.data.success && response.data.data ? response.data.data : null;
    } catch (error) {
      return null;
    }
  }

  static async getErrorLogs(limit: number = 50): Promise<LogResponse | null> {
    try {
      const response = await api.get<ApiResponse<LogResponse>>(`/admin/logs/errors?limit=${limit}`);
      return response.data.success && response.data.data ? response.data.data : null;
    } catch (error) {
      return null;
    }
  }

  static async getAdminActivityLogs(limit: number = 100): Promise<LogResponse | null> {
    try {
      const response = await api.get<ApiResponse<LogResponse>>(`/admin/logs/admin-activity?limit=${limit}`);
      return response.data.success && response.data.data ? response.data.data : null;
    } catch (error) {
      return null;
    }
  }

  static async clearLogs(options: { olderThanDays: number; level?: string }): Promise<ApiResponse<{ removedCount: number }> | null> {
    try {
      const response = await api.delete<ApiResponse<{ removedCount: number }>>('/admin/logs/clear', {
        data: options
      });
      return response.data;
    } catch (error) {
      console.error('Clear logs error:', error);
      return null;
    }
  }

  static async clearAllLogs(): Promise<ApiResponse<{ removedCount: number }> | null> {
    try {
      const response = await api.delete<ApiResponse<{ removedCount: number }>>('/admin/logs/clear-all');
      return response.data;
    } catch (error) {
      console.error('Clear all logs error:', error);
      return null;
    }
  }

  // Dashboard statistics
  static async getPostsStats(): Promise<{ total: number } | null> {
    try {
      const response = await api.get<ApiResponse<{ pagination: { total: number } }>>('/posts?limit=1');
      return response.data.success && response.data.data?.pagination ? { total: response.data.data.pagination.total } : null;
    } catch (error) {
      console.error('Get posts stats error:', error);
      return null;
    }
  }

  // Content management - Use existing posts API
  static async getPosts(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('q', params.search); // posts API uses 'q' for search

      const response = await api.get<ApiResponse<any>>(`/posts?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get posts',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async getComments(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    postId?: string;
  } = {}): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.postId) queryParams.append('postId', params.postId);

      const response = await api.get<ApiResponse<any>>(`/admin/content/comments?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get comments',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Violation management
  static async getViolations(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);

      const response = await api.get<ApiResponse<any>>(`/admin/violations?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get violations',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async updateViolationStatus(
    violationId: number,
    status: 'pending' | 'reviewed' | 'ignored',
    notes?: string
  ): Promise<ApiResponse> {
    try {
      const response = await api.put<ApiResponse>(`/admin/violations/${violationId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update violation status',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async getViolationStats(days: number = 10, threshold: number = 15): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(`/admin/violations/stats?days=${days}&threshold=${threshold}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get violation stats',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Violation words management
  static async getViolationWords(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>('/admin/violation-words');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get violation words',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async addViolationWord(word: string, isRegex: boolean = false): Promise<ApiResponse> {
    try {
      const response = await api.post<ApiResponse>('/admin/violation-words', {
        word,
        is_regex: isRegex
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to add violation word',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async removeViolationWord(wordId: number): Promise<ApiResponse> {
    try {
      const response = await api.delete<ApiResponse>(`/admin/violation-words/${wordId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove violation word',
        timestamp: new Date().toISOString()
      };
    }
  }
}