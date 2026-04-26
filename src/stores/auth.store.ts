import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeStorage } from '@/lib/safe-storage';
import { queryClient } from '@/lib/query-client';
import { Tenant, User } from '@/types';
import authService from '@/services/auth.service';
import toast from 'react-hot-toast';
import {
  clearAuthToken,
  clearTenantId,
  getTenantId,
  hasAuthToken,
  setAuthToken,
  setRefreshToken,
  setTenantId,
} from '@/lib/auth-session';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** ID tenant đang active trong session này. null = chưa chọn (chỉ xảy ra khi user thuộc nhiều tenant). */
  currentTenantId: number | null;
  /** Danh sách tenant chờ user chọn sau khi login (chỉ có khi user thuộc ≥ 2 tenant). */
  pendingTenants: Tenant[];
  login: (email: string, password: string) => Promise<void>;
  socialLogin: (credentials: { provider: 'google' | 'facebook' | 'apple'; access_token?: string; id_token?: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  /** Lưu token + user khi hoàn tất luồng ngoài form email/password (nếu có). */
  setSession: (user: User, token?: string) => void;
  /** Chọn tenant sau khi login — ghi vào localStorage và cập nhật state. */
  selectTenant: (tenantId: number) => void;
  /** Xoá tenant hiện tại để switch sang tenant khác (đưa user về /select-tenant). */
  switchTenant: () => void;
}

const resolveTenantAfterAuth = (
  user: User,
  storedTenantId: number | null,
): { currentTenantId: number | null; pendingTenants: Tenant[] } => {
  const tenants = user.tenants ?? [];

  if (tenants.length === 0) {
    // Backend chưa trả tenants (single-tenant legacy) — không block truy cập
    return { currentTenantId: null, pendingTenants: [] };
  }

  const storedIsValid = storedTenantId != null && tenants.some((t) => t.id === storedTenantId);
  if (storedIsValid) {
    setTenantId(storedTenantId!);
    return { currentTenantId: storedTenantId, pendingTenants: [] };
  }

  if (tenants.length === 1) {
    setTenantId(tenants[0].id);
    return { currentTenantId: tenants[0].id, pendingTenants: [] };
  }

  // Nhiều tenant — cần user chọn
  clearTenantId();
  return { currentTenantId: null, pendingTenants: tenants };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      currentTenantId: null,
      pendingTenants: [],

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const response = await authService.login({ email, password });
          if (response.success && response.data?.user) {
            const accessToken = response.data.access_token || response.data.token;
            const refreshToken = response.data.refresh_token;
            if (accessToken) setAuthToken(accessToken);
            if (refreshToken) setRefreshToken(refreshToken);

            const user: User = { ...response.data.user, tenants: response.data.tenants ?? response.data.user.tenants ?? [] };
            const { currentTenantId, pendingTenants } = resolveTenantAfterAuth(user, null);

            set({ user, isAuthenticated: true, isLoading: false, currentTenantId, pendingTenants });
            toast.success('Login successful');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      socialLogin: async (credentials: { provider: 'google' | 'facebook' | 'apple'; access_token?: string; id_token?: string }) => {
        try {
          set({ isLoading: true });
          const response = await authService.socialLogin(credentials);
          if (response.success && response.data?.user) {
            const accessToken = response.data.access_token || response.data.token;
            const refreshToken = response.data.refresh_token;
            if (accessToken) setAuthToken(accessToken);
            if (refreshToken) setRefreshToken(refreshToken);

            const user: User = { ...response.data.user, tenants: response.data.tenants ?? response.data.user.tenants ?? [] };
            const { currentTenantId, pendingTenants } = resolveTenantAfterAuth(user, null);

            set({ user, isAuthenticated: true, isLoading: false, currentTenantId, pendingTenants });
            toast.success('Login successful');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // no-op
        } finally {
          clearAuthToken();
          set({ user: null, isAuthenticated: false, currentTenantId: null, pendingTenants: [] });
          toast.success('Logged out successfully');
        }
      },

      checkAuth: async () => {
        if (!hasAuthToken()) {
          set({ user: null, isAuthenticated: false, isLoading: false, currentTenantId: null, pendingTenants: [] });
          return;
        }

        try {
          set({ isLoading: true });
          const response = await authService.getCurrentUser();
          const user = authService.getUserFromMeResponse(response);
          if (response.success && user) {
            const storedTenantId = getTenantId();
            const { currentTenantId, pendingTenants } = resolveTenantAfterAuth(user, storedTenantId);
            set({ user, isAuthenticated: true, isLoading: false, currentTenantId, pendingTenants });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false, currentTenantId: null, pendingTenants: [] });
          }
        } catch {
          clearAuthToken();
          set({ user: null, isAuthenticated: false, isLoading: false, currentTenantId: null, pendingTenants: [] });
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setSession: (user: User, token?: string) => {
        if (token) setAuthToken(token);
        const storedTenantId = getTenantId();
        const { currentTenantId, pendingTenants } = resolveTenantAfterAuth(user, storedTenantId);
        set({ user, isAuthenticated: true, isLoading: false, currentTenantId, pendingTenants });
      },

      selectTenant: (tenantId: number) => {
        setTenantId(tenantId);
        // Clear all cached queries so the new tenant's data loads fresh
        queryClient.clear();
        set({ currentTenantId: tenantId, pendingTenants: [] });
      },

      switchTenant: () => {
        clearTenantId();
        // Clear cache — user is leaving this tenant's data context
        queryClient.clear();
        set((state) => ({
          currentTenantId: null,
          pendingTenants: state.user?.tenants ?? [],
        }));
      },
    }),
    {
      name: 'auth-storage:v1',
      storage: createSafeStorage(),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentTenantId: state.currentTenantId,
      }),
    }
  )
);
