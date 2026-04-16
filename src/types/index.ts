/**
 * Kiểu domain cho **JSON nhận về** từ backend (sau envelope).
 *
 * - **`ApiResponse<T>`** — `success`, `message?`, `data?`, `errors?` (lỗi validation dạng Laravel).
 * - **List** `GET /{resource}` — `data` thường là `{ data: T[], meta?: { total, current_page, last_page, per_page } }`; mỗi phần tử mảng khớp interface tương ứng (ví dụ `Company`).
 * - **Một bản ghi** `GET|POST|PUT /{resource}/:id` — `data` là object `T` (unwrap envelope, không lồn `.data` con thêm một tầng).
 *
 * Map `resource` (segment sau base `/api/v1`) → kiểu một bản ghi: **`ApiResourceResponseByName`** (cuối file).
 * Bảng mô tả từng trường: `docs/FRONTEND_RESPONSE_FIELDS_BY_RESOURCE.md`.
 * Từ điển DB backend (canonical): `ship-app-api/docs/DATABASE_DATA_DICTIONARY.md` (repo api, cùng thư mục cha với ship-app).
 */

export interface User {
  id: number;
  username: string;
  email: string;
  employee_id?: number;
  status: string;
  roles?: Role[];
  employee?: Employee;
  /** DB `users.avatar_url` */
  avatar_url?: string;
  last_login_at?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  residential_address?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
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
  /** Khi API/report trả thêm scope công ty / văn phòng */
  company_id?: number;
  office_id?: number;
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
  /** Có thể chưa có trên DB cho đến khi migration bổ sung — giữ optional */
  contact_person?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Driver {
  id: number;
  employee_id: number;
  license_no: string;
  license_class: string;
  expired_date?: string;
  /** DB: `available` | `busy` | `offline` — UI cũ có thể dùng alias khác cho đến khi thống nhất API */
  available_status?: string;
  employee?: Employee;
  /** DB `drivers.license_image_url` — ảnh GPLX */
  license_image_url?: string;
  /** DB `drivers.identity_image_url` — ảnh giấy tờ định danh */
  identity_image_url?: string;
  driver_insurance_no?: string;
  driver_insurance_expired_date?: string;
  health_certificate_no?: string;
  health_certificate_expired_date?: string;
  /** Số CCCD / CMND — có thể map từ `employees.national_id_no` qua API */
  id_card_no?: string;
  id_card_issue_date?: string;
  permanent_address?: string;
  /** Alias UI / response cũ; song song với `license_image_url` / `identity_image_url` */
  id_card_front_url?: string;
  id_card_back_url?: string;
  insurance_provider?: string;
  insurance_policy_no?: string;
  insurance_expiry_date?: string;
  insurance_doc_url?: string;
  /** Ghi chú / thông tin chi tiết bổ sung */
  profile_notes?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Invoice {
  id: number;
  code: string;
  customer_id: number;
  trip_id?: number;
  total_amount: number;
  /** Legacy / alias; dictionary dùng `vat_amount` */
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
}

export interface VehicleAssignment {
  id: number;
  vehicle_id: number;
  /** DB FK tới `employees` (tài xế) */
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
  /** DB bắt buộc; API list có thể chưa gửi — giữ optional cho an toàn type */
  status?: string;
  employee?: Employee;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Payroll {
  id: number;
  company_id: number;
  month: number;
  year: number;
  status: string;
  locked_at?: string;
  company?: { id: number; name?: string };
  payroll_period_id?: number;
  notes?: string;
  calculated_at?: string;
  calculated_by?: number;
  approved_at?: string;
  approved_by?: number;
  paid_at?: string;
  created_by?: number;
  updated_by?: number;
  deleted_by?: number;
  details?: PayrollDetail[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
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
  fuel_cost: number;
  tax: number;
  net_salary: number;
  leave_days_paid?: number;
  leave_days_unpaid?: number;
  trips_completed_count?: number;
  total_distance_km?: number;
  driver_id?: number;
  driver?: { id: number; name?: string };
  meta_json?: Record<string, unknown>;
  created_by?: number;
  updated_by?: number;
  deleted_by?: number;
  employee?: Employee;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface MySalaryPayload {
  payroll: Payroll;
  line: PayrollDetail;
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
  revenue?: { total: number };
}

export interface TripBonusRule {
  id: number;
  min_km: number;
  max_km?: number | null;
  bonus_per_km: number;
  created_at?: string;
  updated_at?: string;
}

export interface ChatSession {
  id: number | string;
  session_id?: string;
  title?: string;
  model?: string;
  created_at?: string;
  updated_at?: string;
  last_message?: string;
  last_message_at?: string;
  message_count?: number;
}

export interface ChatMessage {
  id: number | string;
  session_id?: string;
  role: 'user' | 'assistant' | 'system' | string;
  message?: string;
  response?: string;
  response_text?: string;
  content?: string;
  text?: string;
  created_at?: string;
  updated_at?: string;
  model?: string;
  status?: string;
  cached?: boolean;
  guarded?: boolean;
  context?: Record<string, unknown>;
}

export interface LateAttendanceNotification {
  id: number | string;
  date?: string;
  employee_id?: number;
  employee?: Employee;
  employee_name?: string;
  check_in?: string;
  late_minutes?: number;
  late_after?: string;
  notified?: boolean;
  note?: string;
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

/**
 * Khóa = tên **resource** Refine / segment path (không có leading slash), sau `API_BASE_URL`.
 * Giá trị = kiểu **một bản ghi** trong list (`data.data[]`) hoặc detail/create/update (`data`).
 */
export interface ApiResourceResponseByName {
  allowances: Allowance;
  attendances: Attendance;
  companies: Company;
  customers: Customer;
  deductions: Deduction;
  departments: Department;
  drivers: Driver;
  employees: Employee;
  invoices: Invoice;
  offices: Office;
  payrolls: Payroll;
  positions: Position;
  roles: Role;
  trip_bonus_rules: TripBonusRule;
  trips: Trip;
  users: User;
  vehicle_assignments: VehicleAssignment;
  vehicle_expenses: VehicleExpense;
  vehicles: Vehicle;
}

/** Tên resource CRUD có kiểu phản hồi tương ứng trong `ApiResourceResponseByName`. */
export type ApiCrudResourceName = keyof ApiResourceResponseByName;

/**
 * Phản hồi đặc thù (không map 1-1 qua `ApiResourceResponseByName`):
 *
 * | Endpoint (relative tới `/api/v1` trừ ghi chú) | Kiểu `data` / phần hữu ích |
 * |-----------------------------------------------|------------------------------|
 * | `GET /user` | `User` |
 * | `POST /auth/login` | `{ user: User; token?: string }` (trong `ApiResponse['data']`) |
 * | `GET /reports/dashboard` | object → FE chuẩn hóa thành `DashboardStats` (`dashboard.service`) |
 * | `GET /permissions`, `GET /roles/:id` (nested) | `Permission[]` hoặc `Role` kèm `permissions` |
 * | `GET /chat/sessions`, messages… | `ChatSession`, `ChatMessage`, … |
 * | `GET /attendances/late/list` | `LateAttendanceNotification[]` (shape tùy BE) |
 * | `GET /api/v2/employees` (base `/api`) | nên thống nhất với BE; có thể mở rộng type riêng |
 */
export type ApiSpecialEndpointData = {
  '/user': User;
  '/auth/login': { user: User; token?: string };
  '/reports/dashboard': DashboardStats;
};
