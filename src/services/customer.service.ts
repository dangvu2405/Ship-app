import api from './api';
import { ENDPOINTS } from './endpoints';
import type {
  CustomerDebtResponse,
  CustomerDetailResponse,
  CustomerListParams,
  CustomerListResponse,
  CustomerPaymentsResponse,
  CustomerPriceListsResponse,
  CustomerTripsResponse,
  PriceListDetailResponse,
  PriceListItemDetailResponse,
} from '@/types/api/customer';
import type {
  StoreCustomerPaymentRequest,
  StoreCustomerRequest,
  StorePriceListItemRequest,
  StorePriceListRequest,
  UpdateCustomerRequest,
} from '@/types/requests/customer';

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
  
  async getPriceLists(id: number): Promise<CustomerPriceListsResponse> {
    const response = await api.get<CustomerPriceListsResponse>(ENDPOINTS.customers.priceLists(id));
    return response.data;
  },
  
  async createPriceList(customerId: number, data: StorePriceListRequest): Promise<PriceListDetailResponse> {
    const response = await api.post<PriceListDetailResponse>(ENDPOINTS.customers.priceLists(customerId), data);
    return response.data;
  },
  
  async deletePriceList(id: number): Promise<PriceListDetailResponse> {
    const response = await api.delete<PriceListDetailResponse>(ENDPOINTS.priceLists.byId(id));
    return response.data;
  },
  
  async addPriceListItem(priceListId: number, data: StorePriceListItemRequest): Promise<PriceListItemDetailResponse> {
    const response = await api.post<PriceListItemDetailResponse>(ENDPOINTS.priceLists.items(priceListId), data);
    return response.data;
  },
  
  async deletePriceListItem(priceListId: number, itemId: number): Promise<PriceListItemDetailResponse> {
    const response = await api.delete<PriceListItemDetailResponse>(ENDPOINTS.priceLists.itemById(priceListId, itemId));
    return response.data;
  },
  
  async getGroups(params?: { current?: number; pageSize?: number; keyword?: string }): Promise<any> {
    const response = await api.get(ENDPOINTS.customerGroups.base, {
      params: params
        ? {
            page: params.current,
            per_page: params.pageSize,
            search: params.keyword,
          }
        : undefined,
    });
    return response.data;
  },
  
  async getReconciliations(id: number, params?: { current?: number; pageSize?: number }): Promise<any> {
    const response = await api.get(ENDPOINTS.customers.reconciliations(id), {
      params: params
        ? {
            page: params.current,
            per_page: params.pageSize,
          }
        : undefined,
    });
    return response.data;
  },
};

export default customerService;