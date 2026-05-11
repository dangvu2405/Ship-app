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

export interface UserPermissionGrant {
  code?: string;
  name?: string;
  module?: string;
  action?: string;
  can_view?: boolean;
  can_create?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_approve?: boolean;
  can_export?: boolean;
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
  role?: string;
  roles?: Role[];
  user_permissions?: UserPermissionGrant[] | Record<string, boolean>;
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
