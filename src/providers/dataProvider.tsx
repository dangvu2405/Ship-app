import { DataProvider, BaseRecord, GetListParams, GetOneParams, CreateParams, UpdateParams, CrudFilter } from '@refinedev/core';
import simpleRestDataProvider from '@refinedev/simple-rest';
import { API_BASE_URL } from '@/utils/constants';
import api from '@/services/api';
import { throwIfEnvelopeFailed, unwrapEnvelope } from '@/services/http';
import type { ApiListPayload } from '@/services/http/types';

// Custom data provider that uses our axios instance
export const dataProvider: DataProvider = {
  ...simpleRestDataProvider(API_BASE_URL),
  
  getList: async <TData extends BaseRecord = BaseRecord>(params: GetListParams) => {
    const { resource, pagination, filters, sorters } = params;
    const { current = 1, pageSize = 15 } = pagination ?? {};
    const perPage = Math.min(Math.max(1, pageSize), 100);

    const queryParams: Record<string, unknown> = {
      page: current,
      per_page: perPage,
    };

    // Backend expects direct query params: office_id, status, keyword, etc.
    if (filters && filters.length > 0) {
      filters.forEach((filter: CrudFilter) => {
        if ('field' in filter && 'value' in filter && filter.value !== undefined && filter.value !== '') {
          const field = filter.field as string;
          const key = field === 'q' || field === 'search' ? 'keyword' : field;
          queryParams[key] = filter.value;
        }
      });
    }

    // Backend: sort_by, sort_order (asc|desc)
    if (sorters && sorters.length > 0) {
      const sorter = sorters[0];
      if ('field' in sorter) {
        queryParams.sort_by = sorter.field;
        queryParams.sort_order = sorter.order === 'desc' ? 'desc' : 'asc';
      }
    }

    const response = await api.get(`/${resource}`, { params: queryParams });
    const body = response.data as unknown;
    throwIfEnvelopeFailed(body);
    const payload = unwrapEnvelope<ApiListPayload<TData>>(body);
    if (!payload || !Array.isArray(payload.data)) {
      throw new Error(`Invalid list payload for resource "${resource}"`);
    }
    return {
      data: payload.data,
      total: payload.meta?.total ?? payload.data.length,
    };
  },
  
  getOne: async <TData extends BaseRecord = BaseRecord>(params: GetOneParams) => {
    const { resource, id } = params;
    const response = await api.get(`/${resource}/${id}`);
    const body = response.data as { success?: boolean; data?: unknown };
    throwIfEnvelopeFailed(body);
    return {
      data: unwrapEnvelope<TData>(response.data),
    };
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, never>>(params: CreateParams<TVariables>) => {
    const { resource, variables } = params;
    const response = await api.post(`/${resource}`, variables);
    const body = response.data as { success?: boolean; data?: unknown };
    throwIfEnvelopeFailed(body);
    return {
      data: unwrapEnvelope<TData>(response.data),
    };
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, never>>(params: UpdateParams<TVariables>) => {
    const { resource, id, variables } = params;
    const response = await api.put(`/${resource}/${id}`, variables);
    const body = response.data as { success?: boolean; data?: unknown };
    throwIfEnvelopeFailed(body);
    return {
      data: unwrapEnvelope<TData>(response.data),
    };
  },
  
  deleteOne: async <TData extends BaseRecord = BaseRecord>({ resource, id }: { resource: string; id: string | number }) => {
    await api.delete(`/${resource}/${id}`);
    return {
      data: { id } as TData,
    };
  },
};
