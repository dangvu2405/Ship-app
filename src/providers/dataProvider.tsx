import { DataProvider, BaseRecord, GetListParams, GetOneParams, CreateParams, UpdateParams, CrudFilter } from '@refinedev/core';
import simpleRestDataProvider from '@refinedev/simple-rest';
import { API_BASE_URL } from '@/utils/constants';
import api from '@/services/api';

function throwIfEnvelopeFailed(body: { success?: boolean; message?: string } | undefined): void {
  if (body && 'success' in body && body.success === false) {
    const err = new Error(body.message || 'Request failed') as Error & { response?: { data: unknown } };
    err.response = { data: body };
    throw err;
  }
}

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
    const body = response.data as { success?: boolean; data?: { data?: unknown[]; meta?: { total?: number } }; total?: number };

    throwIfEnvelopeFailed(body);

    // Backend format: { success, message, data: { data: [...], meta: { current_page, last_page, per_page, total } } }
    if (body?.data && Array.isArray(body.data.data)) {
      const total = body.data.meta?.total ?? body.data.data.length;
      return {
        data: body.data.data as TData[],
        total,
      };
    }

    if (Array.isArray(body)) {
      return { data: body as TData[], total: body.length };
    }

    return { data: [] as TData[], total: 0 };
  },
  
  getOne: async <TData extends BaseRecord = BaseRecord>(params: GetOneParams) => {
    const { resource, id } = params;
    const response = await api.get(`/${resource}/${id}`);
    const body = response.data as { success?: boolean; data?: unknown };
    throwIfEnvelopeFailed(body);
    return {
      data: (body?.data ?? response.data) as TData,
    };
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, never>>(params: CreateParams<TVariables>) => {
    const { resource, variables } = params;
    const response = await api.post(`/${resource}`, variables);
    const body = response.data as { success?: boolean; data?: unknown };
    throwIfEnvelopeFailed(body);
    return {
      data: (body?.data ?? response.data) as TData,
    };
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, never>>(params: UpdateParams<TVariables>) => {
    const { resource, id, variables } = params;
    const response = await api.put(`/${resource}/${id}`, variables);
    const body = response.data as { success?: boolean; data?: unknown };
    throwIfEnvelopeFailed(body);
    return {
      data: (body?.data ?? response.data) as TData,
    };
  },
  
  deleteOne: async <TData extends BaseRecord = BaseRecord>({ resource, id }: { resource: string; id: string | number }) => {
    await api.delete(`/${resource}/${id}`);
    return {
      data: { id } as TData,
    };
  },
};
