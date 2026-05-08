import api from './api';
import { ENDPOINTS } from './endpoints';
import { throwIfEnvelopeFailed, unwrapEnvelope } from './http';
import type {
  CustomerDebtResponse,
  CustomerDetailResponse,
  CustomerGroupsResponse,
  CustomerListParams,
  CustomerListResponse,
  CustomerPayment,
  CustomerPaymentsResponse,
  PriceList,
  CustomerPriceListsResponse,
  CustomerReconciliationResponse,
  ReconciliationSessionSummary,
  CustomerTripsResponse,
} from '@/types/api/customer';
import type { Customer, CustomerGroup, Trip } from '@/types';
import type { StoreCustomerPaymentRequest, StoreCustomerRequest, UpdateCustomerRequest } from '@/types/requests/customer';

function normalizeListEnvelope<T>(body: unknown) {
  throwIfEnvelopeFailed(body);
  const payload = unwrapEnvelope<unknown>(body);
  if (Array.isArray(payload)) {
    return { data: payload as T[], total: (body as { meta?: { total?: number } }).meta?.total ?? payload.length };
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: T[] }).data)) {
    const box = payload as { data: T[]; total?: number; meta?: { total?: number } };
    return { data: box.data, total: box.meta?.total ?? box.total ?? box.data.length };
  }
  return { data: [] as T[], total: 0 };
}

