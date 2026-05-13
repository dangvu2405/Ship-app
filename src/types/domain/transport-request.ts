import type { BaseRecord } from '@refinedev/core';
import type { Customer } from './employee';
import type { User } from './user';

export type TransportRequestStatus = 
  | 'new'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | string;

export interface TransportRequest extends BaseRecord {
  id: number;
  company_id?: number;
  customer_id: number;
  created_by?: number | null;
  code: string;
  pickup_location?: string | null;
  delivery_location?: string | null;
  cargo_type?: string | null;
  requested_delivery_date?: string | null;
  status: TransportRequestStatus;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  customer?: Customer;
  creator?: User;
}

export interface StoreTransportRequestPayload {
  customer_id: number;
  pickup_location?: string;
  delivery_location?: string;
  cargo_type?: string;
  requested_delivery_date?: string;
}

export type UpdateTransportRequestPayload = Partial<StoreTransportRequestPayload> & {
  status?: TransportRequestStatus;
};