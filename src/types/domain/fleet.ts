import type { VehicleStatus } from './enums';
import type { TripStatus } from './enums';
import type { Customer, Employee } from './employee';
import type { VehicleTypeCatalog } from './catalog';

export interface TripStop {
  id: number;
  company_id: number;
  trip_id: number;
  stop_type: 'pickup' | 'delivery' | string;
  sequence: number;
  location_id?: number | null;
  address: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  scheduled_time?: string | null;
  actual_time?: string | null;
  status: TripStatus | 'draft';
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TripSurcharge {
  id: number;
  company_id: number;
  trip_id: number;
  name: string;
  amount: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TripStatusHistory {
  id: number;
  trip_id: number;
  from_status?: string | null;
  to_status: string;
  changed_by?: number | null;
  changed_at: string;
  note?: string | null;
}

export type VehicleDocumentType =
  | 'registration'
  | 'inspection'
  | 'liability_insurance'
  | 'vehicle_insurance'
  | 'badge'
  | 'photo'
  | 'other'
  | string;

export interface Vehicle {
  id: number;
  company_id?: number;
  plate_number: string;
  vehicle_type_id?: number | null;
  vehicle_type?: VehicleTypeCatalog | null;
  type: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
  max_load_ton?: number | null;
  volume_m3?: number | null;
  fuel_type?: string | null;
  fuel_consumption?: number | null;
  current_odometer_km?: number | null;
  status: VehicleStatus | string;
  office_id?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface VehicleDocument {
  id: number;
  company_id: number;
  vehicle_id: number;
  doc_type: VehicleDocumentType;
  doc_name: string;
  doc_number?: string | null;
  issued_date?: string | null;
  expiry_date?: string | null;
  issuer?: string | null;
  file_url?: string | null;
  alert_before_days: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export type MaintenanceIntervalType = 'by_km' | 'by_days' | 'both' | string;

export interface MaintenanceSchedule {
  id: number;
  company_id: number;
  vehicle_id: number;
  spare_part_id?: number | null;
  task_name: string;
  interval_type: MaintenanceIntervalType;
  interval_km?: number | null;
  interval_days?: number | null;
  last_done_km?: number | null;
  last_done_date?: string | null;
  next_due_km?: number | null;
  next_due_date?: string | null;
  alert_before_km?: number | null;
  alert_before_days: number;
  estimated_cost?: number | null;
  notes?: string | null;
  is_active: number | boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export type MaintenanceRecordType = 'scheduled' | 'unscheduled' | string;
export type MaintenanceRecordStatus = 'open' | 'in_progress' | 'completed' | string;

export interface MaintenanceRecord {
  id: number;
  company_id: number;
  vehicle_id: number;
  maintenance_schedule_id?: number | null;
  type: MaintenanceRecordType;
  title: string;
  description?: string | null;
  odometer_km?: number | null;
  started_date: string;
  completed_date?: string | null;
  garage_name?: string | null;
  total_cost?: number | null;
  invoice_number?: string | null;
  file_url?: string | null;
  status: MaintenanceRecordStatus;
  notes?: string | null;
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
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  actual_distance_km?: number | null;
  start_time?: string;
  end_time?: string;
  actual_pickup_at?: string | null;
  actual_delivered_at?: string | null;
  /** @deprecated BE dùng `base_price` + `surcharge_amount` + `total_revenue`. Trường này map về `total_revenue` cho BC. */
  price?: number;
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
  trip_stops?: TripStop[];
  trip_surcharges?: TripSurcharge[];
  trip_status_histories?: TripStatusHistory[];
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

export interface InvoiceLineItem {
  id: number;
  invoice_id: number;
  description?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  line_total?: number | null;
  amount?: number | null;
  vat_rate?: number | null;
  vat_amount?: number | null;
  sort_order?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceStatusHistory {
  id: number;
  invoice_id: number;
  from_status?: string | null;
  to_status: string;
  changed_by?: number | null;
  changed_at: string;
  note?: string | null;
}

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
  payment_status?: string;
  trip?: Trip;
  customer?: Customer;
  invoice_items?: InvoiceLineItem[];
  reconciliation_session_id?: number | null;
  reconciliation_session?: { id?: number; status?: string } | null;
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
  company_id?: number;
  from_date: string;
  to_date?: string | null;
  release_reason?: string | null;
  notes?: string | null;
  created_by?: number | null;
  vehicle?: Vehicle;
  driver?: Driver | Employee;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DriverExpiringDocument {
  id: number;
  driver_id: number;
  driver_name: string;
  document_type: string;
  document_label?: string;
  expiry_date: string;
  days_remaining: number;
  license_class?: string;
}

export interface VehicleExpiringDocument {
  id: number;
  vehicle_id: number;
  plate_number: string;
  document_type: string;
  document_label?: string;
  expiry_date: string;
  days_remaining: number;
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
