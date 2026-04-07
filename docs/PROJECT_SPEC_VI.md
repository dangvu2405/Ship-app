# Đặc tả chi tiết dự án Ship App

## 1. Thông tin tài liệu
- Tên dự án: Ship App (ERP Admin Dashboard cho HR + Fleet + Payroll)
- Phiên bản tài liệu: 1.0
- Ngày cập nhật: 08/04/2026
- Mục đích: Làm tài liệu planning, chia sprint, ước lượng và làm chuẩn nghiệm thu.

## 2. Mục tiêu sản phẩm
Xây dựng hệ thống web quản trị vận hành doanh nghiệp vận tải, tập trung vào:
1. Quản trị tổ chức (công ty, văn phòng, phòng ban, chức danh).
2. Quản trị nhân sự và phương tiện vận tải.
3. Quản trị vận hành chuyến đi và chi phí liên quan.
4. Quản trị công lương (attendance, allowances, deductions, payroll).
5. Quản trị người dùng, vai trò và quyền.
6. Dashboard và báo cáo điều hành.

## 3. Đối tượng sử dụng
- Admin: toàn quyền cấu hình và quản trị dữ liệu.
- HR/Payroll: quản lý nhân sự, công, lương.
- Fleet/Operations: quản lý xe, tài xế, chuyến đi, chi phí.
- Manager/Viewer: theo dõi dashboard, báo cáo.

## 4. Phạm vi chức năng

### 4.1 Chức năng lõi bắt buộc
- Đăng nhập/đăng ký/đăng xuất.
- Quản lý phiên làm việc và token.
- CRUD các phân hệ dữ liệu chính.
- Dashboard thống kê.
- Báo cáo payroll summary.
- Phân quyền người dùng theo role.
- Xử lý lỗi API tập trung và toast thông báo chuẩn hóa.

### 4.2 Ngoài phạm vi (giai đoạn sau)
- Đồng bộ realtime qua websocket.
- Tích hợp thanh toán/hóa đơn điện tử nâng cao.
- Tích hợp đối tác vận tải bên thứ 3.
- Workflow phê duyệt đa cấp nâng cao.

## 5. Kiến trúc và công nghệ
- Frontend: React 18 + TypeScript + Vite.
- UI: TailwindCSS + Headless UI.
- Routing: React Router v6.
- Networking: Axios với interceptor toàn cục.
- State: Zustand.
- Notification: react-hot-toast.
- Charts: Recharts.

## 6. Quy chuẩn kỹ thuật hệ thống

### 6.1 Chuẩn API client
- Dùng duy nhất service API trung tâm.
- Header mặc định: JSON request/response.
- Có gửi cookie (`withCredentials=true`).
- Auto inject `Authorization` từ local storage nếu có token.

### 6.2 Chuẩn xử lý lỗi
- 401: xoá token, thông báo hết phiên, chuyển về login.
- 403: thông báo không có quyền.
- 5xx: thông báo lỗi máy chủ.
- Timeout: thông báo hết thời gian chờ.
- Network error: thông báo lỗi kết nối.
- Chống spam toast bằng cơ chế dedupe (1.5 giây).

### 6.3 Mode xử lý lỗi theo request
- `global`: hệ thống xử lý toast lỗi toàn cục.
- `local`: component tự xử lý lỗi.
- `silent`: không hiển thị toast lỗi.

## 7. Đặc tả chi tiết từng phân hệ

## 7.1 Authentication
### Mục tiêu
Xác thực người dùng và đảm bảo an toàn phiên.

### Chức năng
1. Đăng nhập (`/auth/login`).
2. Đăng ký (`/auth/register`).
3. Đăng xuất (`/auth/logout`).
4. Lấy thông tin người dùng hiện tại (`/user`).
5. Refresh token (`/auth/refresh`).

### Quy tắc nghiệp vụ
- Đăng nhập thành công phải lưu token (nếu backend trả token).
- Route protected bắt buộc có phiên hợp lệ.
- Nếu 401 ở bất kỳ API protected nào, buộc đăng nhập lại.

### Tiêu chí nghiệm thu
- User login thành công truy cập được module protected.
- User hết phiên bị chuyển về login tự động.

---

## 7.2 Dashboard
### Mục tiêu
Cung cấp số liệu tổng quan hoạt động.

