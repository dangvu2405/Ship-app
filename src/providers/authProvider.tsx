import { AuthProvider } from '@refinedev/core';
import { User } from '@/types';
import authService from '@/services/auth.service';
import { AUTO_LOGIN_ENABLED, DEMO_EMAIL, DEMO_PASSWORD, STORAGE_KEYS } from '@/utils/constants';

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.data?.user) {
        // Store token in localStorage
        if (response.data.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
        }
        return {
          success: true,
          redirectTo: '/dashboard',
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
      console.error('Logout error:', error);
    } finally {
      // Remove token from localStorage
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    
    return {
      success: true,
      redirectTo: '/login',
    };
  },

  check: async () => {
    const UNAUTHENTICATED = { authenticated: false, redirectTo: '/login', logout: true } as const;
    const AUTHENTICATED = { authenticated: true } as const;

    // Try to get current user first
    const tryGetCurrentUser = async (): Promise<boolean> => {
      try {
        const response = await authService.getCurrentUser();
        return !!(response.success && response.data);
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
        return !!(response.success && response.data?.user);
      } catch {
        return false;
      }
    };

    // Check if user is already authenticated
    if (await tryGetCurrentUser()) return AUTHENTICATED;

    // In dev mode, attempt auto-login with demo account
    if (AUTO_LOGIN_ENABLED && (await tryAutoLogin())) return AUTHENTICATED;

    return UNAUTHENTICATED;
  },

  onError: async (error) => {
    if (error?.status === 401) {
      return {
        logout: true,
        redirectTo: '/login',
        error,
      };
    }
    
    return { error };
  },

  getIdentity: async () => {
    try {
      const response = await authService.getCurrentUser();
      
      if (response.success && response.data) {
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
          redirectTo: '/login',
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
