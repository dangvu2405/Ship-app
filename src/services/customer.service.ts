import api from './api';
import { ENDPOINTS } from './endpoints';
import type {
  CustomerDebtResponse,
  CustomerDetailResponse,
  CustomerListParams,
  CustomerListResponse,
  CustomerPaymentsResponse,
  CustomerTripsResponse,
} from '@/types/api/customer';
import type { StoreCustomerPaymentRequest, StoreCustomerRequest, UpdateCustomerRequest } from '@/types/requests/customer';

const customerService = {
  async getList(params?: CustomerListParams): Promise<CustomerListResponse> {
    const response = await api.get<CustomerListResponse>(ENDPOINTS.customers.base, {
      params: params
        ? {
            page: params.current,
            per_page: params.pageSize,
            search: params.search?.trim() || undefined,
            type: params.type || undefined,
          }
        : undefined,
    });
    return response.data;
  },

  async getById(id: number): Promise<CustomerDetailResponse> {
    const response = await api.get<CustomerDetailResponse>(ENDPOINTS.customers.byId(id));
    return response.data;
  },

  async create(data: StoreCustomerRequest): Promise<CustomerDetailResponse> {
    const response = await api.post<CustomerDetailResponse>(ENDPOINTS.customers.base, data);
    return response.data;
  },

  async update(id: number, data: UpdateCustomerRequest): Promise<CustomerDetailResponse> {
    const response = await api.put<CustomerDetailResponse>(ENDPOINTS.customers.byId(id), data);
    return response.data;
  },

  async delete(id: number): Promise<CustomerDetailResponse> {
    const response = await api.delete<CustomerDetailResponse>(ENDPOINTS.customers.byId(id));
    return response.data;
  },

  async getTrips(id: number, params?: { current?: number; pageSize?: number }): Promise<CustomerTripsResponse> {
    const response = await api.get<CustomerTripsResponse>(ENDPOINTS.customers.trips(id), {
      params: params
        ? {
            page: params.current,
            per_page: params.pageSize,
          }
        : undefined,
    });
    return response.data;
  },

  async getDebt(id: number): Promise<CustomerDebtResponse> {
    const response = await api.get<CustomerDebtResponse>(ENDPOINTS.customers.debt(id));
    return response.data;
  },

  async getPayments(id: number, params?: { current?: number; pageSize?: number }): Promise<CustomerPaymentsResponse> {
    const response = await api.get<CustomerPaymentsResponse>(ENDPOINTS.customers.payments(id), {
      params: params
        ? {
            page: params.current,
            per_page: params.pageSize,
          }
        : undefined,
    });
    return response.data;
  },

  async createPayment(id: number, data: StoreCustomerPaymentRequest): Promise<CustomerDetailResponse> {
    const response = await api.post<CustomerDetailResponse>(ENDPOINTS.customers.payments(id), data);
    return response.data;
  },

  async deletePayment(paymentId: number): Promise<CustomerDetailResponse> {
    const response = await api.delete<CustomerDetailResponse>(ENDPOINTS.payments.byId(paymentId));
    return response.data;
  },
};

export default customerService;