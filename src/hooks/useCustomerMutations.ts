import { useMutation, useQueryClient } from '@tanstack/react-query';
import customerService from '@/services/customer.service';
import type { StoreCustomerPaymentRequest, StoreCustomerRequest, UpdateCustomerRequest } from '@/types/requests/customer';
import { customerKeys, handleMutationSuccess, type MutationHandlers } from './_customersInternal';

export function useCreateCustomer({ successMessage = 'Created successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: StoreCustomerRequest) => customerService.create(values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => { await onError?.(error); },
  });
}

export function useUpdateCustomer({ successMessage = 'Updated successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: number; values: UpdateCustomerRequest }) => customerService.update(params.id, params.values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => { await onError?.(error); },
  });
}

export function useDeleteCustomer({ successMessage = 'Deleted successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customerService.delete(id),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => { await onError?.(error); },
  });
}

export function useCreateCustomerPayment(customerId?: number | null, { successMessage = 'Created successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: StoreCustomerPaymentRequest) => customerService.createPayment(customerId as number, values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      if (customerId != null) {
        await queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
      }
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => { await onError?.(error); },
  });
}

export function useDeleteCustomerPayment({ successMessage = 'Deleted successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: number) => customerService.deletePayment(paymentId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => { await onError?.(error); },
  });
}

export function useCreatePriceList({ successMessage = 'Created successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { customerId: number; values: { name: string; effective_from: string; effective_to?: string; notes?: string } }) =>
      customerService.createPriceList(payload.customerId, payload.values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => { await onError?.(error); },
  });
}

export function useAddPriceListItem({ successMessage = 'Created successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      priceListId: number;
      values: {
        route_template_id?: number;
        vehicle_type_id?: number;
        cargo_type_id?: number;
        price: number;
        price_unit: 'per_trip' | 'per_km' | 'per_ton';
        notes?: string;
      };
    }) => customerService.addPriceListItem(payload.priceListId, payload.values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => { await onError?.(error); },
  });
}
