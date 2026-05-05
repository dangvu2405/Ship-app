import { useQuery } from '@tanstack/react-query'
import type { BaseRecord, GetOneParams } from '@refinedev/core'
import { dataProvider } from '@/providers/dataProvider'
import { createResourceQueryKeys } from '../shared/query/createResourceQueryKeys'

type UseGetDetailParams = {
  resource: string
  id?: string | number | null
  enabled?: boolean
}

export function useGetDetail<TData extends BaseRecord = BaseRecord>({ resource, id, enabled = true }: UseGetDetailParams) {
  const keys = createResourceQueryKeys(resource)

  const query = useQuery({
    queryKey: id == null ? [...keys.details(), 'missing-id'] as const : keys.detail(id),
    enabled: enabled && id != null,
    queryFn: async () => {
      const params: GetOneParams = { resource, id: id as string | number }
      return dataProvider.getOne<TData>(params)
    },
  })

  return {
    ...query,
    record: query.data?.data,
  }
}