import { DataProvider, BaseRecord, GetListParams, GetOneParams, CreateParams, UpdateParams, CrudFilter, type CustomParams } from '@refinedev/core';
import simpleRestDataProvider from '@refinedev/simple-rest';
import { API_BASE_URL } from '@/utils/constants';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import { throwIfEnvelopeFailed, unwrapEnvelope } from '@/services/http';
import costService from '@/services/cost.service';
import { RESOURCE_ALIASES, NOT_IMPLEMENTED_RESOURCES, LEGACY_LIST_FALLBACKS } from '@/constants/resourceAliases';

type ApiErrorLike = { response?: { status?: number } };
type EnvelopeLike<T> = {
  success?: boolean;
  message?: string;
  data?: T | { data?: T; meta?: { total?: number } };
  meta?: { total?: number };
};

// Runtime tracking: resources that were unavailable at 404 to avoid repeated spam requests
const RUNTIME_UNAVAILABLE_LIST_RESOURCES = new Set<string>();
const DISABLED_LIST_RESOURCES = new Set(
  String(import.meta.env.VITE_DISABLED_LIST_RESOURCES ?? '')
    .split(',')
    .map((value: string) => value.trim())
    .filter(Boolean),
);


const resolveApiResource = (resource: string) => {
  const alias = (RESOURCE_ALIASES as Record<string, string>)[resource] ?? resource;
  return alias.replace(/_/g, '-');
};

const isUnavailableStatus = (status?: number) => status === 403 || status === 404;

const buildListQueryParams = (
  current: number,
  perPage: number,
  filters?: CrudFilter[],
  sorters?: GetListParams['sorters'],
) => {
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

  return queryParams;
};

const parseEnvelopeList = <TData extends BaseRecord>(resource: string, body: EnvelopeLike<TData[]>): { data: TData[]; total: number } => {
  throwIfEnvelopeFailed(body);
  const envelopeData = unwrapEnvelope<unknown>(body);

  if (Array.isArray(envelopeData)) {
    return {
      data: envelopeData as TData[],
      total: body.meta?.total ?? envelopeData.length,
    };
  }

  if (envelopeData && typeof envelopeData === 'object' && Array.isArray((envelopeData as { data?: unknown }).data)) {
    const nested = envelopeData as { data: TData[]; meta?: { total?: number } };
    return {
      data: nested.data,
      total: nested.meta?.total ?? body.meta?.total ?? nested.data.length,
    };
  }

  throw new Error(`Invalid list payload for resource "${resource}"`);
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

    const queryParams = buildListQueryParams(current, perPage, filters, sorters);

    const apiResource = resolveApiResource(resource);

// Silently return empty for resources not yet implemented in backend.
    // Logs when a resource is returned as unavailable for better debugging.
    if (NOT_IMPLEMENTED_RESOURCES.has(resource)) {
      console.debug(`[DataProvider] Resource "${resource}" not implemented - returning empty list`);
      return { data: [] as unknown as TData[], total: 0 };
    }
    // Optional runtime override for environments with partial backend route availability.
    if (DISABLED_LIST_RESOURCES.has(resource)) {
      return { data: [] as unknown as TData[], total: 0 };
    }
    // Cache unavailable resources at runtime to avoid repeated 404/403 spam on polling/re-render.
    if (RUNTIME_UNAVAILABLE_LIST_RESOURCES.has(resource)) {
      return { data: [] as unknown as TData[], total: 0 };
    }

    let body: EnvelopeLike<TData[]> | undefined;
    try {
      const response = await api.get<EnvelopeLike<TData[]>>(`/${apiResource}`, { params: queryParams });
      body = response.data;
    } catch (error) {
      const status = (error as ApiErrorLike)?.response?.status;
      if (isUnavailableStatus(status)) {
        const candidates = LEGACY_LIST_FALLBACKS[resource] ?? [];
        for (const candidate of candidates) {
          try {
            const fallbackResponse = await api.get<EnvelopeLike<TData[]>>(`/${candidate}`, { params: queryParams });
            body = fallbackResponse.data;
            break;
          } catch (fallbackError) {
            const fallbackStatus = (fallbackError as ApiErrorLike)?.response?.status;
            if (fallbackStatus !== 404) {
              throw fallbackError;
            }
          }
        }
        if (!body) {
          RUNTIME_UNAVAILABLE_LIST_RESOURCES.add(resource);
          return { data: [], total: 0 };
        }
      } else {
        throw error;
      }
    }
    if (!body) {
      throw new Error(`Empty response body for resource "${resource}"`);
    }
    RUNTIME_UNAVAILABLE_LIST_RESOURCES.delete(resource);
    const { data: listData, total } = parseEnvelopeList<TData>(resource, body);

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
      const status = (error as ApiErrorLike)?.response?.status;
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
