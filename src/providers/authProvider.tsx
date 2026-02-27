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
    // Development mode: Auto-login nếu chưa authenticated
    if (AUTO_LOGIN_ENABLED) {
      try {
        const response = await authService.getCurrentUser();
        
        if (response.success && response.data) {
          return {
            authenticated: true,
          };
        }
        
        // Nếu chưa authenticated, tự động login với demo account
        try {
          const loginResponse = await authService.login({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
          });
          
          if (loginResponse.success && loginResponse.data?.user) {
            return {
              authenticated: true,
            };
          }
        } catch (loginError) {
          // Ignore login error, sẽ redirect đến login page
        }
      } catch (error) {
        // Try auto-login on error
        try {
          const loginResponse = await authService.login({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
          });
          
          if (loginResponse.success && loginResponse.data?.user) {
            return {
              authenticated: true,
            };
          }
        } catch (loginError) {
          // Ignore
        }
      }
    } else {
      // Production mode: Normal check
      try {
        const response = await authService.getCurrentUser();
        
        if (response.success && response.data) {
          return {
            authenticated: true,
          };
        }
      } catch (error) {
        // Ignore
      }
    }
    
    return {
      authenticated: false,
      redirectTo: '/login',
      logout: true,
    };
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
