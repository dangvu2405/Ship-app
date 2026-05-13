import api from './api';
import { ENDPOINTS } from './endpoints';
import { throwIfEnvelopeFailed, unwrapEnvelope } from './http';
import type { CostApprovalRequest, CostCategory, CreateTripCostPayload, TripCost } from '@/types/domain/cost';

type ListParams = { page?: number; per_page?: number; status?: string };

function parsePagedList<T>(body: unknown): { data: T[]; total: number } {
  throwIfEnvelopeFailed(body);
  const envelopeData = unwrapEnvelope<unknown>(body) as
    | T[]
    | { data?: T[]; meta?: { total?: number }; total?: number }
    | null
    | undefined;

  const metaTotal = (body as { meta?: { total?: number } })?.meta?.total;

  if (Array.isArray(envelopeData)) {
    return { data: envelopeData, total: metaTotal ?? envelopeData.length };
  }
  if (envelopeData && typeof envelopeData === 'object' && Array.isArray((envelopeData as { data: T[] }).data)) {
    const inner = envelopeData as { data: T[]; meta?: { total?: number }; total?: number };
    return {
      data: inner.data,
      total: inner.meta?.total ?? inner.total ?? metaTotal ?? inner.data.length,
    };
  }
  return { data: [], total: 0 };
}

class CostService {
  async listTripCosts(tripId: number, params?: ListParams): Promise<{ data: TripCost[]; total: number }> {
    const response = await api.get(ENDPOINTS.trips.costs(tripId), { params });
    return parsePagedList<TripCost>(response.data);
  }

  async createTripCost(
    tripId: number,
    payload: CreateTripCostPayload,
    receiptFile?: File | null,
  ): Promise<TripCost> {
    if (receiptFile instanceof File) {
      const fd = new FormData();
      fd.append('cost_category_id', String(payload.cost_category_id));
      fd.append('amount', String(payload.amount));
      fd.append('incurred_date', payload.incurred_date);
      if (payload.description) fd.append('description', payload.description);
      if (payload.norm_amount != null && Number.isFinite(payload.norm_amount)) {
        fd.append('norm_amount', String(payload.norm_amount));
      }
      fd.append('receipt_file', receiptFile);
      const response = await api.post(ENDPOINTS.trips.costs(tripId), fd);
      throwIfEnvelopeFailed(response.data);
      return unwrapEnvelope<TripCost>(response.data);
    }

    const response = await api.post(ENDPOINTS.trips.costs(tripId), payload);
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<TripCost>(response.data);
  }

  async listCostApprovals(params?: ListParams): Promise<{ data: CostApprovalRequest[]; total: number }> {
    const response = await api.get(ENDPOINTS.costApprovals.base, { params });
    return parsePagedList<CostApprovalRequest>(response.data);
  }

  async approveCostApproval(id: number): Promise<CostApprovalRequest> {
    const response = await api.patch(ENDPOINTS.costApprovals.approve(id), {});
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<CostApprovalRequest>(response.data);
  }

  async rejectCostApproval(id: number, reviewNote: string): Promise<CostApprovalRequest> {
    const response = await api.patch(ENDPOINTS.costApprovals.reject(id), { review_note: reviewNote });
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<CostApprovalRequest>(response.data);
  }

  async listCostCategories(params?: ListParams): Promise<{ data: CostCategory[]; total: number }> {
    const response = await api.get(ENDPOINTS.costCategories.base, {
      params: { ...params, per_page: params?.per_page ?? 200 },
    });
    return parsePagedList<CostCategory>(response.data);
  }
}

const costService = new CostService();
export default costService;
