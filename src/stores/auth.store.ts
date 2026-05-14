import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeStorage } from '@/lib/safe-storage';
import { queryClient } from '@/lib/query-client';
import { Tenant, User } from '@/types';
import authService from '@/services/auth.service';
import toast from 'react-hot-toast';
import { STORAGE_KEYS } from '@/utils/constants';
import {
  clearAuthToken,
  clearTenantId,
  getAuthToken,
  getRefreshToken,
  getTenantId,
  setAuthToken,
  setRefreshToken,
  setTenantId,
} from '@/lib/auth-session';
import { refreshAuthSession } from '@/lib/axios';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  /** ID tenant đang active trong session này. null = chưa chọn (chỉ xảy ra khi user thuộc nhiều tenant). */
  currentTenantId: number | null;
  /** Danh sách tenant chờ user chọn sau khi login (chỉ có khi user thuộc ≥ 2 tenant). */
  pendingTenants: Tenant[];
  /** Xóa cache React Query + storage + state auth (không gọi API logout). */
  clearClientSession: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  socialLogin: (credentials: { provider: 'google' | 'facebook' | 'apple'; access_token?: string; id_token?: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  /** Lưu token + user khi hoàn tất luồng ngoài form email/password (nếu có). */
  setSession: (user: User, rememberMe?: boolean, token?: string, refreshToken?: string) => void;
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
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      mustChangePassword: false,
      currentTenantId: null,
      pendingTenants: [],

      clearClientSession: () => {
        clearAuthToken();
        queryClient.clear();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          mustChangePassword: false,
          currentTenantId: null,
          pendingTenants: [],
        });
      },

      login: async (email: string, password: string, rememberMe?: boolean) => {
        try {
          set({ isLoading: true });
          
          const response = await authService.login({
            email,
            password,
            ...(rememberMe === true ? { remember: true } : {}),
          });
          if (response.success && response.data?.user) {
            const user: User = {
              ...response.data.user,
              tenants: (response.data as any).tenants ?? response.data.user.tenants ?? []
            };
            const data = response.data as any;
            const token: string | undefined = data.token ?? data.access_token;
            const refreshToken: string | undefined = data.refreshToken ?? data.refresh_token;
            get().setSession(user, rememberMe, token, refreshToken);
            toast.success('Login successful');
          } else {
            set({ isLoading: false });
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
            const user: User = {
              ...response.data.user,
              tenants: (response.data as any).tenants ?? response.data.user.tenants ?? []
            };
            const data = response.data as any;
            const token: string | undefined = data.token ?? data.access_token;
            const refreshToken: string | undefined = data.refreshToken ?? data.refresh_token;
            get().setSession(user, true, token, refreshToken);
            toast.success('Login successful');
          } else {
            set({ isLoading: false });
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
          get().clearClientSession();
          toast.success('Logged out successfully');
        }
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          // Access token is sessionStorage-scoped (cleared on tab close/reload).
          // If it is gone but a refresh token exists (rememberMe=true stored in localStorage),
          // pre-refresh so /auth/me is not called without a Bearer → avoids spurious logout.
          if (!getAuthToken() && getRefreshToken()) {
            const refreshed = await refreshAuthSession();
            if (!refreshed) {
              get().clearClientSession();
              return;
            }
          }
          const response = await authService.getCurrentUser();

          const user = authService.getUserFromMeResponse(response);
          if (response.success && user) {
            const storedTenantId = getTenantId();
            const { currentTenantId, pendingTenants } = resolveTenantAfterAuth(user, storedTenantId);
            set({ user, isAuthenticated: true, isLoading: false, currentTenantId, pendingTenants });
          } else {
            get().clearClientSession();
          }
        } catch {
          get().clearClientSession();
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setSession: (user: User, rememberMe = true, token?: string, refreshToken?: string) => {
        if (token) {
          setAuthToken(token, rememberMe);
        }
        if (refreshToken) {
          setRefreshToken(refreshToken, rememberMe);
        }
        const storedTenantId = getTenantId();
        const { currentTenantId, pendingTenants } = resolveTenantAfterAuth(user, storedTenantId);
        const mustChangePassword = !!(user as any).must_change_password;
        set({ user, isAuthenticated: true, isLoading: false, currentTenantId, pendingTenants, mustChangePassword });
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
      name: STORAGE_KEYS.AUTH_STORAGE,
      storage: createSafeStorage(),
      partialize: () => ({}),
    }
  )
);
