import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface UserStatusState {
  isActive: boolean | null;
  isDisabled: boolean | null;
  loading: boolean;
  error: string | null;
}

export const useUserStatus = () => {
  const { state } = useAuth();
  const [status, setStatus] = useState<UserStatusState>({
    isActive: null,
    isDisabled: null,
    loading: false,
    error: null
  });

  const checkUserStatus = async () => {
    if (!state.isAuthenticated || !state.user) {
      setStatus({
        isActive: null,
        isDisabled: null,
        loading: false,
        error: null
      });
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await authService.checkUserStatus();
      
      if (result.success) {
        setStatus({
          isActive: result.isActive || false,
          isDisabled: result.isDisabled || false,
          loading: false,
          error: null
        });
      } else {
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: result.message || 'Failed to check user status'
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to check user status'
      }));
    }
  };

  useEffect(() => {
    if (state.isAuthenticated) {
      checkUserStatus();
    }
  }, [state.isAuthenticated]);

  return {
    ...status,
    refetch: checkUserStatus,
    isUserDisabled: status.isDisabled === true
  };
};