import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BaseRecord } from '@refinedev/core'
import { dataProvider } from '@/providers/dataProvider'
import { createResourceQueryKeys } from '../shared/query/createResourceQueryKeys'
import { confirmAction, showSuccess } from './_shared'

type UseDeleteParams = {
  resource: string
  successMessage?: string
  confirmTitle?: string
  confirmContent?: string
  confirmOkText?: string
  confirmCancelText?: string
  onSuccess?: (data: unknown) => void | Promise<void>
  onError?: (error: unknown) => void | Promise<void>
}

type DeleteTarget = string | number

export function useDelete<TData extends BaseRecord = BaseRecord>({
  resource,
  successMessage = 'Deleted successfully',
  confirmTitle = 'Delete item?',
  confirmContent = 'This action cannot be undone.',
  confirmOkText = 'Delete',
  confirmCancelText = 'Cancel',
  onSuccess,
  onError,
}: UseDeleteParams) {
  const queryClient = useQueryClient()
  const keys = createResourceQueryKeys(resource)

  const mutation = useMutation({
    mutationFn: (id: DeleteTarget) => dataProvider.deleteOne<TData>({ resource, id }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: keys.all })
      if (successMessage) showSuccess(successMessage)
      await onSuccess?.(result)
    },
    onError: async (error) => {
      await onError?.(error)
    },
  })

  const deleteOne = (id: DeleteTarget) => mutation.mutateAsync(id)

  const confirmDelete = (id: DeleteTarget) => {
    confirmAction({
      title: confirmTitle,
      content: confirmContent,
      okText: confirmOkText,
      cancelText: confirmCancelText,
      onOk: async () => {
        await mutation.mutateAsync(id)
      },
    })
  }

  return {
    ...mutation,
    deleteOne,
    confirmDelete,
  }
}