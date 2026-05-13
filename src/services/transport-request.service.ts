import api from './api';
import { throwIfEnvelopeFailed, unwrapEnvelope, unwrapList } from './http';
import type { ApiListPayload } from './http/types';
import type {
  TransportRequest,
  StoreTransportRequestPayload,
  UpdateTransportRequestPayload,
} from '@/types/domain/transport-request';

class TransportRequestService {
  private readonly base = '/transport-requests';

  async getList(params?: Record<string, unknown>): Promise<ApiListPayload<TransportRequest>> {
    const response = await api.get(this.base, { params });
    return unwrapList<TransportRequest>(response.data);
  }

  async getById(id: number | string): Promise<TransportRequest> {
    const response = await api.get(`${this.base}/${id}`);
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<TransportRequest>(response.data);
  }

  async create(payload: StoreTransportRequestPayload): Promise<TransportRequest> {
    const response = await api.post(this.base, payload);
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<TransportRequest>(response.data);
  }

  async update(id: number | string, payload: UpdateTransportRequestPayload): Promise<TransportRequest> {
    const response = await api.put(`${this.base}/${id}`, payload);
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<TransportRequest>(response.data);
  }

  async delete(id: number | string): Promise<void> {
    const response = await api.delete(`${this.base}/${id}`);
    throwIfEnvelopeFailed(response.data);
  }
}

export const transportRequestService = new TransportRequestService();
export default transportRequestService;