import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RegisterForm from './components/auth/RegisterForm';
import LoginForm from './components/auth/LoginForm';
// import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
// import ResetPasswordForm from './components/auth/ResetPasswordForm';
import EmailVerificationPrompt from './components/auth/EmailVerificationPrompt';
import EmailVerificationHandler from './components/auth/EmailVerificationHandler';
import PostBrowse from './components/posts/PostBrowse';
import PostDetail from './components/posts/PostDetail';
import PostCreate from './components/posts/PostCreate';
import PostEdit from './components/posts/PostEdit';
import ProfilePage from './components/profile/ProfilePage';
import NotificationPage from './components/common/NotificationPage';
import './App.css';
import './styles/auth.css';
import './styles/posts.css';
import './styles/comments.css';
import './styles/profile.css';
import './styles/notifications.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes - redirect to home if authenticated */}
            <Route 
              path="/register" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <RegisterForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <LoginForm />
                </ProtectedRoute>
              } 
            />
            {/* 暂时移除忘记密码功能
            <Route 
              path="/forgot-password" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <ForgotPasswordForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reset-password/:token" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <ResetPasswordForm />
                </ProtectedRoute>
              } 
            />
            */}
            
            {/* Email verification routes - 暂时保留以防需要 */}
            <Route 
              path="/verify-email-prompt" 
              element={<EmailVerificationPrompt />} 
            />
            <Route 
              path="/verify-email/:token" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <EmailVerificationHandler />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes - 需要登录才能访问 */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <PostBrowse />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/posts" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <PostBrowse />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/posts/create" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <PostCreate />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/posts/:id/edit" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <PostEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/posts/:id" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <PostDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <NotificationPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
