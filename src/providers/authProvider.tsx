import { AuthProvider } from '@refinedev/core';
import { User } from '@/types';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/routes';
import { getErrorStatus } from '@/utils/errorHandler';

const getAuthStoreState = () => {
  return useAuthStore.getState();
};

const getApiErrorMessage = (error: unknown) => {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined;
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
};

const GENERIC_LOGIN_FAIL = 'Invalid email or password.';
const GENERIC_FORGOT_HINT =
  'If an account exists for this email, you will receive reset instructions.';

const normalizeLoginUser = (response: { data?: { user: User; tenants?: User['tenants'] } }): User => {
  const u = response.data?.user;
  if (!u) throw new Error('Missing user');
  return {
    ...u,
    tenants: (response.data as { tenants?: User['tenants'] })?.tenants ?? u.tenants ?? [],
  };
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await authService.login({ email, password });

      if (response.success && response.data?.user) {
        const user = normalizeLoginUser(response as { data: { user: User } });
        useAuthStore.getState().setSession(user);
        const { currentTenantId } = useAuthStore.getState();
        return {
          success: true,
          redirectTo: currentTenantId ? ROUTES.dashboard : ROUTES.selectTenant,
        };
      }

      return {
        success: false,
        error: {
          message: GENERIC_LOGIN_FAIL,
          name: 'LoginError',
        },
      };
    } catch (error: unknown) {
      const status = getErrorStatus(error);
      const safeAuth =
        status === 401 || status === 403 || status === 404 || status === 419 || status === 429;
      return {
        success: false,
        error: {
          message: safeAuth ? GENERIC_LOGIN_FAIL : getApiErrorMessage(error) || GENERIC_LOGIN_FAIL,
          name: 'LoginError',
        },
      };
    }
  },

  logout: async () => {
    await useAuthStore.getState().logout();

    return {
      success: true,
      redirectTo: ROUTES.login,
    };
  },

  check: async () => {
    const UNAUTHENTICATED = { authenticated: false, redirectTo: ROUTES.login, logout: true } as const;
    const AUTHENTICATED = { authenticated: true } as const;

    const tryGetCurrentUser = async (): Promise<boolean> => {
      try {
        const response = await authService.getCurrentUser();
        const user = authService.getUserFromMeResponse(response);
        if (response.success && user) {
          useAuthStore.getState().setSession(user);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    if (await tryGetCurrentUser()) return AUTHENTICATED;

    useAuthStore.getState().clearClientSession();

    return UNAUTHENTICATED;
  },

  onError: async (error) => {
    if (error?.status === 401) {
      useAuthStore.getState().clearClientSession();
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
        useAuthStore.getState().setSession(user);
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
      const status = getErrorStatus(error);
      const generic = 'Registration could not be completed.';
      return {
        success: false,
        error: {
          message: status === 422 ? getApiErrorMessage(error) || generic : generic,
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
          message: GENERIC_FORGOT_HINT,
          name: 'ForgotPasswordError',
        },
      };
    } catch (error: unknown) {
      const status = getErrorStatus(error);
      return {
        success: false,
        error: {
          message:
            status === 422 ? getApiErrorMessage(error) || GENERIC_FORGOT_HINT : GENERIC_FORGOT_HINT,
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
