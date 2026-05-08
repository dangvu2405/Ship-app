import { DataProvider, BaseRecord, GetListParams, GetOneParams, CreateParams, UpdateParams, CrudFilter, type CustomParams } from '@refinedev/core';
import simpleRestDataProvider from '@refinedev/simple-rest';
import { API_BASE_URL } from '@/utils/constants';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import { throwIfEnvelopeFailed, unwrapEnvelope } from '@/services/http';
import costService from '@/services/cost.service';


// === Alias: resource name frontend → resource name backend (api.php) ===
const RESOURCE_ALIASES: Record<string, string> = {
  'admin-companies': 'admin/companies',
  // Kế toán
  'reconciliations': 'reconciliation-sessions',
  'payments': 'payment-records',
  // Điều vận / Lịch làm việc
  'work-schedules': 'driver-work-schedules',
  'driver-schedules': 'driver-work-schedules',
  // Đơn hàng
  'trip-stops': 'trip-routes',
  'trip-surcharges': 'trip-costs',
  // Nghỉ phép
  'leave': 'leave-requests',
  // Underscore variants → hyphen (backend dùng hyphen nhất quán)
  'cargo_types': 'cargo-types',
  'vehicle_types': 'vehicle-types',
  'route_templates': 'route-templates',
  'vehicle_type_catalogs': 'vehicle-types',
  'price_lists': 'price-lists',
  'price_list_items': 'price-list-items',
  'driver_teams': 'driver-teams',
  'driver_documents': 'driver-documents',
  'vehicle_documents': 'vehicle-documents',
  'vehicle_assignments': 'vehicle-assignments',
  'trip_costs': 'trip-costs',
  'trip_routes': 'trip-routes',
  'trip_documents': 'trip-documents',
  'trip_status_histories': 'trip-status-histories',
  'leave_requests': 'leave-requests',
  'leave_types': 'leave-types',
  'driver_work_schedules': 'driver-work-schedules',
  'maintenance_schedules': 'maintenance-schedules',
  'maintenance_records': 'maintenance-records',
  'reconciliation_sessions': 'reconciliation-sessions',
  'reconciliation_items': 'reconciliation-items',
  'payment_records': 'payment-records',
  'customer_groups': 'customer-groups',
  'order_status_configs': 'order-status-configs',
  'cost_categories': 'cost-categories',
  // vehicle_expenses → trip-costs (table vehicle_expenses chưa có dữ liệu, dùng trip-costs thay thế)
  'vehicle_expenses': 'trip-costs',
};

// === Resources hoàn toàn CHƯA có trong Backend (spec chưa implement) → trả rỗng ===
const NOT_IMPLEMENTED_RESOURCES = new Set([
  'trip-bonus-rules',
  'attendance',
  'attendances',
  'public-holidays',
  'cost-approvals',
  'chat-messages',
  'knowledge-articles',
  'debt-overview',
]);

// === Fallback: nếu resource chính 404 thử resource phụ ===
const LEGACY_LIST_FALLBACKS: Record<string, string[]> = {};


const resolveApiResource = (resource: string) => {
  const alias = RESOURCE_ALIASES[resource] ?? resource;
  return alias.replace(/_/g, '-');
};

