import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BaseRecord, CreateParams } from '@refinedev/core'
import { dataProvider } from '@/providers/dataProvider'
import { createResourceQueryKeys } from '../shared/query/createResourceQueryKeys'
import { showSuccess } from './_shared'

type UseCreateParams = {
  resource: string
  successMessage?: string
  onSuccess?: (data: unknown) => void | Promise<void>
  onError?: (error: unknown) => void | Promise<void>
}

export function useCreate<TData extends BaseRecord = BaseRecord, TVariables = Record<string, never>>({
  resource,
  successMessage = 'Created successfully',
  onSuccess,
  onError,
}: UseCreateParams) {
  const queryClient = useQueryClient()
  const keys = createResourceQueryKeys(resource)

  return useMutation({
    mutationFn: (variables: TVariables) => {
      const params: CreateParams<TVariables> = { resource, variables }
      return dataProvider.create<TData, TVariables>(params)
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: keys.all })
      if (successMessage) showSuccess(successMessage)
      await onSuccess?.(result)
    },
    onError: async (error) => {
      await onError?.(error)
    },
  })
}