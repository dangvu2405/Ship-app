import { AuthProvider } from '@refinedev/core';
import { User } from '@/types';
import authService from '@/services/auth.service';
import { AUTO_LOGIN_ENABLED, DEMO_EMAIL, DEMO_PASSWORD, STORAGE_KEYS } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/routes';

// Get store state outside of component
const getAuthStoreState = () => {
  return useAuthStore.getState();
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.data?.user) {
        // Store token in localStorage
        if (response.data.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
        }
        // Update Zustand store
        useAuthStore.getState().setUser(response.data.user);
        return {
          success: true,
          redirectTo: ROUTES.dashboard,
        };
      }
      
      return {
        success: false,
        error: {
          message: 'Login failed',
          name: 'LoginError',
        },
      };
    } catch (error: unknown) {
      const errorMessage = 
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message
          : undefined;
      return {
        success: false,
        error: {
          message: errorMessage || 'Login failed',
          name: 'LoginError',
        },
      };
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Failed to logout via API', error);
    } finally {
      // Remove token from localStorage
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      useAuthStore.getState().setUser(null);
    }
    
    return {
      success: true,
      redirectTo: ROUTES.login,
    };
  },

  check: async () => {
    const UNAUTHENTICATED = { authenticated: false, redirectTo: ROUTES.login, logout: true } as const;
    const AUTHENTICATED = { authenticated: true } as const;
    const hasToken = !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    // First, check Zustand store (for test login)
    const storeState = getAuthStoreState();
    if (storeState.isAuthenticated && storeState.user && !hasToken) {
      return AUTHENTICATED;
    }

    // Try to get current user from API
    const tryGetCurrentUser = async (): Promise<boolean> => {
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          // Update store with API response
          useAuthStore.getState().setUser(response.data);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Try auto-login with demo credentials
    const tryAutoLogin = async (): Promise<boolean> => {
      try {
        const response = await authService.login({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });
        if (response.success && response.data?.user) {
          // Update store with login response
          useAuthStore.getState().setUser(response.data.user);
          if (response.data.token) {
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
          }
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Check if user is already authenticated via API
    if (await tryGetCurrentUser()) return AUTHENTICATED;

    if (hasToken) {
      useAuthStore.getState().setUser(null);
    }

    // In dev mode, attempt auto-login with demo account
    if (AUTO_LOGIN_ENABLED && (await tryAutoLogin())) return AUTHENTICATED;

    return UNAUTHENTICATED;
  },

  onError: async (error) => {
    if (error?.status === 401) {
      return {
        logout: true,
        redirectTo: ROUTES.login,
        error,
      };
    }
    
    return { error };
  },

  getIdentity: async () => {
    // First, check Zustand store (for test login)
    const storeState = getAuthStoreState();
    if (storeState.user) {
      return storeState.user;
    }

    // Fallback to API
    try {
      const response = await authService.getCurrentUser();
      
      if (response.success && response.data) {
        // Update store with API response
        useAuthStore.getState().setUser(response.data);
        return response.data as User;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  },

  register: async ({ username, password }) => {
    try {
      const response = await authService.register({
        email: username, // Use username as email for now
        password,
        username,
        password_confirmation: password,
      });
      
      if (response.success) {
        return {
          success: true,
          redirectTo: ROUTES.login,
        };
      }
      
      return {
        success: false,
        error: {
          message: 'Registration failed',
          name: 'RegistrationError',
        },
      };
    } catch (error: unknown) {
      const errorMessage = 
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message
          : undefined;
      return {
        success: false,
        error: {
          message: errorMessage || 'Registration failed',
          name: 'RegistrationError',
        },
      };
    }
  },

  forgotPassword: async () => {
    // Implement forgot password logic
    return {
      success: true,
    };
  },

  updatePassword: async () => {
    // Implement update password logic
    return {
      success: true,
    };
  },
};
