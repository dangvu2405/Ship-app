# API Types for Frontend

This file is a practical type map for the frontend, extracted from the API controllers and request validation classes in the Laravel backend.

## Suggested Folder Structure

If you want to split the frontend types into files instead of keeping everything in one document, use this structure:

```text
types/
  api/
    auth.ts
    company.ts
    customer.ts
    vehicle.ts
    trip.ts
    invoice.ts
    leave.ts
    chat.ts
    notification.ts
    dispatch.ts
    upload.ts
    report.ts
    ceta.ts
  domain/
    common.ts
    enums.ts
    pagination.ts
    response.ts
    user.ts
    employee.ts
  requests/
    auth.ts
    company.ts
    customer.ts
    vehicle.ts
    trip.ts
    invoice.ts
    leave.ts
    chat.ts
    upload.ts
    report.ts
    vehicle-assignment.ts
  index.ts
```

### Folder Purpose

- `types/api/`: response payloads for each endpoint group.
- `types/domain/`: reusable core entities, enums, and shared response wrappers.
- `types/requests/`: request bodies that frontend forms submit.
- `types/index.ts`: barrel export so frontend can import from a single place.

### Recommended Export Pattern

```ts
// types/index.ts
export * from './domain/common';
export * from './domain/enums';
export * from './domain/pagination';
export * from './domain/response';
export * from './domain/user';
export * from './domain/employee';

export * from './api/auth';
export * from './api/company';
export * from './api/customer';
export * from './api/vehicle';
export * from './api/trip';
export * from './api/invoice';
export * from './api/leave';
export * from './api/chat';
export * from './api/notification';
export * from './api/dispatch';
export * from './api/upload';
export * from './api/report';
export * from './api/ceta';

export * from './requests/auth';
export * from './requests/company';
export * from './requests/customer';
export * from './requests/vehicle';
export * from './requests/trip';
export * from './requests/invoice';
export * from './requests/leave';
export * from './requests/chat';
export * from './requests/upload';
export * from './requests/report';
export * from './requests/vehicle-assignment';
```

## Response Envelope

Most endpoints return a shared envelope:

```ts
type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[] | string>;
};
```

Common list endpoints usually return a paginated payload inside `data`:

```ts
type PaginatedResponse<T> = {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};
```

Some custom list endpoints use `meta` instead of pagination fields:

```ts
type MetaResponse = {
  page?: number;
  per_page?: number;
  total?: number;
};
```

## Shared Enums

```ts
type CompanyStatus = 'active' | 'inactive';
type CustomerType = 'individual' | 'company';
type VehicleType = 'truck' | 'van' | 'car' | 'motorcycle';
type VehicleStatus = 'active' | 'maintenance' | 'inactive' | 'broken' | 'out_of_service';
type TripStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';
type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
type UserStatus = 'active' | 'inactive';
type ChatTask = 'chat' | 'classify' | 'extract' | 'advice';
type NotificationType = 'create' | 'update' | 'delete' | 'system' | 'user';
type DispatchTripStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'in_progress' | 'completed' | 'cancelled';
```

## Core Domain Types

### Company

```ts
type Company = {
  id: number;
  code: string;
  name: string;
  tax_code?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: CompanyStatus;
  created_at?: string;
  updated_at?: string;
};
```

### Customer

```ts
type Customer = {
  id: number;
  company_id: number;
  type: CustomerType;
  name: string;
  tax_code?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
};
```

### Vehicle

```ts
type Vehicle = {
  id: number;
  company_id: number;
  vehicle_type_id: number;
  plate_number: string;
  type: VehicleType;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  capacity?: number | null;
  current_odometer_km?: number | null;
  status: VehicleStatus;
  image_front?: string | null;
  image_back?: string | null;
  image_side?: string | null;
  image_other?: string | null;
  company?: Company;
  created_at?: string;
  updated_at?: string;
};
```

### Vehicle Assignment

```ts
type VehicleAssignment = {
  id: number;
  vehicle_id: number;
  driver_id: number;
  from_date: string;
  to_date?: string | null;
  note?: string | null;
  vehicle?: Vehicle;
  driver?: Employee;
  created_at?: string;
  updated_at?: string;
};
```

### Trip

```ts
type Trip = {
  id: number;
  code: string;
  company_id?: number;
  customer_id: number;
  driver_id: number;
  vehicle_id: number;
  start_point: string;
  end_point: string;
  distance_km?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  price?: number | null;
  status: TripStatus;
  assigned_at?: string | null;
  dispatcher_id?: number | null;
  customer?: Customer;
  driver?: Employee;
  vehicle?: Vehicle;
  warnings?: string[];
  created_at?: string;
  updated_at?: string;
};
```

