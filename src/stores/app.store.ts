import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeStorage } from '@/lib/safe-storage';
import type { Locale } from '@/locales';

interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  locale: Locale;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLocale: (locale: Locale) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      locale: 'vi' as Locale,

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
    }),
    {
      name: 'app-storage:v1',
      storage: createSafeStorage(),
    }
  )
);
