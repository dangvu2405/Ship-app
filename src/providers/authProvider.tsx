import { AuthProvider } from '@refinedev/core';
import { User } from '@/types';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/routes';
import { clearAuthToken, hasAuthToken, setAuthToken, setRefreshToken } from '@/lib/auth-session';

const getAuthStoreState = () => {
  return useAuthStore.getState();
};

const setCurrentUser = (user: User | null) => {
  useAuthStore.getState().setUser(user);
};

const getApiErrorMessage = (error: unknown) => {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined;
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await authService.login({ email, password });

      if (response.success && response.data?.user) {
        const accessToken = response.data.access_token || response.data.token;
        if (accessToken) {
          setAuthToken(accessToken);
        }
        if (response.data.refresh_token) {
          setRefreshToken(response.data.refresh_token);
        }
        setCurrentUser(response.data.user);
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
      return {
        success: false,
        error: {
          message: getApiErrorMessage(error) || 'Login failed',
          name: 'LoginError',
        },
      };
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
    } finally {
      clearAuthToken();
      setCurrentUser(null);
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

    if (!hasToken) {
      setCurrentUser(null);
      return UNAUTHENTICATED;
    }

    const tryGetCurrentUser = async (): Promise<boolean> => {
      try {
        const response = await authService.getCurrentUser();
        const user = authService.getUserFromMeResponse(response);
        if (response.success && user) {
          setCurrentUser(user);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    if (await tryGetCurrentUser()) return AUTHENTICATED;

    setCurrentUser(null);
    clearAuthToken();

    return UNAUTHENTICATED;
  },

  onError: async (error) => {
    if (error?.status === 401) {
      clearAuthToken();
      setCurrentUser(null);
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

    try {
      const response = await authService.getCurrentUser();
      const user = authService.getUserFromMeResponse(response);
      if (response.success && user) {
        setCurrentUser(user);
        return user as User;
      }

      return null;
    } catch {
      return null;
    }
  },

  register: async ({ username, password }) => {
    try {
      const response = await authService.register({
        email: username,
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
      return {
        success: false,
        error: {
          message: getApiErrorMessage(error) || 'Registration failed',
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
