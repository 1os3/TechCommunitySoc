import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Button from '../common/Button';

const EmailVerificationPrompt: React.FC = () => {
  const location = useLocation();
  const email = location.state?.email || '';
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('无法重发验证邮件：邮箱地址丢失');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setMessage('验证邮件已重新发送');
      } else {
        setMessage(data.error?.message || '重发验证邮件失败');
      }
    } catch (error) {
      setMessage('重发验证邮件时出现错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>验证您的邮箱</h1>
          <p>注册成功！请验证您的邮箱地址</p>
        </div>

        <div className="verification-content">
          <div className="verification-icon">
            <span>📧</span>
          </div>
          
          <p>我们已向 <strong>{email}</strong> 发送了验证邮件。</p>
          <p>请检查您的邮箱（包括垃圾邮件文件夹）并点击验证链接来激活您的账户。</p>
          
          {message && (
            <div className={`message ${success ? 'success-message' : 'error-message'}`}>
              {message}
            </div>
          )}

          <div className="verification-actions">
            <Button
              type="button"
              onClick={handleResendEmail}
              loading={loading}
              variant="secondary"
              fullWidth
            >
              重新发送验证邮件
            </Button>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            验证完成后，
            <Link to="/login" className="auth-link">
              点击这里登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPrompt;