import type { ApiResponse, Customer, PaginatedResponse, Trip } from '@/types';
import type { CustomerType } from '@/types';

export type CustomerListParams = {
  current?: number;
  pageSize?: number;
  search?: string;
  type?: CustomerType;
  group_id?: number | string;
  status?: string;
  include_deleted?: boolean;
};

export interface ReconciliationSessionSummary {
  id: number;
  customer_id: number;
  total_amount?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

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

export interface PriceListItem {
  id: number;
  price_list_id: number;
  price: number;
  price_unit: 'per_trip' | 'per_km' | 'per_ton';
  notes?: string | null;
}

export interface PriceList {
  id: number;
  customer_id: number;
  name: string;
  effective_from: string;
  effective_to?: string | null;
  notes?: string | null;
  items?: PriceListItem[];
}

export type CustomerListResponse = ApiResponse<PaginatedResponse<Customer>>;
export type CustomerDetailResponse = ApiResponse<Customer>;
export type CustomerTripsResponse = ApiResponse<PaginatedResponse<Trip>>;
export type CustomerDebtResponse = ApiResponse<CustomerDebtOverview>;
export type CustomerPaymentsResponse = ApiResponse<PaginatedResponse<CustomerPayment>>;
export type CustomerPriceListsResponse = ApiResponse<PriceList[]>;
export type PriceListDetailResponse = ApiResponse<PriceList>;
export type PriceListItemDetailResponse = ApiResponse<PriceListItem>;
