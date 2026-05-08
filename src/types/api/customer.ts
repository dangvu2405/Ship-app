import type { ApiResponse, Customer, CustomerGroup, PaginatedResponse, Trip } from '@/types';
import type { CustomerType } from '@/types';

export type CustomerListParams = {
  current?: number;
  pageSize?: number;
  search?: string;
  type?: CustomerType;
  group_id?: number;
  status?: 'active' | 'inactive';
  include_deleted?: boolean;
};

export type CustomerPaymentMethod = 'cash' | 'bank_transfer' | 'credit';

export interface CustomerPayment {
  id: number;
  customer_id: number;
  amount: number;
  payment_method?: CustomerPaymentMethod | string | null;
  transaction_code?: string | null;
  payment_date?: string | null;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerDebtOverview {
  customer_id: number;
  customer_name?: string;
  credit_limit?: number | null;
  payment_terms_days?: number | null;
  total_debt?: number;
  overdue_debt?: number;
  paid_amount?: number;
  remaining_debt?: number;
  total_trips?: number;
  overdue_trips?: number;
  last_payment_date?: string | null;
}

export interface PriceListItem {
  id: number;
  route_template_id?: number | null;
  vehicle_type_id?: number | null;
  cargo_type_id?: number | null;
  price: number;
  price_unit: 'per_trip' | 'per_km' | 'per_ton' | string;
  notes?: string | null;
}

export interface PriceList {
  id: number;
  name: string;
  effective_from: string;
  effective_to?: string | null;
  is_active?: number | boolean;
  notes?: string | null;
  items?: PriceListItem[];
}

export interface ReconciliationSessionSummary {
  id: number;
  customer_id: number;
  period_from: string;
  period_to: string;
  total_trips: number;
  total_revenue: number;
  adjusted_amount: number;
  final_amount: number;
  status: 'draft' | 'confirmed' | 'locked' | string;
  confirmed_at?: string | null;
  notes?: string | null;
}

export type CustomerListResponse = ApiResponse<PaginatedResponse<Customer>>;
export type CustomerDetailResponse = ApiResponse<Customer>;
export type CustomerTripsResponse = ApiResponse<PaginatedResponse<Trip>>;
export type CustomerDebtResponse = ApiResponse<CustomerDebtOverview>;
export type CustomerPaymentsResponse = ApiResponse<PaginatedResponse<CustomerPayment>>;
export type CustomerGroupsResponse = ApiResponse<PaginatedResponse<CustomerGroup>>;
export type CustomerPriceListsResponse = ApiResponse<PaginatedResponse<PriceList>>;
export type CustomerReconciliationResponse = ApiResponse<PaginatedResponse<ReconciliationSessionSummary>>;
