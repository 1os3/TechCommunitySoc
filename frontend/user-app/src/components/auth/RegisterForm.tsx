import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../common/Input';
import Button from '../common/Button';
import { RegisterData } from '../../types/auth';

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, state } = useAuth();
  
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: ''
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation (matches backend: alphanum only)
    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
    } else if (formData.username.length > 50) {
      newErrors.username = '用户名不能超过50个字符';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母和数字';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (formData.email.length > 100) {
      newErrors.email = '邮箱不能超过100个字符';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // Password validation (matches backend requirements)
    if (!formData.password) {
      newErrors.password = '密码不能为空';
    } else if (formData.password.length < 8) {
      newErrors.password = '密码至少需要8个字符';
    } else if (formData.password.length > 128) {
      newErrors.password = '密码不能超过128个字符';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(formData.password)) {
      newErrors.password = '密码必须包含大小写字母、数字和特殊字符(@$!%*?&)';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await register(formData);
    
    if (success) {
      navigate('/login', { 
        state: { 
          message: '注册成功！请使用您的账户登录。',
          email: formData.email 
        } 
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>注册账户</h1>
          <p>创建您的论坛账户</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="请输入用户名"
            value={formData.username}
            onChange={handleInputChange}
            error={errors.username}
            required
            autoComplete="username"
          />

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="请输入邮箱地址"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
            autoComplete="email"
          />

          <Input
            id="password"
            name="password"
            type="password"
            placeholder="请输入密码"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            required
            autoComplete="new-password"
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="请确认密码"
            value={confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />

          {state.error && (
            <div className="error-message global-error">
              {state.error}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            loading={state.loading}
          >
            注册
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            已有账户？
            <Link to="/login" className="auth-link">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;