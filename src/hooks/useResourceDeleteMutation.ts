import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dataProvider } from '@/providers/dataProvider'
import { createResourceQueryKeys } from '../shared/query/createResourceQueryKeys'

interface DeleteParams {
  resource: string
  id: number | string
}

export function useResourceDeleteMutation(resource: string) {
  const queryClient = useQueryClient()
  const keys = createResourceQueryKeys(resource)

  return useMutation({
    mutationFn: ({ id }: Omit<DeleteParams, 'resource'>) =>
      dataProvider.deleteOne({
        resource,
        id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.lists() })
    },
  })
}
