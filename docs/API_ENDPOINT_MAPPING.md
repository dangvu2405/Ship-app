# API Endpoint Mapping (Frontend ↔ Backend)

Base origin: `VITE_API_ORIGIN` (default `http://localhost:8080`)  
API prefix: `/api` (handled in frontend constants)

## Auth
- `POST /api/auth/login` → `auth.service.ts` (`login`)
- `POST /api/auth/register` → `auth.service.ts` (`register`)
- `POST /api/auth/logout` → `auth.service.ts` (`logout`)
- `POST /api/auth/refresh` → `auth.service.ts` (`refreshToken`)
- `GET /api/user` → `auth.service.ts` (`getCurrentUser`)

## Payroll
- `GET /api/payrolls` → `payroll.service.ts` (`getAll`)
- `POST /api/payrolls` → `payroll.service.ts` (`generate`)
- `GET /api/payrolls/{id}` → `payroll.service.ts` (`getById`)
- `POST /api/payrolls/{id}/approve` → `payroll.service.ts` (`approve`)
- `POST /api/payrolls/{id}/lock` → `payroll.service.ts` (`lock`)
- `GET /api/payrolls/{id}/export` → `payroll.service.ts` (`downloadExport`)
- `GET /api/payrolls/my-salary` → `payroll.service.ts` (`getMySalary`)

## Reports
- `GET /api/reports/dashboard` → `reports.service.ts` (`getDashboard`)
- `GET /api/reports/payroll-summary` → `reports.service.ts` (`getPayrollSummary`)

## Roles & Permissions
- `GET /api/permissions` → `permissions.service.ts` (`fetchPermissionsPage`)
- `POST /api/roles/{role}/permissions` → `roles.service.ts` (`syncRolePermissions`)

## Generic CRUD resources (Refine data provider)
Mapped by resource name in UI:
- `/api/companies`
- `/api/offices`
- `/api/departments`
- `/api/positions`
- `/api/employees`
- `/api/drivers`
- `/api/users`
- `/api/roles`
- `/api/vehicles`
- `/api/vehicle_assignments`
- `/api/vehicle_expenses`
- `/api/customers`
- `/api/trips`
- `/api/invoices`
- `/api/allowances`
- `/api/deductions`
- `/api/attendances`

Handled centrally by `dataProvider.tsx` using:
- list: `GET /{resource}`
- detail: `GET /{resource}/{id}`
- create: `POST /{resource}`
- update: `PUT /{resource}/{id}`
- delete: `DELETE /{resource}/{id}`
