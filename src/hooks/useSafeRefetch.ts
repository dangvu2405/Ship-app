import { useCallback } from 'react';
import { useGuardedAsync } from '@/hooks/useGuardedAsync';

type RefetchFn = () => Promise<unknown> | unknown;

export function useSafeRefetch(key: string, refetch: RefetchFn, cooldownMs = 800) {
  const { run } = useGuardedAsync(cooldownMs);

  const safeRefetch = useCallback(
    async (force = false) => {
      await run(
        `refetch:${key}`,
        async () => {
          await Promise.resolve(refetch());
        },
        { cooldownMs, force }
      );
    },
    [cooldownMs, key, refetch, run]
  );

  return safeRefetch;
}
