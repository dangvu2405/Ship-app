import { useMutation, useQueryClient } from '@tanstack/react-query';
import vehicleService from '@/services/vehicle.service';
import type { Vehicle } from '@/types';
import type { UpdateVehicleStatusRequest } from '@/types/requests/vehicle';
import { createResourceQueryKeys } from '@/shared/query/createResourceQueryKeys';
import { getErrorMessage } from '@/utils/errorHandler';
import { safeMessage, showSuccess } from './_shared';

type MutationHandlers = {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: Vehicle) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};

const vehicleKeys = createResourceQueryKeys('vehicles');

export function useVehicleStatusUpdate({
  successMessage,
  errorMessage,
  onSuccess,
  onError,
}: MutationHandlers = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UpdateVehicleStatusRequest }) => {
      const response = await vehicleService.updateStatus(id, payload);
      return response.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['dispatch'] });
      if (successMessage) {
        showSuccess(successMessage);
      }
      await onSuccess?.(data);
    },
    onError: async (error) => {
      safeMessage()?.error(getErrorMessage(error) ?? errorMessage ?? 'Vehicle status update failed');
      await onError?.(error);
    },
  });
}
