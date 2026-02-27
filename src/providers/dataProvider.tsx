import { DataProvider, BaseRecord } from '@refinedev/core';
import simpleRestDataProvider from '@refinedev/simple-rest';
import { API_BASE_URL } from '@/utils/constants';
import api from '@/services/api';

// Custom data provider that uses our axios instance
export const dataProvider: DataProvider = {
  ...simpleRestDataProvider(API_BASE_URL),
  
  getList: async ({ resource, pagination, filters, sorters }) => {
    const { current = 1, pageSize = 15 } = pagination ?? {};
    const perPage = Math.min(Math.max(1, pageSize), 100);

    const params: Record<string, unknown> = {
      page: current,
      per_page: perPage,
    };

    // Backend expects direct query params: office_id, status, keyword, etc.
    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        if ('field' in filter && 'value' in filter && filter.value !== undefined && filter.value !== '') {
          const key = filter.field === 'q' ? 'keyword' : (filter.field as string);
          params[key] = filter.value;
        }
      });
    }

    // Backend: sort_by, sort_order (asc|desc)
    if (sorters && sorters.length > 0) {
      const sorter = sorters[0];
      if ('field' in sorter) {
        params.sort_by = sorter.field;
        params.sort_order = sorter.order === 'desc' ? 'desc' : 'asc';
      }
    }

    const response = await api.get(`/${resource}`, { params });
    const body = response.data as { success?: boolean; data?: { data?: unknown[]; meta?: { total?: number } }; total?: number };

    // Backend format: { success, message, data: { data: [...], meta: { current_page, last_page, per_page, total } } }
    if (body?.data && Array.isArray(body.data.data)) {
      const total = body.data.meta?.total ?? body.data.data.length;
      return {
        data: body.data.data,
        total,
      };
    }

    if (Array.isArray(body)) {
      return { data: body, total: body.length };
    }

    return { data: [], total: 0 };
  },
  
  getOne: async ({ resource, id }) => {
    const response = await api.get(`/${resource}/${id}`);
    const body = response.data as { data?: unknown };
    return {
      data: body?.data ?? (response.data as unknown),
    };
  },

  create: async ({ resource, variables }) => {
    const response = await api.post(`/${resource}`, variables);
    const body = response.data as { data?: unknown };
    return {
      data: body?.data ?? (response.data as unknown),
    };
  },

  update: async ({ resource, id, variables }) => {
    const response = await api.put(`/${resource}/${id}`, variables);
    const body = response.data as { data?: unknown };
    return {
      data: body?.data ?? (response.data as unknown),
    };
  },
  
  deleteOne: async <TData extends BaseRecord = BaseRecord>({ resource, id }: { resource: string; id: string | number }) => {
    await api.delete(`/${resource}/${id}`);
    return {
      data: { id } as TData,
    };
  },
};
