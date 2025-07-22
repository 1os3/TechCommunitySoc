import axios from 'axios';
import { 
  RegisterData, 
  LoginData, 
  AuthResponse, 
  ForgotPasswordData, 
  ResetPasswordData,
  BackendResponse,
  BackendError
} from '../types/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
authAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
authAPI.interceptors.response.use(
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

export const authService = {
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await authAPI.post('/auth/register', userData);
      const data: BackendResponse = response.data;
      return {
        success: data.success,
        message: data.message,
        user: data.data?.user
      };
    } catch (error: any) {
      const errorData: BackendError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Registration failed'
      };
    }
  },

  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await authAPI.post('/auth/login', credentials);
      const data: BackendResponse = response.data;
      const { user, token } = data.data || {};
      
      if (token) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
      }
      
      return {
        success: data.success,
        token,
        user,
        message: data.message
      };
    } catch (error: any) {
      const errorData: BackendError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Login failed'
      };
    }
  },

  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const response = await authAPI.get(`/auth/verify-email/${token}`);
      const data: BackendResponse = response.data;
      return {
        success: data.success,
        message: data.message,
        user: data.data?.user
      };
    } catch (error: any) {
      const errorData: BackendError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Email verification failed'
      };
    }
  },

  async forgotPassword(data: ForgotPasswordData): Promise<AuthResponse> {
    try {
      const response = await authAPI.post('/auth/forgot-password', data);
      const responseData: BackendResponse = response.data;
      return {
        success: responseData.success,
        message: responseData.message
      };
    } catch (error: any) {
      const errorData: BackendError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to send reset email'
      };
    }
  },

  async resetPassword(token: string, data: ResetPasswordData): Promise<AuthResponse> {
    try {
      const response = await authAPI.post(`/auth/reset-password/${token}`, data);
      const responseData: BackendResponse = response.data;
      return {
        success: responseData.success,
        message: responseData.message
      };
    } catch (error: any) {
      const errorData: BackendError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Password reset failed'
      };
    }
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  getCurrentUser(): any {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  },

  async checkUserStatus(): Promise<{ success: boolean; isActive?: boolean; isDisabled?: boolean; message?: string }> {
    try {
      const response = await authAPI.get('/auth/status');
      const data: BackendResponse = response.data;
      return {
        success: data.success,
        isActive: data.data?.isActive,
        isDisabled: data.data?.isDisabled,
        message: data.message
      };
    } catch (error: any) {
      const errorData: BackendError = error.response?.data;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to check user status'
      };
    }
  }
};