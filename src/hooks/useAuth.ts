import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';

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
      navigate('/login');
      return false;
    }
    return true;
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.some((r) => r.name === role) ?? false;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasPermission = (permission: string): boolean => {
    // This would need to check user permissions from backend
    // TODO: Implement permission check using permission parameter
    return hasRole('admin'); // Simplified for now
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
