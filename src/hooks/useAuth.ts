import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';

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

  const hasRole = (role: string): boolean => {
    return user?.roles?.some((r) => r.name === role) ?? false;
  };

  const hasPermission = (permission: string): boolean => {
    if (hasRole('admin')) return true;
    return user?.roles?.some((r) =>
      r.permissions?.some((p) => p.code === permission || p.name === permission)
    ) ?? false;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    requireAuth,
    hasRole,
    hasPermission,
  };
};
