import type { ApiResponse, Customer, PaginatedResponse, Trip } from '@/types';
import type { CustomerType } from '@/types';

export type CustomerListParams = {
  current?: number;
  pageSize?: number;
  search?: string;
  type?: CustomerType;
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

export type CustomerListResponse = ApiResponse<PaginatedResponse<Customer>>;
export type CustomerDetailResponse = ApiResponse<Customer>;
export type CustomerTripsResponse = ApiResponse<PaginatedResponse<Trip>>;
export type CustomerDebtResponse = ApiResponse<CustomerDebtOverview>;
export type CustomerPaymentsResponse = ApiResponse<PaginatedResponse<CustomerPayment>>;
