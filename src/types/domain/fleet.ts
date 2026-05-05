import type { Customer, Employee } from './employee';

export interface Vehicle {
  id: number;
  plate_number: string;
  type: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
  status: string;
  office_id: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Trip {
  scheduled_date: string | undefined;
  id: number;
  code: string;
  company_id?: number;
  customer_id: number;
  office_id?: number;
  contact_name?: string;
  contact_phone?: string;
  cargo_type_id?: number | null;
  cargo_description?: string;
  cargo_quantity?: number | null;
  cargo_unit?: string | null;
  cargo_weight_ton?: number | null;
  cargo_notes?: string;
  driver_id: number;
  vehicle_id: number;
  dispatcher_id?: number | null;
  assigned_at?: string | null;
  route_template_id?: number | null;
  origin_location_id?: number | null;
  destination_location_id?: number | null;
  start_point: string;
  end_point: string;
  received_date?: string | null;
  scheduled_time_from?: string | null;
  scheduled_time_to?: string | null;
  distance_km: number;
  actual_distance_km?: number | null;
  start_time?: string;
  end_time?: string;
  actual_pickup_at?: string | null;
  actual_delivered_at?: string | null;
  price: number;
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
  customer?: Customer;
  driver?: Employee;
  vehicle?: Vehicle;
  company?: { id: number; name?: string };
  route_template?: { id: number; name?: string };
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export type EInvoiceStatus =
  | 'draft'
  | 'issued'
  | 'sent_cqt'
  | 'accepted'
  | 'paid'
  | 'cancelled';

export interface Invoice {
  id: number;
  code: string;
  customer_id: number;
  trip_id?: number;
  total_amount: number;
  tax_amount?: number;
  subtotal?: number;
  vat_rate?: number;
  vat_amount?: number;
  issued_at?: string;
  paid_at?: string;
  due_date?: string;
  status: string;
  trip?: Trip;
  customer?: Customer;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  einvoice_status?: EInvoiceStatus;
  einvoice_no?: string;
  einvoice_serial?: string;
  einvoice_template?: string;
  cqt_code?: string;
  cqt_sent_at?: string;
  cqt_response_at?: string;
  cqt_result?: string;
  cqt_message?: string;
  einvoice_provider?: string;
  einvoice_pdf_url?: string;
  cancel_reason?: string;
  signed_at?: string;
}

export interface Driver {
  id: number;
  employee_id: number;
  license_no: string;
  license_class: string;
  expired_date?: string;
  name?: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  available_status?: string;
  employee?: Employee;
  license_image_url?: string;
  identity_image_url?: string;
  driver_insurance_no?: string;
  driver_insurance_expired_date?: string;
  health_certificate_no?: string;
  health_certificate_expired_date?: string;
  id_card_no?: string;
  id_card_issue_date?: string;
  permanent_address?: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  insurance_provider?: string;
  insurance_policy_no?: string;
  insurance_expiry_date?: string;
  insurance_doc_url?: string;
  profile_notes?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface VehicleAssignment {
  id: number;
  vehicle_id: number;
  driver_id: number;
  from_date: string;
  to_date?: string;
  vehicle?: Vehicle;
  driver?: Driver | Employee;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface VehicleExpense {
  id: number;
  vehicle_id: number;
  driver_id?: number;
  type: string;
  amount: number;
  expense_date: string;
  note?: string;
  vehicle?: Vehicle;
  driver?: Driver | Employee;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