### Chức năng
1. Thống kê tổng và active của companies/employees/vehicles.
2. Thống kê trips (total, pending, completed).
3. Thống kê payrolls (total, pending, completed).
4. Lọc dữ liệu theo tháng/năm.

### API liên quan
- `GET /reports/dashboard?month=&year=`

### Tiêu chí nghiệm thu
- Dashboard hiển thị đủ nhóm KPI.
- Đổi tháng/năm cập nhật đúng dữ liệu.

---

## 7.3 Companies
### Mục tiêu
Quản trị công ty trong hệ thống.

### Chức năng
1. Danh sách + phân trang + tìm kiếm + lọc trạng thái.
2. Tạo mới công ty.
3. Sửa thông tin công ty.
4. Xem chi tiết công ty.
5. Xóa công ty.

### Dữ liệu chính
- code, name, tax_code, address, phone, email, status.

### API
- `GET /companies`
- `GET /companies/{id}`
- `POST /companies`
- `PUT /companies/{id}`
- `DELETE /companies/{id}`

### Nghiệp vụ
- `code` và `name` là định danh nghiệp vụ quan trọng.
- Không cho xóa nếu có ràng buộc dữ liệu phụ thuộc (do backend quyết định).

---

## 7.4 Offices
### Mục tiêu
Quản lý chi nhánh/văn phòng thuộc công ty.

### Chức năng
- CRUD đầy đủ (list/create/edit/show/delete).

### Dữ liệu chính
- code, name, address, company_id, manager_id.

### Nghiệp vụ
- Văn phòng phải thuộc một công ty hợp lệ.

---

## 7.5 Departments
### Mục tiêu
Quản lý cấu trúc phòng ban.

### Chức năng
- CRUD đầy đủ.

### Dữ liệu chính
- code, name, office_id, parent_id.

### Nghiệp vụ
- Có thể hỗ trợ phòng ban cha-con qua `parent_id`.

---

## 7.6 Positions
### Mục tiêu
Quản lý chức danh và cấu hình lương cơ bản.

### Chức năng
- CRUD đầy đủ.

### Dữ liệu chính
- code, name, base_salary, level, description.

### Nghiệp vụ
- `base_salary` là dữ liệu đầu vào cho tính lương.

---

## 7.7 Employees
### Mục tiêu
Quản lý hồ sơ nhân sự.

### Chức năng
1. Danh sách + lọc theo loại nhân viên + trạng thái + search.
2. Tạo mới nhân viên.
3. Sửa thông tin nhân viên.
4. Xem chi tiết.
5. Xóa nhân viên.

### Dữ liệu chính
- code, name, email, phone, type (`office`/`driver`), status.
- liên kết office/department/position.

### API
- `GET /employees`
- `GET /employees/{id}`
- `POST /employees`
- `PUT /employees/{id}`
- `DELETE /employees/{id}`

### Nghiệp vụ
- Nhân viên loại `driver` có thể được liên kết hồ sơ tài xế.

---

## 7.8 Drivers
### Mục tiêu
Quản lý thông tin tài xế chuyên biệt.

### Chức năng
- CRUD đầy đủ.

### Dữ liệu chính
- employee_id, license_no, license_class, expired_date, available_status.

### Nghiệp vụ
- Driver phải liên kết với một employee hợp lệ.
- Cảnh báo khi giấy phép sắp hết hạn (đề xuất giai đoạn sau).

---

## 7.9 Vehicles
### Mục tiêu
Quản lý đội xe vận hành.

### Chức năng
1. Danh sách + lọc theo office, status.
2. Tạo mới/sửa/xem/xóa xe.

### Dữ liệu chính
- plate_number, type, brand, model, year, capacity, status, office_id.

### API
- `GET /vehicles`
- `GET /vehicles/{id}`
- `POST /vehicles`
- `PUT /vehicles/{id}`
- `DELETE /vehicles/{id}`

### Nghiệp vụ
- Biển số xe phải duy nhất theo chính sách backend.

---

## 7.10 Vehicle Assignments
### Mục tiêu
Gán xe cho tài xế theo giai đoạn thời gian.

### Chức năng
- CRUD đầy đủ.

### Dữ liệu chính
- vehicle_id, driver_id, from_date, to_date.

