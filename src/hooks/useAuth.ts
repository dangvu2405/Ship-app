import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  const normalizeRole = (role: string): string => role.trim().toLowerCase();

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
    const targetRole = normalizeRole(role);
    return user?.roles?.some((r) => normalizeRole(r.name) === targetRole) ?? false;
  };

  const hasPermission = (permission: string): boolean => {
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
