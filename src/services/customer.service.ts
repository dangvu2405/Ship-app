import api from './api';
import { ENDPOINTS } from './endpoints';
import type {
  CustomerDebtResponse,
  CustomerDetailResponse,
  CustomerGroupsResponse,
  CustomerListParams,
  CustomerListResponse,
  CustomerPriceListItemResponse,
  CustomerPriceListResponse,
  CustomerPaymentsResponse,
  CustomerPriceListsResponse,
  CustomerTripsResponse,
  ReconciliationListResponse,
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
            group_id: params.group_id || undefined,
            status: params.status || undefined,
            include_deleted: params.include_deleted ? 1 : 0,
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

  async getPriceLists(customerId: number): Promise<CustomerPriceListsResponse> {
    const response = await api.get<CustomerPriceListsResponse>(ENDPOINTS.customers.priceLists(customerId));
    return response.data;
  },

  async getGroups(params?: { current?: number; pageSize?: number; keyword?: string }): Promise<CustomerGroupsResponse> {
    const response = await api.get<CustomerGroupsResponse>(ENDPOINTS.customers.groups, {
      params: params
        ? {
            page: params.current,
            per_page: params.pageSize,
            keyword: params.keyword?.trim() || undefined,
          }
        : undefined,
    });
    return response.data;
  },

  async createPriceList(customerId: number, values: { name: string; effective_from: string; effective_to?: string; notes?: string }): Promise<CustomerPriceListResponse> {
    const response = await api.post<CustomerPriceListResponse>(ENDPOINTS.customers.priceLists(customerId), values);
    return response.data;
  },

  async addPriceListItem(
    priceListId: number,
    values: {
      route_template_id?: number;
      vehicle_type_id?: number;
      cargo_type_id?: number;
      price: number;
      price_unit: 'per_trip' | 'per_km' | 'per_ton';
      notes?: string;
    },
  ): Promise<CustomerPriceListItemResponse> {
    const response = await api.post<CustomerPriceListItemResponse>(ENDPOINTS.priceLists.items(priceListId), values);
    return response.data;
  },

  async getReconciliations(customerId: number, params?: { current?: number; pageSize?: number }): Promise<ReconciliationListResponse> {
    const response = await api.get<ReconciliationListResponse>(ENDPOINTS.reconciliations.base, {
      params: {
        customer_id: customerId,
        ...(params
          ? {
              page: params.current,
              per_page: params.pageSize,
            }
          : {}),
      },
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
