export interface Office {
  id: number;
  code: string;
  name: string;
  address?: string;
  company_id: number;
  manager_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  office_id: number;
  office?: Office;
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Position {
  id: number;
  code: string;
  name: string;
  base_salary: number;
  level?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Company {
  id: number;
  code: string;
  name: string;
  tax_code?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Customer {
  id: number;
  company_id?: number;
  code?: string;
  name: string;
  type: 'company' | 'individual';
  company_name?: string;
  full_name?: string;
  extra_contact_name?: string;
  extra_contact_phone?: string;
  tax_code?: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  group_id?: number | null;
  assigned_dispatcher_id?: number | null;
  credit_limit?: number | null;
  payment_terms_days?: number | null;
  contract_file_url?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  notes?: string | null;
  is_active?: number | boolean;
  status?: 'active' | 'inactive' | string;
  trips_count?: number;
  group?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CustomerGroup {
  id: number;
  company_id?: number;
  name: string;
  description?: string | null;
  assigned_dispatcher_id?: number | null;
  is_active?: number | boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Employee {
  id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'office' | 'driver';
  status: string;
  office_id?: number;
  department_id?: number;
  position_id?: number;
  office?: Office;
  department?: Department;
  position?: Position;
  dob?: string;
  gender?: 'male' | 'female' | 'other' | string;
  address?: string;
  avatar_url?: string;
  national_id_no?: string;
  national_id_issue_date?: string;
  national_id_issue_place?: string;
  social_insurance_no?: string;
  health_insurance_no?: string;
  insurance_registered_at?: string;
  join_date?: string;
  resign_date?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_account_name?: string;
  /** GPLX / giấy phép — có khi employee gắn bản ghi tài xế. */
  expired_date?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
