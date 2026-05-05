import { useQuery } from '@tanstack/react-query'
import type { BaseRecord, CrudFilter, CrudSort, GetListParams } from '@refinedev/core'
import { dataProvider } from '@/providers/dataProvider'
import { createResourceQueryKeys } from '../shared/query/createResourceQueryKeys'

interface UseResourceListQueryParams {
  resource: string
  current: number
  pageSize?: number
  filters?: CrudFilter[]
  sorters?: CrudSort[]
  enabled?: boolean
}

export function useResourceListQuery<TData extends BaseRecord = BaseRecord>({
  resource,
  current,
  pageSize = 15,
  filters = [],
  sorters = [],
  enabled = true,
}: UseResourceListQueryParams) {
  const keys = createResourceQueryKeys(resource)
  const listParams: GetListParams = {
    resource,
    pagination: { current, pageSize },
    filters,
    sorters,
  }

  return useQuery({
    queryKey: keys.list({
      current,
      pageSize,
      filters,
      sorters,
    }),
    queryFn: () => dataProvider.getList<TData>(listParams),
    enabled,
  })
}
