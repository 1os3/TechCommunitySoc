import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../common/Input';
import Button from '../common/Button';
import { authService } from '../../services/authService';

interface FormErrors {
  email?: string;
}

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    if (errors.email) {
      setErrors({});
    }
    
    if (message) {
      setMessage('');
      setSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.forgotPassword({ email });
      
      if (response.success) {
        setSuccess(true);
        setMessage(response.message || '重置邮件已发送');
      } else {
        setMessage(response.message || '发送重置邮件失败');
      }
    } catch (error) {
      setMessage('发送重置邮件时出现错误');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>邮件已发送</h1>
          </div>
          
          <div className="success-message">
            <p>{message}</p>
            <p>请检查您的邮箱并点击重置链接来重置密码。</p>
          </div>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              返回登录
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
          <h1>忘记密码</h1>
          <p>输入您的邮箱地址，我们将发送重置密码的链接</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="请输入邮箱地址"
            value={email}
            onChange={handleInputChange}
            error={errors.email}
            required
            autoComplete="email"
          />

          {message && !success && (
            <div className="error-message global-error">
              {message}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            loading={loading}
          >
            发送重置邮件
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            记起密码了？
            <Link to="/login" className="auth-link">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;