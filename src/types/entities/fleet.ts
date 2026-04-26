import type { Customer, Employee } from './organization';

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
  id: number;
  code: string;
  customer_id: number;
  driver_id: number;
  vehicle_id: number;
  start_point: string;
  end_point: string;
  distance_km: number;
  price: number;
  status: string;
  start_time?: string;
  end_time?: string;
  customer?: Customer;
  company_id?: number;
  office_id?: number;
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
