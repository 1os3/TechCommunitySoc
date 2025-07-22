import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Input from '../common/Input';
import Button from '../common/Button';
import { authService } from '../../services/authService';

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

const ResetPasswordForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Password validation (matches backend requirements)
    if (!formData.newPassword) {
      newErrors.newPassword = '密码不能为空';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = '密码至少需要8个字符';
    } else if (formData.newPassword.length > 128) {
      newErrors.newPassword = '密码不能超过128个字符';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(formData.newPassword)) {
      newErrors.newPassword = '密码必须包含大小写字母、数字和特殊字符(@$!%*?&)';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    if (message) {
      setMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.resetPassword(token, {
        newPassword: formData.newPassword
      });
      
      if (response.success) {
        setSuccess(true);
        setMessage(response.message || '密码重置成功');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(response.message || '密码重置失败');
      }
    } catch (error) {
      setMessage('密码重置时出现错误');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>无效链接</h1>
          </div>
          
          <div className="error-message">
            <p>重置密码链接无效或已过期。</p>
          </div>

          <div className="auth-footer">
            <Link to="/forgot-password" className="auth-link">
              重新请求重置密码
            </Link>
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
            <h1>密码重置成功</h1>
          </div>
          
          <div className="success-message">
            <p>{message}</p>
            <p>正在跳转到登录页面...</p>
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
          <h1>重置密码</h1>
          <p>请输入您的新密码</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="请输入新密码"
            value={formData.newPassword}
            onChange={handleInputChange}
            error={errors.newPassword}
            required
            autoComplete="new-password"
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="请确认新密码"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
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
            重置密码
          </Button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;