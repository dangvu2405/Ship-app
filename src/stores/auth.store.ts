import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeStorage } from '@/lib/safe-storage';
import { User } from '@/types';
import authService from '@/services/auth.service';
import toast from 'react-hot-toast';
import { clearAuthToken, hasAuthToken, setAuthToken } from '@/lib/auth-session';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  /** Lưu token + user khi hoàn tất luồng ngoài form email/password (nếu có). */
  setSession: (user: User, token?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const response = await authService.login({ email, password });
          if (response.success && response.data?.user) {
            if (response.data.token) {
              setAuthToken(response.data.token);
            }
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
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
          // no-op: local logout still executes in finally
        } finally {
          clearAuthToken();
          set({
            user: null,
            isAuthenticated: false,
          });
          toast.success('Logged out successfully');
        }
      },

      checkAuth: async () => {
        if (!hasAuthToken()) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        try {
          set({ isLoading: true });
          const response = await authService.getCurrentUser();
          const user = authService.getUserFromMeResponse(response);
          if (response.success && user) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch {
          clearAuthToken();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setSession: (user: User, token?: string) => {
        if (token) {
          setAuthToken(token);
        }
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage:v1',
      storage: createSafeStorage(),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
