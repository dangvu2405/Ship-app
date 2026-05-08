import api from './api';
import { ENDPOINTS } from './endpoints';
import { throwIfEnvelopeFailed, unwrapEnvelope } from './http';
import type { SalaryAdjustment, SalaryAdjustmentType } from '@/types/domain/payroll';

type ListParams = {
  page?: number;
  per_page?: number;
  month?: number;
  year?: number;
  payroll_id?: number;
  driver_id?: number;
};

function parseList(body: unknown): { data: SalaryAdjustment[]; total: number } {
  throwIfEnvelopeFailed(body);
  const inner = unwrapEnvelope<unknown>(body) as
    | SalaryAdjustment[]
    | { data?: SalaryAdjustment[]; meta?: { total?: number } }
    | null
    | undefined;
  const metaTotal = (body as { meta?: { total?: number } })?.meta?.total;
  if (Array.isArray(inner)) {
    return { data: inner, total: metaTotal ?? inner.length };
  }
  if (inner && typeof inner === 'object' && Array.isArray((inner as { data: SalaryAdjustment[] }).data)) {
    const box = inner as { data: SalaryAdjustment[]; meta?: { total?: number } };
    return { data: box.data, total: box.meta?.total ?? metaTotal ?? box.data.length };
  }
  return { data: [], total: 0 };
}

export interface CreateSalaryAdjustmentPayload {
  type: SalaryAdjustmentType;
  amount: number;
  reason: string;
  applied_date: string;
  payroll_id?: number;
  driver_id?: number;
  employee_id?: number;
}

class SalaryAdjustmentService {
  async list(params?: ListParams): Promise<{ data: SalaryAdjustment[]; total: number }> {
    const response = await api.get(ENDPOINTS.salaryAdjustments.base, { params });
    return parseList(response.data);
  }

  async create(payload: CreateSalaryAdjustmentPayload): Promise<SalaryAdjustment> {
    const response = await api.post(ENDPOINTS.salaryAdjustments.base, payload);
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<SalaryAdjustment>(response.data);
  }

  async cancel(id: number): Promise<SalaryAdjustment> {
    const response = await api.patch(ENDPOINTS.salaryAdjustments.cancel(id), {});
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<SalaryAdjustment>(response.data);
  }
}

export default new SalaryAdjustmentService();