### Invoice

```ts
type Invoice = {
  id: number;
  code: string;
  company_id?: number;
  trip_id?: number | null;
  customer_id: number;
  subtotal?: number;
  vat_rate?: number | null;
  vat_amount?: number | null;
  total_amount: number;
  status: InvoiceStatus;
  issued_at?: string | null;
  paid_at?: string | null;
  trip?: Trip;
  customer?: Customer;
  created_at?: string;
  updated_at?: string;
};
```

### Leave Type

```ts
type LeaveType = {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};
```

### Leave Request

```ts
type LeaveRequest = {
  id: number;
  company_id: number;
  driver_id: number;
  leave_type_id: number;
  from_date: string;
  to_date: string;
  total_days: number;
  reason?: string | null;
  rejection_reason?: string | null;
  waive_reason?: string | null;
  status: LeaveStatus;
  driver?: Employee;
  leave_type?: LeaveType;
  approver?: User;
  created_at?: string;
  updated_at?: string;
};
```

### User

```ts
type User = {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
  status: UserStatus;
  role?: string;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  residential_address?: string | null;
  created_at?: string;
  updated_at?: string;
};
```

### Employee

The backend uses `employees` for driver relations in several requests. For frontend typing, treat it as a driver profile object.

```ts
type Employee = {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  role?: string;
  available_status?: 'available' | 'busy' | 'offline';
  created_at?: string;
  updated_at?: string;
};
```

### Chat Session / Message

```ts
type ChatSession = {
  id?: string;
  session_id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

type ChatMessage = {
  id?: string;
  session_id: string;
  message: string;
  task?: ChatTask | null;
  context?: Record<string, unknown> | null;
  model?: string | null;
  role?: 'user' | 'assistant' | 'system';
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};
```

### Notification

```ts
type NotificationItem = {
  id: string;
  type: NotificationType;
  resource: string;
  resource_id?: number | null;
  action: string;
  description: string;
  user_id?: number | null;
  user_name?: string | null;
  created_at: string;
  read: boolean;
};
```

### Dispatch Board / Debt Overview

```ts
type DispatchBoard = {
  date: string;
  active_trips: number;
  vehicles_in_maintenance: number;
  drivers_on_leave: number;
  lanes: unknown[];
  meta: {
    note: string;
  };
};

type DispatchDailySummary = {
  date: string;
  trips: {
    created: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  vehicles: {
    active: number;
    maintenance: number;
    inactive: number;
  };
  drivers: {
    on_leave: number;
  };
  maintenance: {
    due: number;
  };
};

type DebtOverview = {
  unpaid_invoices: number;
  unpaid_total: string;
};
```

### Upload Result

```ts
type UploadResult = {
  url?: string;
  path?: string;
  file_name?: string;
  original_name?: string;
  mime_type?: string;
  size?: number;
  [key: string]: unknown;
};
```

## Auth Payloads

```ts
type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = ApiResponse<{
  token: string;
  user?: User;
  refreshToken?: string;
  expires_at?: string;
}>;

type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type SocialLoginRequest = {
  provider: 'google' | 'facebook' | 'apple';
  access_token?: string;
  id_token?: string;
};

type RefreshTokenRequest = {
  refresh_token: string;
};

type ResetPasswordRequest = {
  email: string;
  otp_token: string;
  password: string;
  password_confirmation: string;
};

type ChangePasswordRequest = {
  current_password: string;
  password: string;
  password_confirmation: string;
};
```

## Customer Payloads

```ts
type StoreCustomerRequest = {
  company_id: number;
  type: CustomerType;
  name: string;
  tax_code?: string;
  phone?: string;
  email?: string;
  address?: string;
};

type UpdateCustomerRequest = Partial<StoreCustomerRequest>;
```

## Company Payloads

```ts
type StoreCompanyRequest = {
  code: string;
  name: string;
  tax_code?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: CompanyStatus;
};

type UpdateCompanyRequest = Partial<StoreCompanyRequest>;
```

## Vehicle Payloads

```ts
type StoreVehicleRequest = {
  company_id: number;
  vehicle_type_id: number;
  plate_number: string;
  type: VehicleType;
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
  status: 'active' | 'maintenance' | 'inactive';
  image_front?: string;
  image_back?: string;
  image_side?: string;
  image_other?: string;
};

type UpdateVehicleRequest = Partial<StoreVehicleRequest> & {
  current_odometer_km?: number;
  status?: VehicleStatus;
};
```

