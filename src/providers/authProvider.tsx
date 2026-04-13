import { AuthProvider } from '@refinedev/core';
import { User } from '@/types';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/routes';
import { clearAuthToken, hasAuthToken, setAuthToken } from '@/lib/auth-session';

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
          setAuthToken(response.data.token);
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
    } catch {
      // no-op: local logout still executes in finally
    } finally {
      // Remove token from localStorage
      clearAuthToken();
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
    const hasToken = hasAuthToken();

    // No token and no local identity means not authenticated.
    if (!hasToken) {
      useAuthStore.getState().setUser(null);
      return UNAUTHENTICATED;
    }

    // If token exists and store already has user, accept immediately.
    const storeState = getAuthStoreState();
    if (storeState.isAuthenticated && storeState.user) {
      return AUTHENTICATED;
    }

    // Try to get current user from API
    const tryGetCurrentUser = async (): Promise<boolean> => {
      try {
        const response = await authService.getCurrentUser();
        const user = authService.getUserFromMeResponse(response);
        if (response.success && user) {
          // Update store with API response
          useAuthStore.getState().setUser(user);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Check if user is already authenticated via API
    if (await tryGetCurrentUser()) return AUTHENTICATED;

    useAuthStore.getState().setUser(null);
    clearAuthToken();

    return UNAUTHENTICATED;
  },

  onError: async (error) => {
    if (error?.status === 401) {
      clearAuthToken();
      useAuthStore.getState().setUser(null);
      return {
        logout: true,
        redirectTo: ROUTES.login,
        error,
      };
    }
    
    return { error };
  },

  getIdentity: async () => {
    const storeState = getAuthStoreState();
    if (storeState.user) {
      return storeState.user;
    }

    // Fallback to API
    try {
      const response = await authService.getCurrentUser();
      const user = authService.getUserFromMeResponse(response);
      if (response.success && user) {
        // Update store with API response
        useAuthStore.getState().setUser(user);
        return user as User;
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

  forgotPassword: async ({ email }) => {
    try {
      const response = await authService.forgotPassword(String(email ?? '').trim());
      if (response.success) {
        return { success: true };
      }
      return {
        success: false,
        error: {
          message: response.message || 'Request failed',
          name: 'ForgotPasswordError',
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
          message: errorMessage || 'Request failed',
          name: 'ForgotPasswordError',
        },
      };
    }
  },

  updatePassword: async () => {
    // Implement update password logic
    return {
      success: true,
    };
  },
};
