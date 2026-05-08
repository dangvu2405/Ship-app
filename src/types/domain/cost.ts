import type { BaseRecord } from '@refinedev/core';

export type TripCostStatus = 'pending' | 'approved' | 'rejected';

export const TripCostStatuses = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const satisfies Record<TripCostStatus, TripCostStatus>;

export interface CostCategory {
  id: number;
  company_id?: number;
  code: string;
  name: string;
  requires_receipt: number | boolean;
  approval_threshold: number | null;
  is_active?: number | boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface TripCost extends BaseRecord {
  id: number;
  company_id?: number;
  trip_id: number;
  cost_category_id: number;
  amount: number;
  norm_amount?: number | null;
  description?: string | null;
  receipt_file_url?: string | null;
  incurred_date: string;
  status: TripCostStatus;
  approval_required?: number | boolean;
  approved_by?: number | null;
  approved_at?: string | null;
  approval_note?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  cost_category?: CostCategory;
}

export interface CostApprovalRequest extends BaseRecord {
  id: number;
  company_id?: number;
  trip_id: number;
  trip_cost_id?: number | null;
  requested_by: number;
  total_amount: number;
  reason: string;
  status: TripCostStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  created_at?: string;
  updated_at?: string;
  trip?: { id: number; code?: string };
  requester?: { id: number; name?: string; username?: string; email?: string };
  trip_cost?: TripCost;
  cost_category?: CostCategory;
}

export interface CreateTripCostPayload {
  cost_category_id: number;
  amount: number;
  incurred_date: string;
  description?: string;
  norm_amount?: number | null;
}
