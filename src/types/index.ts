export interface User {
  id: number;
  username: string;
  email: string;
  employee_id?: number;
  status: string;
  roles?: Role[];
  employee?: Employee;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
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
}

export interface Department {
  id: number;
  code: string;
  name: string;
  office_id: number;
  parent_id?: number;
}

export interface Position {
  id: number;
  code: string;
  name: string;
  base_salary: number;
  level: number;
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
