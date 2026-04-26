export interface Office {
  id: number;
  code: string;
  name: string;
  address?: string;
  company_id: number;
  manager_id?: number;
  company?: Company;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  office_id: number;
  parent_id?: number;
  office?: Office;
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
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Customer {
  id: number;
  name: string;
  type: 'company' | 'individual';
  tax_code?: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
