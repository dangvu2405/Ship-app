/**
 * Shared test fixtures for Playwright E2E tests.
 * Credentials are read from environment variables; defaults suit a local dev DB.
 *
 * Required env vars for CI:
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
 *   BASE_URL  (default: http://localhost:5173)
 */

/** Auth credentials — defaults match CONVENTION.md demo account */
export const TEST_USERS = {
  admin: {
    email: process.env['E2E_ADMIN_EMAIL'] ?? 'admin@abctransport.com',
    password: process.env['E2E_ADMIN_PASSWORD'] ?? 'password',
  },
  regular: {
    email: process.env['E2E_USER_EMAIL'] ?? 'user@abctransport.com',
    password: process.env['E2E_USER_PASSWORD'] ?? 'password',
  },
} as const;

/** Path where globalSetup saves the authenticated browser storage state. */
export const AUTH_FILE = 'playwright/.auth/admin.json';

// ─── Mock API response builders ──────────────────────────────────────────────

export type MockDriver = {
  id: number;
  name: string;
  phone: string;
  email: string;
  status?: string;
  available_status?: string;
  license_no?: string;
  license_class?: string;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
};

export const MOCK_DRIVERS: MockDriver[] = [
  {
    id: 1,
    name: 'Nguyễn Văn An',
    phone: '0901234567',
    email: 'nvan@example.com',
    available_status: 'available',
    license_no: 'B2-123456',
    license_class: 'B2',
    company_id: 1,
    created_at: '2024-01-15T08:00:00.000Z',
    updated_at: '2024-03-01T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'Trần Thị Bình',
    phone: '0912345678',
    email: 'ttbinh@example.com',
    available_status: 'busy',
    license_no: 'B2-789012',
    license_class: 'B2',
    company_id: 1,
    created_at: '2024-02-01T08:00:00.000Z',
    updated_at: '2024-03-10T14:00:00.000Z',
  },
  {
    id: 3,
    name: 'Lê Quốc Cường',
    phone: '0923456789',
    email: 'lqcuong@example.com',
    available_status: 'offline',
    license_no: 'C-456789',
    license_class: 'C',
    company_id: 1,
    created_at: '2024-02-10T08:00:00.000Z',
    updated_at: '2024-03-15T09:00:00.000Z',
  },
];

/** Builds a paginated list API response body (JSON string). */
export const driverListBody = (drivers: MockDriver[] = MOCK_DRIVERS): string =>
  JSON.stringify({
    success: true,
    message: 'OK',
    data: {
      data: drivers,
      meta: {
        total: drivers.length,
        per_page: 15,
        current_page: 1,
        last_page: 1,
        from: drivers.length > 0 ? 1 : null,
        to: drivers.length > 0 ? drivers.length : null,
      },
    },
  });

/** Builds a single-resource API response body (JSON string). */
export const driverSingleBody = (driver: MockDriver = MOCK_DRIVERS[0]): string =>
  JSON.stringify({ success: true, message: 'OK', data: driver });

/** Builds a generic success response body (JSON string). */
export const okBody = (data: unknown = {}): string =>
  JSON.stringify({ success: true, data, message: 'OK' });

/** Builds an error response body (JSON string). */
export const errBody = (message = 'Internal Server Error', code?: string): string =>
  JSON.stringify({ success: false, message, error_code: code });

/** Mocked /api/auth/me response — used so tests don't need a live backend for auth refresh. */
export const MOCK_ME_BODY = JSON.stringify({
  success: true,
  data: {
    id: 1,
    name: 'Admin Test',
    email: TEST_USERS.admin.email,
    role: 'admin',
    company_id: 1,
    permissions: ['*'],
  },
});

// ─── Generic paginated list builder ──────────────────────────────────────────

/** Builds a paginated list response for any resource. */
export const listBody = (items: unknown[], overrideMeta?: object): string =>
  JSON.stringify({
    success: true,
    message: 'OK',
    data: {
      data: items,
      meta: {
        total: items.length,
        per_page: 15,
        current_page: 1,
        last_page: 1,
        from: items.length > 0 ? 1 : null,
        to: items.length > 0 ? items.length : null,
        ...overrideMeta,
      },
    },
  });

/** Builds an empty paginated list response. */
export const emptyListBody = (): string => listBody([]);

/** Builds a single-resource response for any resource. */
export const singleBody = (data: unknown): string =>
  JSON.stringify({ success: true, message: 'OK', data });

// ─── Mock trips ──────────────────────────────────────────────────────────────

export type MockTrip = {
  id: number;
  code?: string;
  status: string;
  customer_id?: number;
  customer?: { id: number; name: string };
  driver_id?: number;
  driver?: { id: number; name: string };
  vehicle_id?: number;
  vehicle?: { id: number; plate_number: string };
  pickup_address?: string;
  delivery_address?: string;
  scheduled_at?: string;
  company_id?: number;
  created_at?: string;
};

