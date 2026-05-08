import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { userHasRole, userHasPermission } from '@/utils/authPermissions';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  const requireAuth = () => {
    if (!isAuthenticated && !isLoading) {
      navigate(ROUTES.login);
      return false;
    }
    return true;
  };

  const hasRole = (role: string): boolean => userHasRole(user, role);
  const hasPermission = (permission: string): boolean => userHasPermission(user, permission);

  return {
    user,
    isAuthenticated,
    isLoading,
    requireAuth,
    hasRole,
    hasPermission,
  };
};
