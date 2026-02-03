import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Login } from '@/pages/auth/Login';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { Employees } from '@/pages/hr/Employees';
import { Payrolls } from '@/pages/payroll/Payrolls';
import { Companies } from '@/pages/organization/Companies';
import { Vehicles } from '@/pages/fleet/Vehicles';
import { Trips } from '@/pages/operations/Trips';
import { Reports } from '@/pages/reports/Reports';
import { Users } from '@/pages/system/Users';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/employees',
    element: (
      <ProtectedRoute requiredPermission="employee.view">
        <Employees />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/payrolls',
    element: (
      <ProtectedRoute requiredPermission="payroll.view">
        <Payrolls />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/companies',
    element: (
      <ProtectedRoute>
        <Companies />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/vehicles',
    element: (
      <ProtectedRoute requiredPermission="trip.view">
        <Vehicles />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/trips',
    element: (
      <ProtectedRoute requiredPermission="trip.view">
        <Trips />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/reports',
    element: (
      <ProtectedRoute requiredPermission="payroll.view">
        <Reports />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Users />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
