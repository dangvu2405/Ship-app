export interface WorkScheduleTemplate {
  id: number;
  name: string;
  shift_code: string;
  start_time: string;
  end_time: string;
}

export interface ApplyOfficeScheduleResult {
  queued?: boolean;
  estimated_rows?: number;
  rows_created?: number;
  drivers_count?: number;
}

export interface DriverSchedule {
  id: number;
  driver_id: number;
  office_id: number;
  work_date: string;
  shift_code?: string;
  start_time?: string;
  end_time?: string;
  vehicle_id?: number;
  status?: string;
  notes?: string;
  driver?: { id: number; name?: string };
  vehicle?: { id: number; plate_number?: string };
  override_reason?: string;
}

export type DayKind = 'working' | 'leave' | 'noleave' | 'holiday' | 'weekend' | 'unknown';

export interface PublicHoliday {
  id: number;
  date: string;
  name: string;
  holiday_type: 'national' | 'regional' | 'compensatory';
}

export interface AbsenceRecord {
  id: number;
  driver_id: number;
  date: string;
  reason: string | null;
}

export interface LeaveRequest {
  id: number;
  driver_id: number;
  leave_type_id: number;
  from_date: string;
  to_date: string;
  total_days?: number;
  status: string;
  reason?: string;
  rejection_reason?: string;
  cancelled_at?: string;
}

export interface OvertimeRequest {
  id: number;
  driver_id: number;
  company_id?: number;
  work_date: string;
  start_time: string;
  end_time: string;
  ot_hours?: number;
  status: string;
  reason?: string;
}

export interface ViolationRecord {
  id: number;
  driver_id: number;
  company_id?: number;
  trip_id?: number;
  type: string;
  occurred_at?: string;
  status: string;
  description?: string;
  penalty_amount?: number;
  confirmed_at?: string;
  disputed_at?: string;
  resolved_at?: string;
  waived_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkforceAttendanceRecord {
  id: number;
  driver_id: number;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  work_hours?: number | null;
  overtime_hours?: number | null;
  status?: 'present' | 'late' | 'absent' | 'partial' | string;
  adjust_reason?: string;
}
