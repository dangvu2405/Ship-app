/**
 * Types aligned with FRONTEND_MUST_HAVE_SCHEMA_HANDOFF (DB / planned REST).
 * Use for forms, mock data, and API clients before all routes are live.
 */

export interface LeaveType {
  id: number;
  code: string;
  name: string;
  is_paid: boolean;
  annual_quota_days?: number | string;
  allow_carry_forward?: boolean;
  requires_attachment?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  from_date: string;
  to_date: string;
  total_days?: number | string;
  reason?: string;
  status?: string;
  approved_by?: number | null;
  approved_at?: string | null;
  attachment_urls?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  opening_days?: number | string;
  earned_days?: number | string;
  used_days?: number | string;
  adjusted_days?: number | string;
  closing_days?: number | string;
}

export interface PayrollEarningLine {
  id?: number;
  payroll_detail_id?: number;
  code?: string;
  name?: string;
  amount?: number | string;
  taxable?: boolean;
}

export interface PayrollDeductionLine {
  id?: number;
  payroll_detail_id?: number;
  code?: string;
  name?: string;
  amount?: number | string;
}

export interface Payslip {
  id: number;
  employee_id?: number;
  payroll_id?: number;
  issue_number?: string;
  status?: string;
  snapshot_json?: Record<string, unknown>;
  issued_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChartOfAccount {
  id: number;
  code: string;
  name: string;
  type?: string;
  parent_id?: number | null;
  is_postable?: boolean;
  status?: string;
}

export interface JournalEntryLine {
  account_id: number;
  debit?: number | string;
  credit?: number | string;
  line_description?: string;
  line_no?: number;
}

export interface JournalEntry {
  id?: number;
  entry_no?: string;
  entry_date?: string;
  source_type?: string;
  source_id?: number | null;
  description?: string;
  status?: string;
  lines?: JournalEntryLine[];
}

export interface StatusHistoryRecord {
  id?: number;
  entity_type?: string;
  entity_id?: number;
  from_status?: string | null;
  to_status?: string;
  note?: string;
  changed_by?: number | null;
  changed_at?: string;
}
