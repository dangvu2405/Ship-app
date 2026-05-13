import { useMutation, useQueryClient } from '@tanstack/react-query';
import tripService from '@/services/trip.service';
import type { Trip } from '@/types';
import type { AssignTripRequest } from '@/types/requests/trip';
import { createResourceQueryKeys } from '@/shared/query/createResourceQueryKeys';
import { getErrorMessage } from '@/utils/errorHandler';
import { safeMessage, showSuccess } from './_shared';

type MutationHandlers<TData> = {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: TData) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};

const tripKeys = createResourceQueryKeys('trips');

export function useTripAssign({
  successMessage,
  errorMessage,
  onSuccess,
  onError,
}: MutationHandlers<Trip> = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: AssignTripRequest }) => {
      const response = await tripService.assign(id, payload);
      if (!response.success || !response.data) {
        throw new Error(response.message || errorMessage || 'Trip assignment failed');
      }
      return response.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: tripKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['dispatch'] });
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
      if (successMessage) {
        showSuccess(successMessage);
      }
      await onSuccess?.(data);
    },
    onError: async (error) => {
      safeMessage()?.error(getErrorMessage(error) ?? errorMessage ?? 'Trip assignment failed');
      await onError?.(error);
    },
  });
}
