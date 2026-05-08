export type StoreTripRequest = {
  code?: string;
  company_id?: number;
  customer_id: number;
  contact_name?: string;
  contact_phone?: string;
  cargo_type_id?: number | null;
  cargo_description?: string;
  cargo_quantity?: number | null;
  cargo_unit?: string | null;
  cargo_weight_ton?: number | null;
  cargo_notes?: string;
  driver_id?: number;
  vehicle_id?: number;
  dispatcher_id?: number | null;
  assigned_at?: string | null;
  route_template_id?: number | null;
  origin_location_id?: number | null;
  destination_location_id?: number | null;
  start_point: string;
  end_point: string;
  received_date?: string | null;
  scheduled_date?: string | null;
  scheduled_time_from?: string | null;
  scheduled_time_to?: string | null;
  distance_km?: number;
  actual_distance_km?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  actual_pickup_at?: string | null;
  actual_delivered_at?: string | null;
  base_price?: number | null;
  surcharge_amount?: number | null;
  total_revenue?: number | null;
  payment_method?: 'bank_transfer' | 'cash' | 'credit' | null;
  payment_status?: 'unpaid' | 'invoiced' | 'paid';
  status: string;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: number | null;
  internal_notes?: string | null;
};

export type UpdateTripRequest = Partial<StoreTripRequest>;

export type AssignTripRequest = {
  driver_id: number;
  vehicle_id?: number | null;
};

export type CancelTripRequest = {
  /** Lý do hủy đơn (BE đang yêu cầu field `reason` ở `POST /trips/{id}/cancel`). */
  reason: string;
  /** @deprecated Dùng `reason` cho khớp BE. */
  cancellation_reason?: string;
};
