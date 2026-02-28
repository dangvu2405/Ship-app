import { createJSONStorage } from 'zustand/middleware';

/**
 * Creates a safe localStorage wrapper that gracefully handles
 * errors from quota exceeded, incognito mode, or SSR environments.
 */
export const createSafeStorage = () =>
  createJSONStorage(() => ({
    getItem: (name: string) => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        localStorage.setItem(name, value);
      } catch {
        // Quota exceeded or incognito mode
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name);
      } catch {
        // Ignore
      }
    },
  }));
