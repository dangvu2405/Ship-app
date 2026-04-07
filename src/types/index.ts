export interface User {
  id: number;
  username: string;
  email: string;
  employee_id?: number;
  status: string;
  roles?: Role[];
  employee?: Employee;
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
}

export interface Employee {
  id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'office' | 'driver';
  status: string;
  office?: Office;
  department?: Department;
  position?: Position;
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
}

export interface Office {
  id: number;
  code: string;
  name: string;
  address?: string;
  company_id: number;
  manager_id?: number;
  company?: Company;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  office_id: number;
  parent_id?: number;
  office?: Office;
}

export interface Position {
  id: number;
  code: string;
  name: string;
  base_salary: number;
  level?: number;
  description?: string;
}

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
}

export interface Driver {
  id: number;
  employee_id: number;
  license_no: string;
  license_class: string;
  expired_date?: string;
  available_status?: string;
  employee?: Employee;
}

export interface Invoice {
  id: number;
  code: string;
  customer_id: number;
  trip_id?: number;
  total_amount: number;
  tax_amount?: number;
  issued_at?: string;
  due_date?: string;
  status: string;
  trip?: Trip;
  customer?: Customer;
}

export interface VehicleAssignment {
  id: number;
  vehicle_id: number;
  driver_id: number;
  from_date: string;
  to_date?: string;
  vehicle?: Vehicle;
  driver?: Employee;
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
  driver?: Employee;
}

export interface Allowance {
  id: number;
  code: string;
  name: string;
  default_amount?: number;
  taxable?: boolean;
}

export interface Deduction {
  id: number;
  code: string;
  name: string;
}

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  check_in?: string;
  check_out?: string;
  work_hours?: number;
  overtime_hours?: number;
  status?: string;
  employee?: Employee;
}

export interface Payroll {
  id: number;
  company_id: number;
  month: number;
  year: number;
  status: string;
  locked_at?: string;
  details?: PayrollDetail[];
}

export interface PayrollDetail {
  id: number;
  payroll_id: number;
  employee_id: number;
  base_salary: number;
  working_days: number;
  overtime: number;
  bonus: number;
  allowance: number;
  deduction: number;
  fuel_cost: number;
  tax: number;
  net_salary: number;
  employee?: Employee;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ActivityLog {
  id: number;
  type: 'create' | 'update' | 'delete' | 'system' | 'user';
  resource: string; // 'company', 'employee', 'vehicle', 'trip', 'payroll', 'user'
  resource_id?: number;
  action: string; // 'created', 'updated', 'deleted'
  description: string;
  user_id?: number;
  user_name?: string;
  created_at: string;
  read: boolean;
}

export interface DashboardStats {
  companies: { total: number; active: number };
  employees: { total: number; active: number };
  vehicles: { total: number; active: number };
  trips: { total: number; pending: number; completed: number };
  payrolls: { total: number; pending: number; completed: number };
}