// Custom data provider that uses our axios instance
export const dataProvider: DataProvider = {
  ...simpleRestDataProvider(API_BASE_URL),

  getList: async <TData extends BaseRecord = BaseRecord>(params: GetListParams) => {
    const { resource, pagination, filters, sorters, meta } = params;
    const { current = 1, pageSize = 15 } = pagination ?? {};
    const perPage = Math.min(Math.max(1, pageSize), 100);

    if (resource === 'trip-costs') {
      const tripId = (meta as { tripId?: number } | undefined)?.tripId;
      if (tripId == null) {
        throw new Error('trip-costs list requires meta.tripId');
      }
      const { data, total } = await costService.listTripCosts(tripId, {
        page: current,
        per_page: perPage,
      });
      return { data: data as unknown as TData[], total };
    }

    if (resource === 'leave-requests') {
      const queryParams: Record<string, unknown> = {
        page: current,
        per_page: perPage,
      };
      if (filters && filters.length > 0) {
        filters.forEach((filter: CrudFilter) => {
          if ('field' in filter && 'value' in filter && filter.value !== undefined && filter.value !== '') {
            queryParams[filter.field as string] = filter.value;
          }
        });
      }

      try {
        const response = await api.get(ENDPOINTS.leaveOps.base, { params: queryParams });
        const body = response.data as any;
        throwIfEnvelopeFailed(body);
        const envelopeData = unwrapEnvelope<any>(body);
        if (Array.isArray(envelopeData)) {
          return { data: envelopeData as TData[], total: body.meta?.total ?? envelopeData.length };
        }
        if (envelopeData && Array.isArray(envelopeData.data)) {
          return {
            data: envelopeData.data as TData[],
            total: envelopeData.meta?.total ?? body.meta?.total ?? envelopeData.data.length,
          };
        }
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status !== 404) {
          throw error;
        }
        const fallback = await api.get(ENDPOINTS.workforce.leaveRequests, { params: queryParams });
        const fallbackBody = fallback.data as any;
        throwIfEnvelopeFailed(fallbackBody);
        const fallbackData = unwrapEnvelope<any>(fallbackBody);
        if (Array.isArray(fallbackData)) {
          return { data: fallbackData as TData[], total: fallbackBody.meta?.total ?? fallbackData.length };
        }
        if (fallbackData && Array.isArray(fallbackData.data)) {
          return {
            data: fallbackData.data as TData[],
            total: fallbackData.meta?.total ?? fallbackBody.meta?.total ?? fallbackData.data.length,
          };
        }
      }

      throw new Error('Invalid list payload for resource "leave-requests"');
    }

    const queryParams: Record<string, unknown> = {
      page: current,
      per_page: perPage,
    };

    if (filters && filters.length > 0) {
      filters.forEach((filter: CrudFilter) => {
        if ('field' in filter && 'value' in filter && filter.value !== undefined && filter.value !== '') {
          const field = filter.field as string;
          const key = field === 'q' || field === 'search' ? 'keyword' : field;
          queryParams[key] = filter.value;
        }
      });
    }

    if (sorters && sorters.length > 0) {
      const sorter = sorters[0];
      if ('field' in sorter) {
        queryParams.sort_by = sorter.field;
        queryParams.sort_order = sorter.order === 'desc' ? 'desc' : 'asc';
      }
    }

    const apiResource = resolveApiResource(resource);

    // Silently return empty for resources not yet implemented in backend
    if (NOT_IMPLEMENTED_RESOURCES.has(resource)) {
      return { data: [] as unknown as TData[], total: 0 };
    }

    let body: any;
    try {
      const response = await api.get(`/${apiResource}`, { params: queryParams });
      body = response.data as any;
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 403) {
        const candidates = LEGACY_LIST_FALLBACKS[resource] ?? [];
        for (const candidate of candidates) {
          try {
            const fallbackResponse = await api.get(`/${candidate}`, { params: queryParams });
            body = fallbackResponse.data as any;
            break;
          } catch (fallbackError) {
            const fallbackStatus = (fallbackError as { response?: { status?: number } })?.response?.status;
            if (fallbackStatus !== 404) {
              throw fallbackError;
            }
          }
        }
        if (!body) {
          return { data: [], total: 0 };
        }
      } else {
        throw error;
      }
    }
    throwIfEnvelopeFailed(body);

    let listData: TData[] = [];
    let total = 0;

    const envelopeData = unwrapEnvelope<any>(body);

    if (Array.isArray(envelopeData)) {
      listData = envelopeData;
      total = body.meta?.total ?? envelopeData.length;
    } else if (envelopeData && Array.isArray(envelopeData.data)) {
      listData = envelopeData.data;
      total = envelopeData.meta?.total ?? body.meta?.total ?? envelopeData.data.length;
    } else {
      throw new Error(`Invalid list payload for resource "${resource}"`);
    }

    return {
      data: listData,
      total,
    };
  },

  getOne: async <TData extends BaseRecord = BaseRecord>(params: GetOneParams) => {
    const { resource, id } = params;
    const apiResource = resolveApiResource(resource);
    const response = await api.get(`/${apiResource}/${id}`);
    const body = response.data as { success?: boolean; data?: unknown };
    throwIfEnvelopeFailed(body);
    return {
      data: unwrapEnvelope<TData>(response.data),
    };
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, never>>(params: CreateParams<TVariables>) => {
    const { resource, variables, meta } = params;

    if (resource === 'trip-costs') {
      const tripId = (meta as { tripId?: number } | undefined)?.tripId;
      if (tripId == null) {
        throw new Error('trip-costs create requires meta.tripId');
      }
      const v = variables as Record<string, unknown>;
      const receiptFile = v.receipt_file instanceof File ? v.receipt_file : null;
      const payload = {
        cost_category_id: Number(v.cost_category_id),
        amount: Number(v.amount),
        incurred_date: String(v.incurred_date),
        description: v.description != null ? String(v.description) : undefined,
        norm_amount: v.norm_amount != null && v.norm_amount !== '' ? Number(v.norm_amount) : undefined,
      };
      const data = await costService.createTripCost(tripId, payload, receiptFile);
      return { data: data as unknown as TData };
    }

    const apiResource = resolveApiResource(resource);
    const response = await api.post(`/${apiResource}`, variables);
    const body = response.data as { success?: boolean; data?: unknown };
    throwIfEnvelopeFailed(body);
    return {
      data: unwrapEnvelope<TData>(response.data),
    };
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, never>>(params: UpdateParams<TVariables>) => {
    const { resource, id, variables } = params;
    const apiResource = resolveApiResource(resource);
    const response = await api.put(`/${apiResource}/${id}`, variables);
    const body = response.data as { success?: boolean; data?: unknown };
    throwIfEnvelopeFailed(body);
    return {
      data: unwrapEnvelope<TData>(response.data),
    };
  },
  
  deleteOne: async <TData extends BaseRecord = BaseRecord>({ resource, id }: { resource: string; id: string | number }) => {
    const apiResource = resolveApiResource(resource);
    await api.delete(`/${apiResource}/${id}`);
    return {
      data: { id } as TData,
    };
  },

  custom: async <TData extends BaseRecord = BaseRecord>(params: CustomParams) => {
    const { url, method, payload, query, headers } = params;
    let body: unknown;
    try {
      const response = await api.request<unknown>({
        url,
        method: method as string,
        params: query,
        data: payload,
        headers,
      });
      body = response.data;
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403 || status === 404) {
        return { data: {} as TData };
      }
      throw error;
    }
    throwIfEnvelopeFailed(body);
    return {
      data: unwrapEnvelope<TData>(body),
    };
  },
};
