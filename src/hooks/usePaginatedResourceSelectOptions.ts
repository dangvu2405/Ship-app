import { useCallback, useMemo, type UIEvent } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { BaseRecord, CrudFilter, CrudSort } from '@refinedev/core';

import type { SelectOption } from '@/components/form';
import { dataProvider } from '@/providers/dataProvider';
import { createResourceQueryKeys } from '@/shared/query';

const PAGE_SIZE = 10;

type UsePaginatedResourceSelectOptionsParams<T extends BaseRecord> = {
  resource: string;
  filters?: CrudFilter[];
  sorters?: CrudSort[];
  mapOption: (row: T) => SelectOption;
  enabled?: boolean;
};

/**
 * Options for Ant `Select` / {@link FormItemSelect} with infinite scroll in the dropdown (10 rows per API page).
 */
export function usePaginatedResourceSelectOptions<T extends BaseRecord>({
  resource,
  filters = [],
  sorters = [],
  mapOption,
  enabled = true,
}: UsePaginatedResourceSelectOptionsParams<T>) {
  const keys = createResourceQueryKeys(resource);

  const infinite = useInfiniteQuery({
    queryKey: [...keys.lists(), 'select-infinite', PAGE_SIZE, resource, filters, sorters] as const,
    initialPageParam: 1,
    enabled,
    queryFn: async ({ pageParam }) => {
      const res = await dataProvider.getList<T>({
        resource,
        pagination: { current: pageParam as number, pageSize: PAGE_SIZE },
        filters,
        sorters,
      });
      return { rows: res.data ?? [], total: res.total ?? 0 };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.rows.length, 0);
      if (loaded >= lastPage.total) return undefined;
      return allPages.length + 1;
    },
  });

  const options = useMemo(
    () => infinite.data?.pages.flatMap((p) => p.rows.map((row) => mapOption(row))) ?? [],
    [infinite.data, mapOption],
  );

  const onPopupScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const { target } = e;
      if (!(target instanceof HTMLElement)) return;
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollHeight - scrollTop <= clientHeight + 32) {
        if (infinite.hasNextPage && !infinite.isFetchingNextPage) {
          void infinite.fetchNextPage();
        }
      }
    },
    [infinite],
  );

  return {
    options,
    isLoading: infinite.isLoading,
    isFetchingNextPage: infinite.isFetchingNextPage,
    onPopupScroll,
    hasNextPage: infinite.hasNextPage,
  };
}
