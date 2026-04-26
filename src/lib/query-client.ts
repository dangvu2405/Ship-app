import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton QueryClient shared between App.tsx (QueryClientProvider)
 * and auth.store.ts (cache invalidation on tenant switch).
 *
 * Keeping a single instance ensures that calling queryClient.clear()
 * in the store actually clears the cache that React components see.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
  },
});
