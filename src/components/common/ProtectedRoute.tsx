import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/routes';
import { userHasRole, userHasPermission } from '@/utils/authPermissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  /** User phải có ít nhất một trong các role này (case-insensitive). */
  requiredRoles?: string[];
  requiredPermission?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
}: ProtectedRouteProps) => {
  // Đọc trực tiếp từ store — không trigger checkAuth() như useAuth() làm.
  // Auth đã được xác thực bởi <Authenticated> của Refine ở tầng trên.
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (requiredRole && !userHasRole(user, requiredRole)) {
    return <Navigate to={ROUTES.noRoleAccess} replace />;
  }

  if (requiredRoles?.length && !requiredRoles.some((r) => userHasRole(user, r))) {
    return <Navigate to={ROUTES.noRoleAccess} replace />;
  }

  if (requiredPermission && !userHasPermission(user, requiredPermission)) {
    return <Navigate to={ROUTES.noRoleAccess} replace />;
  }

  return <>{children}</>;
};
