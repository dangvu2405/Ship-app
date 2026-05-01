import { useQuery, type QueryKey, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import api from '@/services/api';
import type { ApiResponse } from '@/types';

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

  return useQuery({
    queryKey,
    enabled,
    staleTime,
    gcTime,
    refetchInterval,
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
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    gcTime,
    refetchInterval,
    retry,
    select,
  });
}
