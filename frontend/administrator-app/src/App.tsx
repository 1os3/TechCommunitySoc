import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ContentManagement from './pages/ContentManagement';
import LogManagement from './pages/LogManagement';
import AdminManagement from './pages/AdminManagement';
import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router basename="/xEm8XTSBzQ8mVPH">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected admin routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* User Management */}
              <Route path="users" element={<UserManagement />} />
              
              <Route path="content" element={<ContentManagement />} />
              
              <Route path="logs/*" element={<LogManagement />} />
              
              {/* Site admin only route */}
              <Route path="admin-management" element={
                <ProtectedRoute requireSiteAdmin={true}>
                  <AdminManagement />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
  );
};

export default App;