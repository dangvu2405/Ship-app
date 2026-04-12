import type { QueryClient } from '@tanstack/react-query';

export function invalidateResourceList(queryClient: QueryClient, resourceKey: readonly unknown[]) {
  return queryClient.invalidateQueries({ queryKey: resourceKey });
}
