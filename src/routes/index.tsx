import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoginForm } from '@/pages/auth/login-form';
import { Settings } from '@/pages/system/Settings';
import { Users } from '@/pages/system/Users';
import Dashboard from '@/pages/dashboard/dashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute requiredPermission="user.manage">
        <Users />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/admin/dashboard" replace />,
  },
]);
