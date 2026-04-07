# Mô tả các trang chính — Ship ERP (`ship-app`)

Thư mục này chứa ảnh chụp màn hình căn theo luồng dùng thường gặp. **Ứng dụng web** là `ship-app` (React + Refine + Vite); **API** là `ship-app-api` (Laravel). Các trang sau đăng nhập yêu cầu **tài khoản có vai trò admin** để truy cập đầy đủ (theo `routes/api.php` và middleware phía backend).

## Cấu trúc chung giao diện

- **Thanh bên (sidebar):** điều hướng theo module (công ty, nhân sự, vận hành, lương, báo cáo, hệ thống).
- **Header:** tìm kiếm, đổi ngôn ngữ / theme, thông báo, menu người dùng.
- **Vùng nội dung:** danh sách (bảng + lọc + phân trang), biểu đồ (dashboard / báo cáo), hoặc form trong dialog tùy route.

Các file ảnh được tạo bằng script `scripts/capture-screens.mjs` (`npm run screenshots`). Chi tiết môi trường chạy (proxy API, Vite) xem phần cuối file.

---

## Danh sách ảnh và route tương ứng

| Ảnh | Route (path) | Mục đích trang |
|-----|----------------|-----------------|
| `01-login.png` | `/login` | Đăng nhập: email/mật khẩu, giao diện tiếng Việt, liên kết quên mật khẩu / đăng ký (nếu bật). |
| `02-dashboard.png` | `/dashboard` | **Bảng điều khiển:** thống kê tổng quan (công ty, nhân viên, xe, chuyến), biểu đồ, bảng chuyến gần đây. |
| `03-admin-companies.png` | `/admin/companies` | **Công ty:** CRUD danh sách công ty. |
| `04-admin-offices.png` | `/admin/offices` | **Văn phòng:** quản lý văn phòng theo công ty. |
| `05-admin-departments.png` | `/admin/departments` | **Phòng ban:** cấu trúc tổ chức nội bộ. |
| `06-admin-positions.png` | `/admin/positions` | **Chức vụ:** master data chức danh. |
| `07-admin-employees.png` | `/admin/employees` | **Nhân viên:** hồ sơ nhân viên, liên kết phòng ban/chức vụ. |
| `08-admin-vehicles.png` | `/admin/vehicles` | **Xe:** danh mục phương tiện. |
| `09-admin-trips.png` | `/admin/trips` | **Chuyến đi:** quản lý chuyến vận chuyển. |
| `10-admin-customers.png` | `/admin/customers` | **Khách hàng:** danh sách khách hàng. |
| `11-admin-drivers.png` | `/admin/drivers` | **Tài xế:** quản lý tài xế / hồ sơ lái xe. |
| `12-admin-invoices.png` | `/admin/invoices` | **Hóa đơn:** hóa đơn liên quan vận hành. |
| `13-admin-vehicle-assignments.png` | `/admin/vehicle_assignments` | **Phân công xe:** gán xe — tài xế / thời gian. |
| `14-admin-vehicle-expenses.png` | `/admin/vehicle_expenses` | **Chi phí xe:** nhiên liệu, bảo dưỡng, v.v. |
| `15-admin-allowances.png` | `/admin/allowances` | **Phụ cấp:** master phụ cấp lương. |
| `16-admin-deductions.png` | `/admin/deductions` | **Khấu trừ:** master khoản khấu trừ. |
| `17-admin-attendances.png` | `/admin/attendances` | **Chấm công:** dữ liệu chấm công theo nhân viên/ngày. |
| `18-admin-payrolls.png` | `/admin/payrolls` | **Bảng lương:** danh sách kỳ lương, trạng thái (nháp / duyệt / khóa), thao tác liên quan payroll. |
| `19-admin-reports.png` | `/admin/reports` | **Báo cáo:** dashboard báo cáo / tổng hợp (ví dụ payroll). |
| `20-admin-users.png` | `/admin/users` | **Người dùng:** tài khoản hệ thống, gán vai trò. |
| `21-admin-roles.png` | `/admin/roles` | **Vai trò & quyền:** quản lý role, đồng bộ permission. |
| `22-admin-profile.png` | `/admin/profile` | **Hồ sơ cá nhân:** thông tin user đang đăng nhập. |
| `23-admin-settings.png` | `/admin/settings` | **Cài đặt:** tùy chọn ứng dụng / giao diện (theo implementation hiện tại). |

---

## Route bổ sung (chưa có ảnh riêng trong bộ chụp mặc định)

Ứng dụng còn định nghĩa các route **create / show / edit** dạng REST cho từng resource, ví dụ:

- `/admin/<resource>/create`
- `/admin/<resource>/show/:id`
- `/admin/<resource>/edit/:id`

Phần lớn mở dưới dạng **trang full hoặc dialog** tùy từng module — có thể bổ sung ảnh bằng cách mở rộng `scripts/capture-screens.mjs`.

---

## Tạo lại bộ ảnh

1. Chạy API Laravel (ví dụ `php artisan serve` trên cổng khớp proxy, thường là `8080`).
2. Chạy frontend với proxy `/api` — tránh để `VITE_API_BASE_URL` trỏ tới cổng không chạy API (xem comment trong `scripts/capture-screens.mjs`). Tiện dụng: `npm run dev:api-proxy`.
3. Trong thư mục `ship-app`: `npm run screenshots`.

Ảnh mặc định dùng tài khoản `SCREENSHOT_EMAIL` / `SCREENSHOT_PASSWORD` (hoặc admin seed `admin@abctransport.com` / `password`).

---

*Tài liệu này mô tả nội dung nghiệp vụ và định tuyến tương ứng với các file PNG trong thư mục hiện tại.*
