# Frontend API Endpoints

## Base URL
- Local: `http://localhost:8080`
- API prefix: `/api`

## Auth headers
- Public endpoint: không cần token.
- Auth endpoint: `Authorization: Bearer <token>`
- JSON header: `Content-Type: application/json`

## Public
- `GET /api`
- `GET /api/health`
- `POST /api/auth/login`

## Authenticated (auth:sanctum)
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/user`
- `GET /api/payrolls/my-salary`

## Admin (auth:sanctum + role:admin)

### Auth quản trị
- `POST /api/auth/register`

### Companies
- `GET /api/companies`
- `POST /api/companies`
- `GET /api/companies/{company}`
- `PUT|PATCH /api/companies/{company}`
- `DELETE /api/companies/{company}`

### Offices
- `GET /api/offices`
- `POST /api/offices`
- `GET /api/offices/{office}`
- `PUT|PATCH /api/offices/{office}`
- `DELETE /api/offices/{office}`

### Departments
- `GET /api/departments`
- `POST /api/departments`
- `GET /api/departments/{department}`
- `PUT|PATCH /api/departments/{department}`
- `DELETE /api/departments/{department}`

### Positions
- `GET /api/positions`
- `POST /api/positions`
- `GET /api/positions/{position}`
- `PUT|PATCH /api/positions/{position}`
- `DELETE /api/positions/{position}`

### Employees
- `GET /api/employees`
- `POST /api/employees`
- `GET /api/employees/{employee}`
- `PUT|PATCH /api/employees/{employee}`
- `DELETE /api/employees/{employee}`

### Drivers
- `GET /api/drivers`
- `POST /api/drivers`
- `GET /api/drivers/{driver}`
- `PUT|PATCH /api/drivers/{driver}`
- `DELETE /api/drivers/{driver}`

### Users
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/{user}`
- `PUT|PATCH /api/users/{user}`
- `DELETE /api/users/{user}`

### Roles & Permissions
- `GET /api/roles`
- `POST /api/roles`
- `GET /api/roles/{role}`
- `PUT|PATCH /api/roles/{role}`
- `DELETE /api/roles/{role}`
- `POST /api/roles/{role}/permissions`
- `GET /api/permissions`
- `GET /api/permissions/{permission}`

### Vehicles
- `GET /api/vehicles`
- `POST /api/vehicles`
- `GET /api/vehicles/{vehicle}`
- `PUT|PATCH /api/vehicles/{vehicle}`
- `DELETE /api/vehicles/{vehicle}`

### Vehicle Assignments
- `GET /api/vehicle_assignments`
- `POST /api/vehicle_assignments`
- `GET /api/vehicle_assignments/{vehicle_assignment}`
- `PUT|PATCH /api/vehicle_assignments/{vehicle_assignment}`
- `DELETE /api/vehicle_assignments/{vehicle_assignment}`

### Vehicle Expenses
- `GET /api/vehicle_expenses`
- `POST /api/vehicle_expenses`
- `GET /api/vehicle_expenses/{vehicle_expense}`
- `PUT|PATCH /api/vehicle_expenses/{vehicle_expense}`
- `DELETE /api/vehicle_expenses/{vehicle_expense}`

### Customers
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/{customer}`
- `PUT|PATCH /api/customers/{customer}`
- `DELETE /api/customers/{customer}`

### Trips
- `GET /api/trips`
- `POST /api/trips`
- `GET /api/trips/{trip}`
- `PUT|PATCH /api/trips/{trip}`
- `DELETE /api/trips/{trip}`

### Trip Bonus Rules
- `GET /api/trip_bonus_rules`
- `POST /api/trip_bonus_rules`
- `GET /api/trip_bonus_rules/{trip_bonus_rule}`
- `PUT|PATCH /api/trip_bonus_rules/{trip_bonus_rule}`
- `DELETE /api/trip_bonus_rules/{trip_bonus_rule}`

### Invoices
- `GET /api/invoices`
- `POST /api/invoices`
- `GET /api/invoices/{invoice}`
- `PUT|PATCH /api/invoices/{invoice}`
- `DELETE /api/invoices/{invoice}`

### Allowances
- `GET /api/allowances`
- `POST /api/allowances`
- `GET /api/allowances/{allowance}`
- `PUT|PATCH /api/allowances/{allowance}`
- `DELETE /api/allowances/{allowance}`

### Deductions
- `GET /api/deductions`
- `POST /api/deductions`
- `GET /api/deductions/{deduction}`
- `PUT|PATCH /api/deductions/{deduction}`
- `DELETE /api/deductions/{deduction}`

### Attendances
- `GET /api/attendances`
- `POST /api/attendances`
- `GET /api/attendances/{attendance}`
- `PUT|PATCH /api/attendances/{attendance}`
- `DELETE /api/attendances/{attendance}`

### Payrolls
- `GET /api/payrolls`
- `POST /api/payrolls`
- `GET /api/payrolls/{payroll}`
- `PUT|PATCH /api/payrolls/{payroll}`
- `DELETE /api/payrolls/{payroll}`
- `POST /api/payrolls/{id}/approve`
- `POST /api/payrolls/{id}/lock`
- `GET /api/payrolls/{id}/export`

### Chat (AI Assistant)
- `GET /api/chat/sessions` (Lấy danh sách các phiên chat)
- `DELETE /api/chat/sessions/{sessionId}` (Xoá phiên chat)
- `GET /api/chat/messages` (Truyền `session_id`, `limit` để lấy lịch sử)
- `POST /api/chat/messages` (Gửi chat JSON thông thường)
- `POST /api/chat/messages/stream` (Gửi chat và nhận dữ liệu qua SSE/Stream)

### Reports
- `GET /api/reports/dashboard`
- `GET /api/reports/payroll-summary`

## API v2 (Clean Architecture, admin + throttle)
- `GET /api/v2/employees`
- `POST /api/v2/employees`
- `GET /api/v2/employees/{employee}`
- `PUT /api/v2/employees/{employee}`
- `DELETE /api/v2/employees/{employee}`

## Swagger (nội bộ)
- `GET /api/documentation`

## Response envelope chuẩn
- Success:
```json
{ "success": true, "message": "...", "data": ... }
```
- Error:
```json
{ "success": false, "message": "...", "errors": ... }
```
