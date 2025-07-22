import React, { ReactNode } from 'react';
import { useUserStatus } from '../../hooks/useUserStatus';
import { useAuth } from '../../contexts/AuthContext';
import './UserStatusGuard.css';

interface UserStatusGuardProps {
  children: ReactNode;
  action?: string; // e.g., "post", "comment", "like"
  showWarning?: boolean;
}

const UserStatusGuard: React.FC<UserStatusGuardProps> = ({ 
  children, 
  action = "perform this action",
  showWarning = true 
}) => {
  const { state } = useAuth();
  const { isUserDisabled, loading } = useUserStatus();

  // If not authenticated, show children normally
  if (!state.isAuthenticated) {
    return <>{children}</>;
  }

  // If still loading, show children (don't block)
  if (loading) {
    return <>{children}</>;
  }

  // If user is disabled, show warning instead of children
  if (isUserDisabled) {
    if (!showWarning) {
      return null;
    }

    return (
      <div className="user-status-guard">
        <div className="user-disabled-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h3>账户已被禁用</h3>
            <p>您的账户已被管理员禁用，无法{action}。</p>
            <p>如有疑问，请联系管理员。</p>
          </div>
        </div>
      </div>
    );
  }

  // User is active, show children
  return <>{children}</>;
};

export default UserStatusGuard;