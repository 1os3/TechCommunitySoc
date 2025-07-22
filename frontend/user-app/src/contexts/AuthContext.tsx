import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginData, RegisterData } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginData) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; user: User; token: string }
  | { type: 'AUTH_FAILURE'; error: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_LOADING' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        user: action.user,
        token: action.token,
        isAuthenticated: true
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.error,
        user: null,
        token: null,
        isAuthenticated: false
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'RESET_LOADING':
      return {
        ...state,
        loading: false
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing auth data on mount
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    
    if (token && user) {
      dispatch({ type: 'AUTH_SUCCESS', user, token });
    }
  }, []);

  const login = async (credentials: LoginData): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    
    const response = await authService.login(credentials);
    
    if (response.success && response.user && response.token) {
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        user: response.user, 
        token: response.token 
      });
      return true;
    } else {
      dispatch({ 
        type: 'AUTH_FAILURE', 
        error: response.message || 'Login failed' 
      });
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    
    const response = await authService.register(userData);
    
    if (response.success) {
      // 重置loading状态和清除错误
      dispatch({ type: 'RESET_LOADING' });
      dispatch({ type: 'CLEAR_ERROR' });
      return true;
    } else {
      dispatch({ 
        type: 'AUTH_FAILURE', 
        error: response.message || 'Registration failed' 
      });
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    state,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};