### Nghiệp vụ
- Không cho trùng lịch gán xe trong cùng khoảng thời gian (backend validate).

---

## 7.11 Vehicle Expenses
### Mục tiêu
Theo dõi chi phí vận hành xe.

### Chức năng
- CRUD đầy đủ.

### Dữ liệu chính
- vehicle_id, driver_id, type, amount, expense_date, note.

### Nghiệp vụ
- `amount` phải lớn hơn 0.

---

## 7.12 Customers
### Mục tiêu
Quản lý khách hàng doanh nghiệp/cá nhân.

### Chức năng
- CRUD đầy đủ.

### Dữ liệu chính
- name, type (`company`/`individual`), tax_code, email, phone, address, contact_person.

---

## 7.13 Trips
### Mục tiêu
Quản lý chuyến đi vận tải.

### Chức năng
1. Danh sách + lọc theo status/driver/vehicle.
2. Tạo chuyến đi.
3. Cập nhật chuyến đi.
4. Xem chi tiết chuyến.
5. Xóa chuyến.

### Dữ liệu chính
- code, customer_id, driver_id, vehicle_id.
- start_point, end_point, distance_km, price.
- status, start_time, end_time.

### API
- `GET /trips`
- `GET /trips/{id}`
- `POST /trips`
- `PUT /trips/{id}`
- `DELETE /trips/{id}`

### Nghiệp vụ
- Driver và vehicle phải sẵn sàng trước khi tạo chuyến.
- Trạng thái chuyến cần theo workflow chuẩn (config backend).

---

## 7.14 Invoices
### Mục tiêu
Quản lý hóa đơn liên quan khách hàng/chuyến đi.

### Chức năng
- CRUD đầy đủ.

### Dữ liệu chính
- code, customer_id, trip_id, total_amount, tax_amount, issued_at, due_date, status.

---

## 7.15 Allowances
### Mục tiêu
Quản lý loại phụ cấp.

### Chức năng
- CRUD đầy đủ.

### Dữ liệu chính
- code, name, default_amount, taxable.

---

## 7.16 Deductions
### Mục tiêu
Quản lý loại khấu trừ.

### Chức năng
- CRUD đầy đủ.

### Dữ liệu chính
- code, name.

---

## 7.17 Attendances
### Mục tiêu
Quản lý chấm công nhân sự.

### Chức năng
- CRUD đầy đủ.

### Dữ liệu chính
- employee_id, date, check_in, check_out, work_hours, overtime_hours, status.

### Nghiệp vụ
- Một nhân viên chỉ nên có một bản ghi công trên một ngày (backend validate).

---

## 7.18 Payrolls
### Mục tiêu
Quản lý bảng lương theo tháng/năm.

### Chức năng
1. Danh sách bảng lương theo tháng/năm/trạng thái.
2. Xem chi tiết bảng lương.
3. Tạo/generate bảng lương theo công ty-tháng-năm.
4. Approve bảng lương.
5. Lock bảng lương.
6. Export dữ liệu bảng lương.
7. Xem lương cá nhân (`my-salary`).

### API
- `GET /payrolls`
- `GET /payrolls/{id}`
- `POST /payrolls` (generate)
- `POST /payrolls/{id}/approve`
- `POST /payrolls/{id}/lock`
- `GET /payrolls/{id}/export`
- `GET /payrolls/my-salary`

### Dữ liệu chi tiết lương
- base_salary, working_days, overtime, bonus, allowance, deduction, fuel_cost, tax, net_salary.

### Nghiệp vụ
- Bảng lương `locked` không được sửa.
- Chỉ role được phép mới có thể approve/lock.

---

## 7.19 Reports
### Mục tiêu
Cung cấp báo cáo phục vụ điều hành.

### Chức năng
1. Báo cáo dashboard theo kỳ.
2. Payroll summary theo công ty-tháng-năm.

### API
- `GET /reports/dashboard`
- `GET /reports/payroll-summary`

---

## 7.20 Users
### Mục tiêu
Quản trị tài khoản truy cập hệ thống.

### Chức năng
- CRUD đầy đủ.
- Gán quan hệ employee và role.

### Dữ liệu chính
- username, email, employee_id, status, roles.

---

## 7.21 Roles & Permissions
### Mục tiêu
Quản trị phân quyền truy cập.

