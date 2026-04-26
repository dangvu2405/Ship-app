import type { Employee } from './organization';

export interface Allowance {
  id: number;
  code: string;
  name: string;
  default_amount?: number;
  taxable?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Deduction {
  id: number;
  code: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
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
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export type PayrollStatus = 'draft' | 'approved' | 'locked' | 'paid';

export interface Payroll {
  id: number;
  company_id: number;
  month: number;
  year: number;
  status: PayrollStatus | string;
  locked_at?: string;
  company?: { id: number; name?: string };
  payroll_period_id?: number;
  notes?: string;
  calculated_at?: string;
  calculated_by?: number;
  approved_at?: string;
  approved_by?: number;
  paid_at?: string;
  paid_by?: number;
  created_by?: number;
  updated_by?: number;
  deleted_by?: number;
  details?: PayrollDetail[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PayrollAdjustment {
  id: number;
  payroll_id: number;
  employee_id: number;
  type: 'allowance' | 'deduction';
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
  employee?: Employee;
  payroll?: Payroll;
}

export interface PayrollDetail {
  id: number;
  payroll_id: number;
  employee_id: number;
  base_salary: number;
  working_days: number;
  overtime: number;
  overtime_pay?: number;
  overtime_hours?: number;
  bonus: number;
  trip_bonus?: number;
  night_shift_allowance?: number;
  public_holiday_pay?: number;
  allowance: number;
  deduction: number;
  leave_unpaid_deduction?: number;
  violation_deduction?: number;
  fuel_excess_deduction: number;
  fuel_cost?: number;
  fuel_saving_bonus?: number;
  tax: number;
  net_salary: number;
  leave_days_paid?: number;
  leave_days_unpaid?: number;
  trips_completed_count?: number;
  total_distance_km?: number;
  driver_id?: number;
  driver?: { id: number; name?: string };
  si_salary_base?: number;
  bhxh_employee?: number;
  bhyt_employee?: number;
  bhtn_employee?: number;
  total_si_employee?: number;
  bhxh_employer?: number;
  bhyt_employer?: number;
  bhtn_employer?: number;
  bhtnld_bnn_employer?: number;
  total_si_employer?: number;
  gross_salary?: number;
  taxable_income?: number;
  dependants_count?: number;
  assessable_income?: number;
  pit?: number;
  meta_json?: Record<string, unknown>;
  created_by?: number;
  updated_by?: number;
  deleted_by?: number;
  employee?: Employee;
  adjustments?: PayrollAdjustment[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface MySalaryPayload {
  payroll: Payroll;
  line: PayrollDetail;
}

export interface TripBonusRule {
  id: number;
  min_km: number;
  max_km?: number | null;
  bonus_per_km: number;
  created_at?: string;
  updated_at?: string;
}