const customerService = {
  async getList(params?: CustomerListParams): Promise<CustomerListResponse> {
    const response = await api.get(ENDPOINTS.customers.base, {
      params: params
        ? {
            page: params.current,
            per_page: params.pageSize,
            search: params.search?.trim() || undefined,
            type: params.type || undefined,
            group_id: params.group_id || undefined,
            status: params.status || undefined,
            include_deleted: params.include_deleted ? 1 : undefined,
          }
        : undefined,
    });
    const normalized = normalizeListEnvelope<Customer>(response.data);
    return { success: true, message: 'OK', data: { data: normalized.data, total: normalized.total } };
  },

  async getDetail(id: number): Promise<CustomerDetailResponse> {
    const response = await api.get(ENDPOINTS.customers.byId(id));
    throwIfEnvelopeFailed(response.data);
    const customer = unwrapEnvelope<CustomerDetailResponse['data']>(response.data);
    return { success: true, message: 'OK', data: customer };
  },

  async getById(id: number): Promise<CustomerDetailResponse> {
    return this.getDetail(id);
  },

  async create(data: StoreCustomerRequest): Promise<CustomerDetailResponse> {
    const response = await api.post(ENDPOINTS.customers.base, data);
    throwIfEnvelopeFailed(response.data);
    return { success: true, message: 'OK', data: unwrapEnvelope(response.data) };
  },

  async update(id: number, data: UpdateCustomerRequest): Promise<CustomerDetailResponse> {
    const response = await api.put(ENDPOINTS.customers.byId(id), data);
    throwIfEnvelopeFailed(response.data);
    return { success: true, message: 'OK', data: unwrapEnvelope(response.data) };
  },

  async delete(id: number): Promise<CustomerDetailResponse> {
    const detail = await this.getDetail(id);
    const tripsCount = Number(detail.data?.trips_count ?? 0);
    if (tripsCount > 0) {
      throw new Error('Không thể xóa khách hàng đã phát sinh chuyến (R08).');
    }
    const response = await api.delete(ENDPOINTS.customers.byId(id));
    throwIfEnvelopeFailed(response.data);
    return { success: true, message: 'OK', data: unwrapEnvelope(response.data) };
  },

  async getTrips(id: number, params?: { current?: number; pageSize?: number }): Promise<CustomerTripsResponse> {
    const response = await api.get(ENDPOINTS.customers.trips(id), {
      params: params
        ? {
            page: params.current,
            per_page: params.pageSize,
          }
        : undefined,
    });
    const normalized = normalizeListEnvelope<Trip>(response.data);
    return { success: true, message: 'OK', data: { data: normalized.data, total: normalized.total } };
  },

  async getDebt(id: number): Promise<CustomerDebtResponse> {
    const response = await api.get(ENDPOINTS.customers.debt(id));
    throwIfEnvelopeFailed(response.data);
    return { success: true, message: 'OK', data: unwrapEnvelope(response.data) };
  },

  async getPayments(id: number, params?: { current?: number; pageSize?: number }): Promise<CustomerPaymentsResponse> {
    const response = await api.get(ENDPOINTS.customers.payments(id), {
      params: params
        ? {
            page: params.current,
            per_page: params.pageSize,
          }
        : undefined,
    });
    const normalized = normalizeListEnvelope<CustomerPayment>(response.data);
    return { success: true, message: 'OK', data: { data: normalized.data, total: normalized.total } };
  },

  async getGroups(params?: { current?: number; pageSize?: number; keyword?: string }): Promise<CustomerGroupsResponse> {
    const response = await api.get(ENDPOINTS.customerGroups.base, {
      params: {
        page: params?.current,
        per_page: params?.pageSize,
        keyword: params?.keyword?.trim() || undefined,
      },
    });
    const normalized = normalizeListEnvelope<CustomerGroup>(response.data);
    return { success: true, message: 'OK', data: { data: normalized.data, total: normalized.total } };
  },

  async getPriceLists(id: number): Promise<CustomerPriceListsResponse> {
    const response = await api.get(ENDPOINTS.customers.priceLists(id));
    const normalized = normalizeListEnvelope<PriceList>(response.data);
    return { success: true, message: 'OK', data: { data: normalized.data, total: normalized.total } };
  },

  async createPriceList(id: number, payload: { name: string; effective_from: string; effective_to?: string; notes?: string }) {
    const response = await api.post(ENDPOINTS.customers.priceLists(id), payload);
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope(response.data);
  },

  async addPriceListItem(priceListId: number, payload: {
    route_template_id?: number;
    vehicle_type_id?: number;
    cargo_type_id?: number;
    price: number;
    price_unit: 'per_trip' | 'per_km' | 'per_ton';
    notes?: string;
  }) {
    const response = await api.post(ENDPOINTS.priceLists.items(priceListId), payload);
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope(response.data);
  },

  async getRouteTemplates(params?: { current?: number; pageSize?: number; keyword?: string }) {
    const response = await api.get(ENDPOINTS.routeTemplates.base, {
      params: {
        page: params?.current,
        per_page: params?.pageSize,
        keyword: params?.keyword?.trim() || undefined,
      },
    });
    const normalized = normalizeListEnvelope<{ id: number; name?: string }>(response.data);
    return { success: true, message: 'OK', data: { data: normalized.data, total: normalized.total } };
  },

  async getReconciliations(params?: { current?: number; pageSize?: number; customer_id?: number }): Promise<CustomerReconciliationResponse> {
    const response = await api.get(ENDPOINTS.reconciliations.base, {
      params: {
        page: params?.current,
        per_page: params?.pageSize,
        customer_id: params?.customer_id,
      },
    });
    const normalized = normalizeListEnvelope<ReconciliationSessionSummary>(response.data);
    return { success: true, message: 'OK', data: { data: normalized.data, total: normalized.total } };
  },

  async createPayment(id: number, data: StoreCustomerPaymentRequest): Promise<CustomerDetailResponse> {
    const response = await api.post(ENDPOINTS.customers.payments(id), data);
    throwIfEnvelopeFailed(response.data);
    return { success: true, message: 'OK', data: unwrapEnvelope(response.data) };
  },

  async deletePayment(paymentId: number): Promise<CustomerDetailResponse> {
    const response = await api.delete(ENDPOINTS.payments.byId(paymentId));
    throwIfEnvelopeFailed(response.data);
    return { success: true, message: 'OK', data: unwrapEnvelope(response.data) };
  },
};

export default customerService;