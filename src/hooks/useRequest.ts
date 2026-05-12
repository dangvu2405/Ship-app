import { useQuery, type QueryKey, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import api from '@/services/api';
import type { ApiResponse } from '@/types';

// Track consecutive 401 occurrences globally to trigger forced logout after N failures.
const AUTH_401_COUNTER_KEY = '__app_auth_401_count';

interface CustomWindow extends Window {
  [AUTH_401_COUNTER_KEY]?: number;
}

const increment401Count = (): number => {
  const w = window as unknown as CustomWindow;
  w[AUTH_401_COUNTER_KEY] = (w[AUTH_401_COUNTER_KEY] || 0) + 1;
  return w[AUTH_401_COUNTER_KEY];
};
const reset401Count = (): void => {
  (window as unknown as CustomWindow)[AUTH_401_COUNTER_KEY] = 0;
};

type UseRequestConfig<TData> = {
  queryKey: QueryKey;
  url: string;
  params?: Record<string, unknown>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchInterval?: number | false;
  useApiRoot?: boolean;
  skipErrorToast?: boolean;
  errorMode?: 'global' | 'local' | 'silent';
  select?: (data: TData | undefined) => TData;
};

export function useRequest<TData>(config: UseRequestConfig<TData>): UseQueryResult<TData | undefined, Error> {
  const {
    queryKey,
    url,
    params,
    enabled = true,
    staleTime,
    gcTime,
    refetchInterval,
    useApiRoot,
    skipErrorToast,
    errorMode,
    select,
  } = config;

  return useQuery<TData | undefined, Error>({
    queryKey,
    enabled,
    staleTime,
    gcTime,
    refetchInterval,
    // Retry at most 3 times with react-query default backoff
    retry: (failureCount: number, error: unknown) => {
      const respStatus = isAxiosError(error) ? error.response?.status : undefined;
      if (respStatus === 401) {
        const count = increment401Count();
        // If we've seen 3 or more 401s globally, trigger force-logout event (session expired)
        if (count >= 3) {
          window.dispatchEvent(new CustomEvent('auth:force-logout'));
        }
      }
      return failureCount < 3;
    },
    queryFn: async () => {
      const response = await api.get<ApiResponse<TData>>(url, {
        params,
        useApiRoot,
        skipErrorToast,
        errorMode,
      });
      const body = response.data;
      if (!body.success) {
        throw new Error(body.message || 'Request failed');
      }
      // reset 401 counter on success
      reset401Count();
      return body.data;
    },
    select,
  });
}

type UseCustomRequestConfig<TData> = {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
} & Pick<UseQueryOptions<TData>, 'enabled' | 'staleTime' | 'gcTime' | 'refetchInterval' | 'retry' | 'select'>;

export function useCustomRequest<TData>(config: UseCustomRequestConfig<TData>): UseQueryResult<TData, Error> {
  const { queryKey, queryFn, enabled, staleTime, gcTime, refetchInterval, retry, select } = config;
  return useQuery<TData, Error>({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    gcTime,
    refetchInterval,
    retry: retry ?? ((failureCount: number) => failureCount < 3),
    select,
  });
}
