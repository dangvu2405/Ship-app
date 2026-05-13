import { useMutation, useQueryClient } from '@tanstack/react-query';
import leaveService from '@/services/leave.service';
import type { LeaveRequest } from '@/types';
import { createResourceQueryKeys } from '@/shared/query/createResourceQueryKeys';
import { getErrorMessage } from '@/utils/errorHandler';
import { safeMessage, showSuccess } from './_shared';

type MutationHandlers = {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: LeaveRequest) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};

const leaveKeys = createResourceQueryKeys('leave-requests');

function useLeaveAction(
  mutationFn: (params: { id: number; rejection_reason?: string }) => Promise<{ success: boolean; message: string; data?: LeaveRequest }>,
  { successMessage, errorMessage, onSuccess, onError }: MutationHandlers = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: number; rejection_reason?: string }) => {
      const response = await mutationFn(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || errorMessage || 'Leave request action failed');
      }
      return response.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      if (successMessage) {
        showSuccess(successMessage);
      }
      await onSuccess?.(data);
    },
    onError: async (error) => {
      safeMessage()?.error(getErrorMessage(error) ?? errorMessage ?? 'Leave request action failed');
      await onError?.(error);
    },
  });
}

export function useLeaveApprove(options: MutationHandlers = {}) {
  return useLeaveAction(({ id }) => leaveService.approve(id), options);
}

export function useLeaveReject(options: MutationHandlers = {}) {
  return useLeaveAction(
    ({ id, rejection_reason }) => leaveService.reject(id, rejection_reason ?? ''),
    options,
  );
}

export function useLeaveCancel(options: MutationHandlers = {}) {
  return useLeaveAction(({ id }) => leaveService.cancel(id), options);
}
