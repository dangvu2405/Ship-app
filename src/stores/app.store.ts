import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeStorage } from '@/lib/safe-storage';
import type { Locale } from '@/locales';
import { STORAGE_KEYS } from '@/utils/constants';

interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  locale: Locale;
  compactMode: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifySound: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLocale: (locale: Locale) => void;
  setCompactMode: (value: boolean) => void;
  setNotifyEmail: (value: boolean) => void;
  setNotifyPush: (value: boolean) => void;
  setNotifySound: (value: boolean) => void;
  resetUiPreferences: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      locale: 'vi' as Locale,
      compactMode: false,
      notifyEmail: true,
      notifyPush: true,
      notifySound: false,

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      setLocale: (locale: Locale) => {
        set({ locale });
      },

      setCompactMode: (value: boolean) => set({ compactMode: value }),
      setNotifyEmail: (value: boolean) => set({ notifyEmail: value }),
      setNotifyPush: (value: boolean) => set({ notifyPush: value }),
      setNotifySound: (value: boolean) => set({ notifySound: value }),

      resetUiPreferences: () =>
        set({
          compactMode: false,
          notifyEmail: true,
          notifyPush: true,
          notifySound: false,
        }),
    }),
    {
      name: STORAGE_KEYS.APP_STORAGE,
      storage: createSafeStorage(),
    }
  )
);
