import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { ROUTES } from '@/routes';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}

export const ProtectedRoute = ({ children, requiredRole, requiredPermission }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasRole, can } = usePermission();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  if (requiredPermission && !can(requiredPermission)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <>{children}</>;
};
