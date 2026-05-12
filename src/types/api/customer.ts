import type { ApiResponse, Customer, PaginatedResponse, Trip } from '@/types';
import type { CustomerType } from '@/types';

export type CustomerListParams = {
  current?: number;
  pageSize?: number;
  search?: string;
  type?: CustomerType;
  group_id?: number;
  status?: string;
  include_deleted?: boolean;
};

export type CustomerPaymentMethod = 'cash' | 'bank_transfer' | 'credit';

export interface CustomerPayment {
  id: number;
  customer_id: number;
  amount: number;
  payment_method?: CustomerPaymentMethod | string | null;
  payment_date?: string | null;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerDebtOverview {
  customer_id: number;
  total_debt?: number;
  overdue_debt?: number;
  paid_amount?: number;
  remaining_debt?: number;
  total_trips?: number;
  overdue_trips?: number;
}

export interface CustomerGroupItem {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
}

export interface PriceList {
  id: number;
  customer_id: number;
  name: string;
  effective_from: string;
  effective_to?: string | null;
  notes?: string | null;
}

export interface PriceListItem {
  id: number;
  price_list_id: number;
  route_template_id?: number | null;
  vehicle_type_id?: number | null;
  cargo_type_id?: number | null;
  price: number;
  price_unit: 'per_trip' | 'per_km' | 'per_ton';
  notes?: string | null;
}

export interface ReconciliationSessionSummary {
  id: number;
  customer_id: number;
  period_from?: string | null;
  period_to?: string | null;
  status?: string | null;
  total_amount?: number | null;
  created_at?: string;
}

export type CustomerListResponse = ApiResponse<PaginatedResponse<Customer>>;
export type CustomerDetailResponse = ApiResponse<Customer>;
export type CustomerTripsResponse = ApiResponse<PaginatedResponse<Trip>>;
export type CustomerDebtResponse = ApiResponse<CustomerDebtOverview>;
export type CustomerPaymentsResponse = ApiResponse<PaginatedResponse<CustomerPayment>>;
export type CustomerGroupsResponse = ApiResponse<PaginatedResponse<CustomerGroupItem>>;
export type CustomerPriceListsResponse = ApiResponse<PriceList[]>;
export type CustomerPriceListResponse = ApiResponse<PriceList>;
export type CustomerPriceListItemResponse = ApiResponse<PriceListItem>;
export type ReconciliationListResponse = ApiResponse<PaginatedResponse<ReconciliationSessionSummary>>;