### Chức năng
1. CRUD role.
2. Lấy danh sách permission theo trang.
3. Đồng bộ permission cho role.

### API liên quan
- `GET /permissions?page=&per_page=`
- `POST /roles/{roleId}/permissions` với `permission_ids[]`.

### Nghiệp vụ
- Quyền được áp dụng theo role.
- UI cần ẩn/khóa action không có quyền.

---

## 8. Đặc tả route

### Public route
- `/login`
- `/register`

### Protected route
- `/dashboard`
- `/admin/*` cho các resource CRUD:
  - companies, offices, departments, positions, employees, vehicles, trips,
  - customers, drivers, invoices, vehicle_assignments, vehicle_expenses,
  - allowances, deductions, attendances, payrolls, reports, users, roles.

### Mẫu route CRUD
- list: `/admin/{resource}`
- create: `/admin/{resource}/create`
- edit: `/admin/{resource}/edit/:id`
- show: `/admin/{resource}/show/:id`

## 9. Chuẩn phân quyền (đề xuất)
- Admin: full CRUD + approve/lock payroll + phân quyền.
- Manager: xem báo cáo, dashboard, duyệt một số nghiệp vụ theo chính sách.
- Operator: CRUD module vận hành (trip, vehicle assignment, vehicle expense).
- HR/Payroll: CRUD employee/attendance/allowance/deduction + payroll ops.
- Viewer: chỉ xem danh sách/chi tiết và báo cáo.

## 10. Yêu cầu UI/UX
- Mọi trang list có: filter, pagination, loading, empty state, error state.
- Mọi thao tác create/update/delete có feedback toast thành công/thất bại.
- Form có validate rõ ràng theo field.
- Responsive cho desktop/laptop.

## 11. Yêu cầu chất lượng

### 11.1 Hiệu năng
- Tải màn hình list ban đầu dưới 2.5 giây (mạng nội bộ chuẩn).
- Tương tác filter/sort không gây giật UI.

### 11.2 Bảo mật
- Không log token vào console.
- Điều hướng login ngay khi mất phiên.
- Tôn trọng phân quyền cả frontend và backend.

### 11.3 Độ ổn định
- Không crash khi API trả lỗi.
- Duy trì trải nghiệm nhất quán khi timeout/network lỗi.

## 12. Test plan

### 12.1 Unit test
- `errorHandler`, helper route, utils xử lý dữ liệu.
- service layer mapping response.

### 12.2 Integration test
- Auth flow.
- CRUD chuẩn cho từng resource chính (companies/employees/vehicles/trips/payrolls/users/roles).

### 12.3 E2E test
- Login -> Dashboard -> CRUD mẫu -> Logout.
- Case 401 auto redirect về login.
- Case role không quyền không thao tác được.

## 13. Kế hoạch triển khai đề xuất

### Sprint 1
- Auth + API core + route protection + error handling.

### Sprint 2
- Master data: companies, offices, departments, positions, employees, users.

### Sprint 3
- Fleet & operations: vehicles, drivers, trips, assignments, expenses, customers, invoices.

### Sprint 4
- Payroll suite: allowances, deductions, attendances, payrolls, reports.

### Sprint 5
- Ổn định, tối ưu UX, kiểm thử tổng thể, UAT, release.

## 14. Acceptance criteria tổng
1. Tất cả module trong phạm vi có route và CRUD hoạt động.
2. Auth/session hoạt động xuyên suốt, xử lý 401 đúng chuẩn.
3. Dashboard/reports trả dữ liệu theo kỳ tháng-năm.
4. Payroll flow có generate/approve/lock/export và my-salary.
5. Role-permission áp dụng đúng ở menu, route và action.
6. Không có lỗi blocker trong UAT.

## 15. Danh sách cần chốt thêm với nghiệp vụ
1. Workflow trạng thái chi tiết của trip và invoice.
2. Chính sách tính lương cụ thể (OT, thuế, phụ cấp, khấu trừ).
3. Quy tắc khóa/mở khóa payroll khi đã lock.
4. Danh mục permission matrix chi tiết theo vai trò.
5. Chính sách xóa cứng/xóa mềm cho từng resource.

---
Tài liệu này là baseline để lên planning chi tiết theo Epic/Story/Task và estimate ngày công.