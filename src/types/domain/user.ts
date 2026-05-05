export interface Tenant {
  id: number;
  name: string;
  code: string;
  logo_url?: string;
  status: string;
  timezone?: string;
  default_currency?: string;
}

export interface Permission {
  id: number;
  name: string;
  code?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  employee_id?: number;
  status: string;
  roles?: Role[];
  employee?: import('./employee').Employee;
  avatar_url?: string;
  last_login_at?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  residential_address?: string;
  tenants?: Tenant[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