## Trip Payloads

```ts
type StoreTripRequest = {
  code: string;
  customer_id: number;
  driver_id: number;
  vehicle_id: number;
  start_point: string;
  end_point: string;
  distance_km?: number;
  start_time?: string;
  end_time?: string;
  price?: number;
  status: TripStatus;
};

type UpdateTripRequest = Partial<StoreTripRequest>;

type AssignTripRequest = {
  driver_id: number;
  vehicle_id?: number | null;
};

type CancelTripRequest = {
  reason: string;
};

type DelayTripRequest = {
  reason?: string;
};

type UpdateTripDetailsRequest = {
  distance_km?: number | null;
};
```

## Invoice Payloads

```ts
type StoreInvoiceRequest = {
  code: string;
  trip_id?: number | null;
  customer_id: number;
  subtotal: number;
  vat_rate?: number | null;
  vat_amount?: number | null;
  total_amount: number;
  status: InvoiceStatus;
  issued_at?: string | null;
  paid_at?: string | null;
};

type UpdateInvoiceRequest = Partial<StoreInvoiceRequest>;
```

## Leave Payloads

```ts
type StoreLeaveRequest = {
  company_id: number;
  driver_id: number;
  leave_type_id: number;
  from_date: string;
  to_date: string;
  total_days: number;
  reason?: string | null;
  attachment_urls?: string[] | null;
};

type UpdateLeaveRequest = {
  rejection_reason?: string | null;
  waive_reason?: string | null;
};

type RejectLeaveRequest = {
  rejection_reason: string;
};
```

## Vehicle Assignment Payloads

```ts
type StoreVehicleAssignmentRequest = {
  vehicle_id: number;
  driver_id: number;
  from_date: string;
  to_date?: string | null;
};

type UpdateVehicleAssignmentRequest = Partial<StoreVehicleAssignmentRequest>;
```

## Chat Payloads

```ts
type StoreChatMessageRequest = {
  message: string;
  session_id?: string | null;
  task?: ChatTask | null;
  context?: Record<string, unknown> | null;
  model?: string | null;
};

type GetChatMessagesRequest = {
  session_id: string;
  limit?: number;
};

type GetChatSessionsRequest = {
  limit?: number;
};
```

## Upload Payloads

```ts
type UploadImageRequest = {
  file: File;
};

type UploadDocumentRequest = {
  file: File;
};
```

## Report Payloads

```ts
type DashboardRequest = {
  month?: number;
  year?: number;
};

type RevenueSummaryRequest = {
  company_id?: number;
  month?: number;
  year?: number;
  from?: string;
  to?: string;
};

type ExportRevenueReportRequest = RevenueSummaryRequest;

type ExportTripReportRequest = RevenueSummaryRequest & {
  status?: string;
};
```

## Ceta Resource Types

The generic `CetaSpecController` is schema-driven. For frontend usage, these resources should be typed as entity-specific records, but the API itself accepts flexible payloads constrained by DB schema and resource-specific rules.

```ts
type CetaResourceListResponse = ApiResponse<unknown[]> & {
  meta?: MetaResponse;
};

type CetaResourceItemResponse = ApiResponse<unknown>;
```

Typical route path examples:

```ts
// /api/{resource}
// /api/{resource}/{id}
// /api/{parent}/{id}/{child}
// /api/{parent}/{id}/{child}/{childId}
// /api/{resource}/{id}/{action}
```

## Auth / Me Payloads

```ts
type MeResponse = ApiResponse<{
  user: User;
  company?: Company | null;
  permissions?: string[];
  tenant_id?: number | null;
}>;

type AuthLogItem = {
  id?: string | number;
  created_at?: string;
  action?: string;
  description?: string;
  [key: string]: unknown;
};

type AuthActionItem = {
  id?: string | number;
  action?: string;
  created_at?: string;
  [key: string]: unknown;
};
```

## Frontend Notes

- All successful API responses use `{ success, message, data? }`.
- Validation errors use `422` with an `errors` object keyed by field name.
- Authenticated endpoints may return `401` when no bearer token is sent.
- Tenant-scoped modules may also depend on `X-Tenant-ID` in some environments.
- Some controllers return extra nested objects from Eloquent relations, so the frontend should treat related objects as optional.
- Several list endpoints are paginated and return a wrapped collection inside `data`.
- The `CetaSpecController` is intentionally flexible and should be handled with a generic table-driven list/detail UI if you need to support every route.
