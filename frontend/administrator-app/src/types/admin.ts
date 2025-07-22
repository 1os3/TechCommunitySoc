export interface AdminUser {
  id: number;
  username: string;
  email: string;
  // Backend uses snake_case, frontend prefers camelCase
  is_admin?: boolean;
  isAdmin?: boolean;
  isSiteAdmin?: boolean;
  is_verified?: boolean;
  isVerified?: boolean;
  is_active?: boolean;
  isActive?: boolean;
  is_deleted?: boolean;
  isDeleted?: boolean;
  role: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface AdminLoginData {
  email: string;
  password: string;
}

export interface AdminAuthResult {
  success: boolean;
  user?: AdminUser;
  token?: string;
  message?: string;
  error?: string;
}

export interface AdminStatus {
  isAdmin: boolean;
  isSiteAdmin: boolean;
  userId: number;
}

export interface AdminStatusResponse {
  success: boolean;
  data: AdminStatus;
  timestamp: string;
}