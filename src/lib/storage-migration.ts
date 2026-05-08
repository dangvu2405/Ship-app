import { STORAGE_KEYS } from '@/utils/constants';

type MigrationRule = {
  target: string;
  sources: string[];
};

const LEGACY_STORAGE_MIGRATIONS: MigrationRule[] = [
  {
    target: STORAGE_KEYS.APP_STORAGE,
    sources: ['app-storage', 'app-storage:v1a'],
  },
  {
    target: STORAGE_KEYS.AUTH_STORAGE,
    sources: ['uth-storage:v1', 'auth-storage'],
  },
];

export function cleanupLegacyStorageKeys(): void {
  try {
    for (const rule of LEGACY_STORAGE_MIGRATIONS) {
      const hasTarget = localStorage.getItem(rule.target) !== null;

      // Preserve existing data by promoting the first available legacy key.
      if (!hasTarget) {
        for (const source of rule.sources) {
          const legacyValue = localStorage.getItem(source);
          if (legacyValue !== null) {
            localStorage.setItem(rule.target, legacyValue);
            break;
          }
        }
      }

      for (const source of rule.sources) {
        localStorage.removeItem(source);
      }
    }
  } catch {
    // Ignore localStorage access issues (private mode/quota/SSR-like contexts).
  }
}
