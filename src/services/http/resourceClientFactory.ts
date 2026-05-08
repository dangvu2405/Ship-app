import type { AxiosInstance } from 'axios';
import { unwrapEnvelope, unwrapList } from './envelope';
import type { ApiListPayload } from './types';

export interface ResourceClientConfig {
  resource: string;
  http: AxiosInstance;
}

export function createResourceClient<TItem, TCreate = Partial<TItem>, TUpdate = Partial<TItem>>(
  config: ResourceClientConfig,
) {
  const basePath = `/${config.resource}`;

  return {
    async getList(params?: Record<string, unknown>): Promise<ApiListPayload<TItem>> {
      const response = await config.http.get(basePath, { params });
      return unwrapList<TItem>(response.data);
    },
    async getById(id: string | number): Promise<TItem> {
      const response = await config.http.get(`${basePath}/${id}`);
      return unwrapEnvelope<TItem>(response.data);
    },
    async create(payload: TCreate): Promise<TItem> {
      const response = await config.http.post(basePath, payload);
      return unwrapEnvelope<TItem>(response.data);
    },
    async update(id: string | number, payload: TUpdate): Promise<TItem> {
      const response = await config.http.put(`${basePath}/${id}`, payload);
      return unwrapEnvelope<TItem>(response.data);
    },
    async remove(id: string | number): Promise<void> {
      const response = await config.http.delete(`${basePath}/${id}`);
      unwrapEnvelope<unknown>(response.data);
    },
  };
}
