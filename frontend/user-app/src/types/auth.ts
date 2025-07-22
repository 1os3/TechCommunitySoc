export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  is_verified: boolean;
  is_admin?: boolean;
  role?: string;
  is_active?: boolean;
  created_at: string;
  last_login?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface BackendResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp: string;
}

export interface BackendError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  newPassword: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}