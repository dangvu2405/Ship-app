import { useCallback, useRef } from 'react';

type GuardOptions = {
  cooldownMs?: number;
  force?: boolean;
};

type GuardState = {
  inFlight: boolean;
  lastAt: number;
};

export function useGuardedAsync(defaultCooldownMs = 1000) {
  const stateRef = useRef<Record<string, GuardState>>({});

  const run = useCallback(
    async <T>(key: string, task: () => Promise<T>, options?: GuardOptions): Promise<T | undefined> => {
      const cooldownMs = options?.cooldownMs ?? defaultCooldownMs;
      const force = options?.force ?? false;
      const guard = stateRef.current[key] ?? { inFlight: false, lastAt: 0 };
      const now = Date.now();

      if (!force) {
        if (guard.inFlight) return undefined;
        if (now - guard.lastAt < cooldownMs) return undefined;
      }

      stateRef.current[key] = { ...guard, inFlight: true };
      try {
        const result = await task();
        return result;
      } finally {
        stateRef.current[key] = { inFlight: false, lastAt: Date.now() };
      }
    },
    [defaultCooldownMs]
  );

  return { run };
}
