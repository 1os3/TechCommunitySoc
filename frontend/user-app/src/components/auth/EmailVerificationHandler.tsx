import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const EmailVerificationHandler: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setMessage('验证链接无效：缺少验证令牌');
        setLoading(false);
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        
        if (response.success) {
          setSuccess(true);
          setMessage(response.message || '邮箱验证成功！');
          
          // Auto redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setMessage(response.message || '邮箱验证失败');
        }
      } catch (error) {
        setMessage('验证过程中出现错误');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>验证中...</h1>
          </div>
          
          <div className="verification-content">
            <div className="loading-spinner"></div>
            <p>正在验证您的邮箱地址，请稍候...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>验证成功</h1>
          </div>
          
          <div className="verification-content">
            <div className="success-icon">
              <span>✅</span>
            </div>
            
            <div className="success-message">
              <p>{message}</p>
              <p>您的账户已成功激活，正在跳转到登录页面...</p>
            </div>
          </div>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              立即登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>验证失败</h1>
        </div>
        
        <div className="verification-content">
          <div className="error-icon">
            <span>❌</span>
          </div>
          
          <div className="error-message">
            <p>{message}</p>
            <p>验证链接可能已过期或无效。</p>
          </div>
        </div>

        <div className="auth-footer">
          <div className="auth-links">
            <Link to="/register" className="auth-link">
              重新注册
            </Link>
            <span> | </span>
            <Link to="/login" className="auth-link">
              登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationHandler;