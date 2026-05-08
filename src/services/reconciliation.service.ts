import api from './api';
import { ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/types';

export interface ReconciliationSession {
  id: number;
  customer_id: number;
  customer?: { id: number; name?: string };
  period_from?: string;
  period_to?: string;
  status: 'draft' | 'confirmed' | 'locked' | string;
  total_amount?: number;
  adjusted_amount?: number;
  trips_count?: number;
  notes?: string | null;
  created_at?: string;
  confirmed_at?: string;
  locked_at?: string;
}

export interface ReconciliationItem {
  id: number;
  reconciliation_id: number;
  trip_id: number;
  trip_code?: string;
  scheduled_date?: string;
  start_point?: string;
  end_point?: string;
  original_amount?: number;
  adjusted_amount?: number;
  note?: string;
}

const reconciliationService = {
  async list(params: { customer_id?: number; status?: string; page?: number; per_page?: number } = {}) {
    const res = await api.get<ApiResponse<{ data: ReconciliationSession[]; total: number }>>(
      ENDPOINTS.reconciliations.base,
      { params },
    );
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<ReconciliationSession>>(ENDPOINTS.reconciliations.byId(id));
    return res.data;
  },

  async create(payload: {
    customer_id: number;
    period_from: string;
    period_to: string;
    notes?: string;
    auto_collect?: boolean;
  }) {
    const res = await api.post<ApiResponse<ReconciliationSession>>(ENDPOINTS.reconciliations.base, payload);
    return res.data;
  },

  async update(id: number, payload: Partial<ReconciliationSession>) {
    const res = await api.put<ApiResponse<ReconciliationSession>>(ENDPOINTS.reconciliations.byId(id), payload);
    return res.data;
  },

  async remove(id: number) {
    const res = await api.delete<ApiResponse<{ deleted: boolean }>>(ENDPOINTS.reconciliations.byId(id));
    return res.data;
  },

  async getItems(id: number) {
    const res = await api.get<ApiResponse<{ data: ReconciliationItem[] }>>(
      ENDPOINTS.reconciliationItems.items(id),
    );
    return res.data;
  },

  async addItem(id: number, payload: Partial<ReconciliationItem>) {
    const res = await api.post<ApiResponse<ReconciliationItem>>(
      ENDPOINTS.reconciliationItems.items(id),
      payload,
    );
    return res.data;
  },

  async updateItem(id: number, itemId: number, payload: Partial<ReconciliationItem>) {
    const res = await api.put<ApiResponse<ReconciliationItem>>(
      ENDPOINTS.reconciliationItems.itemById(id, itemId),
      payload,
    );
    return res.data;
  },

  async removeItem(id: number, itemId: number) {
    const res = await api.delete<ApiResponse<{ deleted: boolean }>>(
      ENDPOINTS.reconciliationItems.itemById(id, itemId),
    );
    return res.data;
  },

  async confirm(id: number) {
    const res = await api.patch<ApiResponse<ReconciliationSession>>(
      ENDPOINTS.reconciliationItems.confirm(id),
      {},
    );
    return res.data;
  },

  async lock(id: number) {
    const res = await api.patch<ApiResponse<ReconciliationSession>>(
      ENDPOINTS.reconciliationItems.lock(id),
      {},
    );
    return res.data;
  },
};

export default reconciliationService;