export const MOCK_TRIPS: MockTrip[] = [
  {
    id: 1,
    code: 'TRIP-001',
    status: 'pending',
    customer: { id: 1, name: 'Công ty ABC' },
    driver: { id: 1, name: 'Nguyễn Văn An' },
    vehicle: { id: 1, plate_number: '51A-12345' },
    pickup_address: '123 Lê Lợi, Q1, TP.HCM',
    delivery_address: '456 Trần Hưng Đạo, Q5, TP.HCM',
    scheduled_at: '2026-05-15T08:00:00.000Z',
    company_id: 1,
    created_at: '2026-05-14T00:00:00.000Z',
  },
  {
    id: 2,
    code: 'TRIP-002',
    status: 'in_progress',
    customer: { id: 2, name: 'Công ty XYZ' },
    driver: { id: 2, name: 'Trần Thị Bình' },
    vehicle: { id: 2, plate_number: '51B-67890' },
    pickup_address: '789 Nguyễn Huệ, Q1',
    delivery_address: '321 Đinh Tiên Hoàng, Bình Thạnh',
    scheduled_at: '2026-05-14T10:00:00.000Z',
    company_id: 1,
    created_at: '2026-05-13T00:00:00.000Z',
  },
];

export const tripListBody = (trips: MockTrip[] = MOCK_TRIPS) => listBody(trips);
export const tripSingleBody = (trip: MockTrip = MOCK_TRIPS[0]) => singleBody(trip);

// ─── Mock vehicles ────────────────────────────────────────────────────────────

export type MockVehicle = {
  id: number;
  plate_number: string;
  brand?: string;
  model?: string;
  status?: string;
  vehicle_type?: { id: number; name: string };
  company_id?: number;
  created_at?: string;
};

export const MOCK_VEHICLES: MockVehicle[] = [
  {
    id: 1,
    plate_number: '51A-12345',
    brand: 'Isuzu',
    model: 'NQR',
    status: 'active',
    vehicle_type: { id: 1, name: 'Xe tải 3 tấn' },
    company_id: 1,
    created_at: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 2,
    plate_number: '51B-67890',
    brand: 'Hino',
    model: '300',
    status: 'active',
    vehicle_type: { id: 1, name: 'Xe tải 3 tấn' },
    company_id: 1,
    created_at: '2024-02-01T00:00:00.000Z',
  },
];

export const vehicleListBody = (vehicles: MockVehicle[] = MOCK_VEHICLES) => listBody(vehicles);
export const vehicleSingleBody = (vehicle: MockVehicle = MOCK_VEHICLES[0]) => singleBody(vehicle);

// ─── Mock customers ───────────────────────────────────────────────────────────

export type MockCustomer = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  company_id?: number;
  created_at?: string;
};

export const MOCK_CUSTOMERS: MockCustomer[] = [
  {
    id: 1,
    name: 'Công ty TNHH ABC Logistics',
    email: 'abc@logistics.com',
    phone: '0281234567',
    address: '123 Lê Lợi, Q1, TP.HCM',
    status: 'active',
    company_id: 1,
    created_at: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Công ty CP XYZ Vận Tải',
    email: 'xyz@transport.com',
    phone: '0289876543',
    address: '456 Nguyễn Trãi, Q5, TP.HCM',
    status: 'active',
    company_id: 1,
    created_at: '2024-02-10T00:00:00.000Z',
  },
];

export const customerListBody = (customers: MockCustomer[] = MOCK_CUSTOMERS) => listBody(customers);
export const customerSingleBody = (customer: MockCustomer = MOCK_CUSTOMERS[0]) => singleBody(customer);

// ─── Mock invoices ────────────────────────────────────────────────────────────

export type MockInvoice = {
  id: number;
  invoice_number?: string;
  status: string;
  customer_id?: number;
  customer?: { id: number; name: string };
  total_amount?: number;
  issued_at?: string;
  due_date?: string;
  company_id?: number;
  created_at?: string;
};

export const MOCK_INVOICES: MockInvoice[] = [
  {
    id: 1,
    invoice_number: 'INV-2026-001',
    status: 'draft',
    customer: { id: 1, name: 'Công ty TNHH ABC Logistics' },
    total_amount: 5_000_000,
    due_date: '2026-05-30',
    company_id: 1,
    created_at: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 2,
    invoice_number: 'INV-2026-002',
    status: 'issued',
    customer: { id: 2, name: 'Công ty CP XYZ Vận Tải' },
    total_amount: 8_500_000,
    issued_at: '2026-05-05T00:00:00.000Z',
    due_date: '2026-06-05',
    company_id: 1,
    created_at: '2026-05-05T00:00:00.000Z',
  },
];

export const invoiceListBody = (invoices: MockInvoice[] = MOCK_INVOICES) => listBody(invoices);
export const invoiceSingleBody = (invoice: MockInvoice = MOCK_INVOICES[0]) => singleBody(invoice);

// ─── Mock users ───────────────────────────────────────────────────────────────

export type MockUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status?: string;
  company_id?: number;
  created_at?: string;
};

export const MOCK_USERS: MockUser[] = [
  {
    id: 1,
    name: 'Admin Test',
    email: 'admin@abctransport.com',
    role: 'admin',
    status: 'active',
    company_id: 1,
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Dispatcher Nguyen',
    email: 'dispatcher@abctransport.com',
    role: 'dispatcher',
    status: 'active',
    company_id: 1,
    created_at: '2024-02-01T00:00:00.000Z',
  },
];

export const userListBody = (users: MockUser[] = MOCK_USERS) => listBody(users);

/** Mocked successful login response body. */
export const MOCK_LOGIN_OK_BODY = JSON.stringify({
  success: true,
  data: {
    token: 'test-bearer-token',
    token_type: 'Bearer',
    expires_in: 3600,
    user: {
      id: 1,
      name: 'Admin Test',
      email: TEST_USERS.admin.email,
      role: 'admin',
      company_id: 1,
    },
  },
});
