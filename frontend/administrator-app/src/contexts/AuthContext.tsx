import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser, AdminStatus } from '../types/admin';
import { AdminService } from '../services/adminService';

interface AuthContextType {
  user: AdminUser | null;
  adminStatus: AdminStatus | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = AdminService.getCurrentUser();
        const token = AdminService.getToken();

        if (storedUser && token) {
          setUser(storedUser);
          
          // Verify admin status with backend
          const status = await AdminService.getAdminStatus();
          console.log('Received admin status:', status);
          
          if (status && typeof status === 'object' && (status.isAdmin || status.isSiteAdmin)) {
            setAdminStatus(status);
          } else {
            // Admin status invalid, clear auth
            console.log('Invalid admin status, clearing auth');
            AdminService.logout();
            setUser(null);
            setAdminStatus(null);
          }
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error?.message || 'Unknown error');
        AdminService.logout();
        setUser(null);
        setAdminStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const result = await AdminService.login({ email, password });
      
      if (result.success && result.user) {
        setUser(result.user);
        
        // Get updated admin status
        const status = await AdminService.getAdminStatus();
        console.log('Login admin status:', status);
        
        if (status && typeof status === 'object' && (status.isAdmin || status.isSiteAdmin)) {
          setAdminStatus(status);
          return { success: true };
        } else {
          console.error('Invalid admin status received during login:', status);
          setAdminStatus(null);
          return { success: false, error: '管理员权限验证失败' };
        }
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error?.message || 'Unknown error');
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AdminService.logout();
    setUser(null);
    setAdminStatus(null);
  };

  const refreshAdminStatus = async () => {
    try {
      const status = await AdminService.getAdminStatus();
      console.log('Refresh admin status:', status);
      
      if (status && typeof status === 'object' && (status.isAdmin || status.isSiteAdmin)) {
        setAdminStatus(status);
      } else {
        console.error('Invalid admin status during refresh:', status);
        setAdminStatus(null);
      }
    } catch (error: any) {
      console.error('Failed to refresh admin status:', error?.message || 'Unknown error');
    }
  };

  const isAuthenticated = !!user && (!!adminStatus?.isAdmin || !!adminStatus?.isSiteAdmin);

  const value: AuthContextType = {
    user,
    adminStatus,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAdminStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};