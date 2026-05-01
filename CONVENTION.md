# CETA — WEB QUẢN LÝ VẬN TẢI
#đoc# SPEC ĐẦY ĐỦ: DATABASE + LUỒNG NGHIỆP VỤ + THIẾT KẾ MÀN HÌNH
**Version:** 1.0 | **Stack:** Laravel + MySQL 8.0 | **Ngày:** 2026-04-30

---

# MỤC LỤC

- [PHẦN 1 — DATABASE (43 bảng)](#phần-1)
- [PHẦN 2 — LUỒNG NGHIỆP VỤ](#phần-2)
- [PHẦN 3 — THIẾT KẾ MÀN HÌNH](#phần-3)

---

# PHẦN 1 — DATABASE

## 1.1 Sơ đồ nhóm bảng

```
PLATFORM              DANH MỤC              KHÁCH HÀNG
──────────────        ──────────────        ──────────────
companies             vehicle_types         customer_groups
users                 cargo_types           customers
user_permissions      locations             price_lists
audit_logs            route_templates       price_list_items
                      cost_categories
                      order_status_configs

PHƯƠNG TIỆN           TÀI XẾ               LỊCH LÀM VIỆC
──────────────        ──────────────        ──────────────
vehicles              driver_teams          leave_types
vehicle_documents     drivers               leave_requests
vehicle_assignments   driver_documents      driver_work_schedules
spare_parts
maintenance_schedules
maintenance_records

ĐƠN HÀNG              CHI PHÍ              KẾ TOÁN
──────────────        ──────────────        ──────────────
trips                 trip_costs            reconciliation_sessions
trip_stops            cost_approval_        reconciliation_items
trip_surcharges         requests            payment_records
trip_documents
trip_status_histories

HÓA ĐƠN              THÔNG BÁO             CHAT / AI
──────────────        ──────────────        ──────────────
invoices              notifications         chat_messages
invoice_status_                             knowledge_articles
  histories                                 rag_index
                                            report_caches
```

---

## 1.2 Chi tiết từng bảng

### [P1] `companies` — Công ty / Tenant
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| code | VARCHAR(50) | NO | — | Mã công ty. UNIQUE |
| name | VARCHAR(255) | NO | — | Tên công ty |
| tax_code | VARCHAR(50) | YES | NULL | Mã số thuế |
| address | TEXT | YES | NULL | Địa chỉ |
| phone | VARCHAR(20) | YES | NULL | |
| email | VARCHAR(255) | YES | NULL | |
| status | ENUM | NO | active | active / inactive |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | Soft delete |

---

### [P2] `users` — Tài khoản người dùng
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| username | VARCHAR(255) | NO | — | UNIQUE |
| email | VARCHAR(255) | NO | — | UNIQUE |
| full_name | VARCHAR(200) | YES | NULL | Họ và tên |
| phone | VARCHAR(20) | YES | NULL | |
| password | VARCHAR(255) | NO | — | bcrypt |
| avatar_url | VARCHAR(255) | YES | NULL | |
| role | ENUM | NO | dispatcher | super_admin / admin / dispatcher / accountant / viewer |
| status | ENUM | NO | active | active / inactive |
| must_change_password | TINYINT(1) | NO | 0 | |
| last_login_at | TIMESTAMP | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [P3] `user_permissions` — Phân quyền theo module
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| user_id | BIGINT FK | NO | — | → users |
| module | VARCHAR(50) | NO | — | orders / vehicles / drivers / accounting / reports / settings |
| can_view | TINYINT(1) | NO | 0 | |
| can_create | TINYINT(1) | NO | 0 | |
| can_edit | TINYINT(1) | NO | 0 | |
| can_delete | TINYINT(1) | NO | 0 | |
| can_approve | TINYINT(1) | NO | 0 | |
| can_export | TINYINT(1) | NO | 0 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |

**UNIQUE:** (company_id, user_id, module)

---

### [P4] `audit_logs` — Lịch sử thao tác
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| user_id | BIGINT FK | YES | NULL | → users (NULL = system) |
| company_id | BIGINT FK | YES | NULL | → companies |
| action | VARCHAR(100) | NO | — | create/update/delete/login/export/approve |
| table_name | VARCHAR(100) | NO | — | Tên bảng bị tác động |
| record_id | BIGINT | YES | NULL | ID bản ghi bị tác động |
| old_data | JSON | YES | NULL | Giá trị trước |
| new_data | JSON | YES | NULL | Giá trị sau |
| ip_address | VARCHAR(45) | YES | NULL | |
| user_agent | VARCHAR(512) | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |

> Không có updated_at. Không UPDATE, không DELETE bảng này.

---

### [D1] `vehicle_types` — Loại phương tiện
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| name | VARCHAR(100) | NO | — | Xe tải 5T, Đầu kéo... |
| max_load_ton | DECIMAL(6,2) | YES | NULL | Tải trọng tối đa |
| volume_m3 | DECIMAL(8,2) | YES | NULL | Thể tích thùng |
| required_license_class | VARCHAR(10) | YES | NULL | B2/C/D/E/FC |
| description | TEXT | YES | NULL | |
| is_active | TINYINT(1) | NO | 1 | |
| sort_order | INT | NO | 0 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [D2] `cargo_types` — Loại hàng hóa
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| name | VARCHAR(100) | NO | — | Hàng thường, Hàng lạnh... |
| requires_special_vehicle | TINYINT(1) | NO | 0 | Cần xe chuyên dụng |
| special_requirements | TEXT | YES | NULL | Yêu cầu đặc biệt |
| is_active | TINYINT(1) | NO | 1 | |
| sort_order | INT | NO | 0 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [D3] `locations` — Điểm giao/nhận hàng
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| name | VARCHAR(200) | NO | — | Kho Bình Dương, Cảng Cát Lái... |
| address | TEXT | NO | — | Địa chỉ đầy đủ |
| province | VARCHAR(100) | YES | NULL | Tỉnh/Thành phố |
| district | VARCHAR(100) | YES | NULL | Quận/Huyện |
| lat | DECIMAL(10,8) | YES | NULL | Vĩ độ |
| lng | DECIMAL(11,8) | YES | NULL | Kinh độ |
| contact_name | VARCHAR(200) | YES | NULL | Người LH tại điểm |
| contact_phone | VARCHAR(20) | YES | NULL | |
| open_time | TIME | YES | NULL | Giờ mở cửa |
| close_time | TIME | YES | NULL | Giờ đóng cửa |
| notes | TEXT | YES | NULL | Cổng B, gặp anh Nam... |
| customer_id | BIGINT FK | YES | NULL | → customers (kho cố định) |
| is_active | TINYINT(1) | NO | 1 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [D4] `route_templates` — Tuyến đường mẫu
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| name | VARCHAR(200) | NO | — | HCM → Bình Dương |
| origin_location_id | BIGINT FK | YES | NULL | → locations |
| destination_location_id | BIGINT FK | YES | NULL | → locations |
| distance_km | DECIMAL(8,2) | YES | NULL | |
| estimated_hours | DECIMAL(4,1) | YES | NULL | Giờ dự kiến |
| default_price | DECIMAL(15,2) | YES | NULL | Giá mặc định |
| fuel_norm_liter | DECIMAL(6,2) | YES | NULL | Định mức nhiên liệu |
| toll_norm | DECIMAL(12,2) | YES | NULL | Định mức cầu đường |
| notes | TEXT | YES | NULL | |
| is_active | TINYINT(1) | NO | 1 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [D5] `cost_categories` — Loại chi phí
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| code | VARCHAR(50) | NO | — | FUEL/TOLL/LOADING/WAITING/REPAIR/OTHER |
| name | VARCHAR(100) | NO | — | Nhiên liệu, Cầu đường... |
| requires_receipt | TINYINT(1) | NO | 0 | Bắt buộc upload chứng từ |
| approval_threshold | DECIMAL(15,2) | YES | NULL | NULL = không cần duyệt |
| is_active | TINYINT(1) | NO | 1 | |
| sort_order | INT | NO | 0 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

**UNIQUE:** (company_id, code)

---

### [D6] `order_status_configs` — Cấu hình trạng thái đơn hàng
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| code | VARCHAR(50) | NO | — | NEW/ASSIGNED/IN_TRANSIT/DELIVERED/COMPLETED/CANCELLED |
| name | VARCHAR(100) | NO | — | Tên hiển thị |
| color | VARCHAR(7) | YES | NULL | Màu hex: #3B82F6 |
| is_terminal | TINYINT(1) | NO | 0 | Trạng thái kết thúc |
| sort_order | INT | NO | 0 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |

**UNIQUE:** (company_id, code)

---

### [C1] `customer_groups` — Nhóm khách hàng
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| name | VARCHAR(100) | NO | — | VIP, Thường xuyên, Mới |
| description | TEXT | YES | NULL | |
| assigned_dispatcher_id | BIGINT FK | YES | NULL | → users |
| is_active | TINYINT(1) | NO | 1 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [C2] `customers` — Khách hàng
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| code | VARCHAR(50) | NO | — | KH-00001. UNIQUE per company |
| type | ENUM | NO | individual | company / individual |
| company_name | VARCHAR(300) | YES | NULL | Tên công ty (khi type=company) |
| name | VARCHAR(255) | NO | — | Tên người liên hệ chính |
| full_name | VARCHAR(200) | YES | NULL | (alias cho name) |
| extra_contact_name | VARCHAR(200) | YES | NULL | Người LH thứ 2 |
| extra_contact_phone | VARCHAR(20) | YES | NULL | |
| tax_code | VARCHAR(50) | YES | NULL | Mã số thuế |
| phone | VARCHAR(20) | YES | NULL | |
| email | VARCHAR(255) | YES | NULL | |
| address | TEXT | YES | NULL | |
| group_id | BIGINT FK | YES | NULL | → customer_groups |
| assigned_dispatcher_id | BIGINT FK | YES | NULL | → users |
| credit_limit | DECIMAL(15,2) | YES | NULL | NULL = không giới hạn |
| payment_terms_days | INT UNSIGNED | YES | NULL | Số ngày được nợ |
| contract_file_url | VARCHAR(500) | YES | NULL | |
| contract_start_date | DATE | YES | NULL | |
| contract_end_date | DATE | YES | NULL | |
| notes | TEXT | YES | NULL | |
| is_active | TINYINT(1) | NO | 1 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [C3] `price_lists` — Bảng giá theo KH
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| customer_id | BIGINT FK | NO | — | → customers |
| name | VARCHAR(200) | NO | — | Bảng giá Q1/2026 |
| effective_from | DATE | NO | — | Ngày có hiệu lực |
| effective_to | DATE | YES | NULL | NULL = vô thời hạn |
| is_active | TINYINT(1) | NO | 1 | |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [C4] `price_list_items` — Chi tiết mức giá
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| price_list_id | BIGINT FK | NO | — | → price_lists |
| route_template_id | BIGINT FK | YES | NULL | → route_templates (NULL = mọi tuyến) |
| vehicle_type_id | BIGINT FK | YES | NULL | → vehicle_types (NULL = mọi loại xe) |
| cargo_type_id | BIGINT FK | YES | NULL | → cargo_types (NULL = mọi loại hàng) |
| price | DECIMAL(15,2) | NO | — | Đơn giá |
| price_unit | ENUM | NO | per_trip | per_trip / per_km / per_ton |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |

---

### [V1] `vehicles` — Xe
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| plate_number | VARCHAR(20) | NO | — | Biển số. UNIQUE |
| vehicle_type_id | BIGINT FK | YES | NULL | → vehicle_types |
| type | ENUM | NO | truck | truck/van/car/motorcycle (legacy) |
| brand | VARCHAR(100) | YES | NULL | |
| model | VARCHAR(100) | YES | NULL | |
| year | YEAR | YES | NULL | Năm sản xuất |
| capacity | INT | YES | NULL | (legacy) |
| max_load_ton | DECIMAL(6,2) | YES | NULL | Tải trọng tối đa |
| volume_m3 | DECIMAL(8,2) | YES | NULL | Thể tích thùng |
| fuel_type | ENUM | YES | NULL | gasoline/diesel/electric/hybrid |
| fuel_consumption | DECIMAL(5,2) | YES | NULL | Lít/100km |
| current_odometer_km | DECIMAL(10,2) | YES | NULL | Km đồng hồ |
| status | ENUM | NO | active | active/maintenance/inactive/broken |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [V2] `vehicle_documents` — Giấy tờ & ảnh xe
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| vehicle_id | BIGINT FK | NO | — | → vehicles |
| doc_type | ENUM | NO | — | registration/inspection/liability_insurance/vehicle_insurance/badge/photo/other |
| doc_name | VARCHAR(200) | NO | — | Đăng kiểm, Bảo hiểm TNDS... |
| doc_number | VARCHAR(100) | YES | NULL | Số giấy tờ |
| issued_date | DATE | YES | NULL | Ngày cấp |
| expiry_date | DATE | YES | NULL | Ngày hết hạn |
| issuer | VARCHAR(200) | YES | NULL | Cơ quan cấp |
| file_url | VARCHAR(500) | YES | NULL | URL file scan |
| alert_before_days | INT UNSIGNED | NO | 30 | Cảnh báo trước X ngày |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [V3] `vehicle_assignments` — Lịch sử tài xế phụ trách xe
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| vehicle_id | BIGINT FK | NO | — | → vehicles |
| driver_id | BIGINT FK | NO | — | → drivers |
| company_id | BIGINT FK | NO | — | → companies |
| from_date | DATE | NO | — | Ngày bắt đầu phụ trách |
| to_date | DATE | YES | NULL | NULL = đang còn hiệu lực |
| release_reason | TEXT | YES | NULL | Lý do kết thúc |
| notes | TEXT | YES | NULL | |
| created_by | BIGINT FK | YES | NULL | → users |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

**Ràng buộc:** Tại mỗi thời điểm, 1 xe chỉ có 1 bản ghi `to_date IS NULL`

---

### [V4] `spare_parts` — Danh mục phụ tùng
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| name | VARCHAR(200) | NO | — | Dầu động cơ, Lốp xe... |
| unit | VARCHAR(50) | YES | NULL | lít, cái, bộ |
| notes | TEXT | YES | NULL | |
| is_active | TINYINT(1) | NO | 1 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |

---

### [V5] `maintenance_schedules` — Lịch bảo dưỡng định kỳ
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| vehicle_id | BIGINT FK | NO | — | → vehicles |
| spare_part_id | BIGINT FK | YES | NULL | → spare_parts |
| task_name | VARCHAR(200) | NO | — | Thay dầu động cơ... |
| interval_type | ENUM | NO | — | by_km / by_days / both |
| interval_km | INT UNSIGNED | YES | NULL | |
| interval_days | INT UNSIGNED | YES | NULL | |
| last_done_km | DECIMAL(10,2) | YES | NULL | |
| last_done_date | DATE | YES | NULL | |
| next_due_km | DECIMAL(10,2) | YES | NULL | |
| next_due_date | DATE | YES | NULL | |
| alert_before_km | INT UNSIGNED | YES | NULL | |
| alert_before_days | INT UNSIGNED | NO | 7 | |
| estimated_cost | DECIMAL(12,2) | YES | NULL | |
| notes | TEXT | YES | NULL | |
| is_active | TINYINT(1) | NO | 1 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [V6] `maintenance_records` — Phiếu sửa chữa thực tế
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| vehicle_id | BIGINT FK | NO | — | → vehicles |
| maintenance_schedule_id | BIGINT FK | YES | NULL | NULL = đột xuất |
| type | ENUM | NO | — | scheduled / unscheduled |
| title | VARCHAR(200) | NO | — | |
| description | TEXT | YES | NULL | |
| odometer_km | DECIMAL(10,2) | YES | NULL | Km lúc đưa vào sửa |
| started_date | DATE | NO | — | |
| completed_date | DATE | YES | NULL | |
| garage_name | VARCHAR(200) | YES | NULL | |
| total_cost | DECIMAL(15,2) | YES | NULL | |
| invoice_number | VARCHAR(100) | YES | NULL | |
| file_url | VARCHAR(500) | YES | NULL | |
| status | ENUM | NO | open | open / in_progress / completed |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [DR1] `driver_teams` — Đội tài xế
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| name | VARCHAR(100) | NO | — | Đội Bắc, Đội Nam... |
| manager_id | BIGINT FK | YES | NULL | → users |
| description | TEXT | YES | NULL | |
| is_active | TINYINT(1) | NO | 1 | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [DR2] `drivers` — Tài xế
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| user_id | BIGINT FK | YES | NULL | → users (tài khoản đăng nhập) |
| code | VARCHAR(50) | NO | — | TX-00001. UNIQUE |
| company_id | BIGINT FK | NO | — | → companies |
| team_id | BIGINT FK | YES | NULL | → driver_teams |
| name | VARCHAR(255) | NO | — | Họ và tên |
| email | VARCHAR(255) | YES | NULL | |
| phone | VARCHAR(20) | YES | NULL | |
| dob | DATE | YES | NULL | Ngày sinh |
| gender | ENUM | YES | NULL | male/female/other |
| address | TEXT | YES | NULL | |
| avatar_url | VARCHAR(255) | YES | NULL | |
| national_id_no | VARCHAR(30) | YES | NULL | CCCD/CMND |
| national_id_issue_date | DATE | YES | NULL | |
| national_id_issue_place | VARCHAR(255) | YES | NULL | |
| social_insurance_no | VARCHAR(30) | YES | NULL | |
| license_no | VARCHAR(50) | NO | — | Số GPLX |
| license_class | VARCHAR(20) | YES | NULL | B2/C/D/E/FC |
| expired_date | DATE | YES | NULL | Ngày hết hạn GPLX |
| license_alert_days | SMALLINT UNSIGNED | NO | 30 | Cảnh báo trước X ngày |
| license_image_url | VARCHAR(255) | YES | NULL | |
| health_certificate_no | VARCHAR(30) | YES | NULL | |
| health_certificate_expired_date | DATE | YES | NULL | |
| available_status | ENUM | NO | available | available/busy/offline |
| status | ENUM | NO | active | active/inactive/resigned |
| join_date | DATE | YES | NULL | |
| resign_date | DATE | YES | NULL | |
| annual_leave_days | SMALLINT UNSIGNED | NO | 12 | |
| bank_name | VARCHAR(255) | YES | NULL | |
| bank_account_no | VARCHAR(50) | YES | NULL | |
| bank_account_name | VARCHAR(255) | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [DR3] `driver_documents` — Giấy tờ tài xế
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| driver_id | BIGINT FK | NO | — | → drivers |
| doc_type | ENUM | NO | — | driver_license/international_license/health_certificate/skill_certificate/id_card/other |
| doc_name | VARCHAR(200) | NO | — | |
| doc_number | VARCHAR(100) | YES | NULL | |
| issued_date | DATE | YES | NULL | |
| expiry_date | DATE | YES | NULL | |
| issuer | VARCHAR(200) | YES | NULL | |
| file_url | VARCHAR(500) | YES | NULL | |
| alert_before_days | INT UNSIGNED | NO | 30 | |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [L1] `leave_types` — Loại nghỉ phép *(EXISTS)*
Giữ nguyên. Đã có company_id, code, name, is_paid, annual_quota_days.

---

### [L2] `leave_requests` — Đơn xin nghỉ *(ALTER — thêm company_id)*
| Cột thêm | Kiểu | Null | Mô tả |
|---|---|---|---|
| company_id | BIGINT FK | YES | → companies (backfill từ drivers) |

---

### [L3] `driver_work_schedules` — Phân công xe-tài xế theo ngày *(EXISTS)*
Giữ nguyên. Đã có driver_id, vehicle_id, work_date, shift_code, start_time, end_time, status (draft/submitted/approved/locked).

---

### [O1] `trips` — Đơn hàng / Chuyến xe *(ALTER — thêm nhiều cột)*
| Cột gốc + bổ sung | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| code | VARCHAR(50) | NO | — | Mã đơn. UNIQUE |
| company_id | BIGINT FK | NO | — | → companies |
| customer_id | BIGINT FK | NO | — | → customers |
| contact_name | VARCHAR(200) | YES | NULL | **MỚI** Người LH |
| contact_phone | VARCHAR(20) | YES | NULL | **MỚI** |
| cargo_type_id | BIGINT FK | YES | NULL | **MỚI** → cargo_types |
| cargo_description | TEXT | YES | NULL | **MỚI** |
| cargo_quantity | DECIMAL(10,2) | YES | NULL | **MỚI** |
| cargo_unit | VARCHAR(50) | YES | NULL | **MỚI** tấn/kiện/thùng |
| cargo_weight_ton | DECIMAL(8,2) | YES | NULL | **MỚI** |
| cargo_notes | TEXT | YES | NULL | **MỚI** Dễ vỡ, hàng lạnh... |
| driver_id | BIGINT FK | NO | — | → drivers |
| vehicle_id | BIGINT FK | NO | — | → vehicles |
| dispatcher_id | BIGINT FK | YES | NULL | **MỚI** → users |
| assigned_at | DATETIME | YES | NULL | **MỚI** |
| route_template_id | BIGINT FK | YES | NULL | **MỚI** → route_templates |
| origin_location_id | BIGINT FK | YES | NULL | **MỚI** → locations |
| destination_location_id | BIGINT FK | YES | NULL | **MỚI** → locations |
| start_point | VARCHAR(255) | NO | — | Địa chỉ lấy hàng (text) |
| end_point | VARCHAR(255) | NO | — | Địa chỉ giao hàng (text) |
| received_date | DATE | YES | NULL | **MỚI** Ngày nhận đơn |
| scheduled_date | DATE | YES | NULL | **MỚI** Ngày vận chuyển dự kiến |
| scheduled_time_from | TIME | YES | NULL | **MỚI** |
| scheduled_time_to | TIME | YES | NULL | **MỚI** |
| distance_km | DECIMAL(10,2) | NO | 0 | Km dự kiến |
| actual_distance_km | DECIMAL(8,2) | YES | NULL | **MỚI** Km thực tế |
| start_time | DATETIME | YES | NULL | Giờ xuất phát thực tế |
| end_time | DATETIME | YES | NULL | Giờ kết thúc thực tế |
| actual_pickup_at | DATETIME | YES | NULL | **MỚI** Giờ lấy hàng thực tế |
| actual_delivered_at | DATETIME | YES | NULL | **MỚI** Giờ giao hàng thực tế |
| price | DECIMAL(15,2) | NO | 0 | Giá gốc (legacy) |
| base_price | DECIMAL(15,2) | NO | 0 | **MỚI** Đơn giá cước |
| surcharge_amount | DECIMAL(15,2) | NO | 0 | **MỚI** Tổng phụ phí |
| total_revenue | DECIMAL(15,2) | YES | NULL | **MỚI** = base_price + surcharge |
| payment_method | ENUM | YES | NULL | **MỚI** bank_transfer/cash/credit |
| payment_status | ENUM | NO | unpaid | **MỚI** unpaid/invoiced/paid |
| status | ENUM | NO | pending | pending/in_progress/completed/cancelled |
| cancellation_reason | TEXT | YES | NULL | **MỚI** |
| cancelled_at | DATETIME | YES | NULL | **MỚI** |
| cancelled_by | BIGINT FK | YES | NULL | **MỚI** → users |
| internal_notes | TEXT | YES | NULL | **MỚI** Ghi chú nội bộ |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [O2] `trip_stops` — Điểm dừng multi-stop
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | → companies |
| trip_id | BIGINT FK | NO | — | → trips |
| stop_type | ENUM | NO | — | pickup / delivery |
| sequence | SMALLINT UNSIGNED | NO | — | 1, 2, 3... |
| location_id | BIGINT FK | YES | NULL | → locations |
| address | TEXT | NO | — | |
| contact_name | VARCHAR(200) | YES | NULL | |
| contact_phone | VARCHAR(20) | YES | NULL | |
| scheduled_time | DATETIME | YES | NULL | |
| actual_time | DATETIME | YES | NULL | |
| status | ENUM | NO | pending | pending/arrived/completed |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |

**UNIQUE:** (trip_id, stop_type, sequence)

---

### [O3] `trip_surcharges` — Phụ phí đơn hàng
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | |
| trip_id | BIGINT FK | NO | — | → trips |
| name | VARCHAR(200) | NO | — | Phụ phí chờ hàng... |
| amount | DECIMAL(15,2) | NO | — | |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |

---

### [O4] `trip_documents` — Chứng từ đính kèm
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | |
| trip_id | BIGINT FK | NO | — | → trips |
| doc_type | ENUM | NO | — | dispatch_note/delivery_receipt/epod/invoice/other |
| doc_name | VARCHAR(200) | NO | — | |
| file_url | VARCHAR(500) | NO | — | |
| file_size_kb | INT UNSIGNED | YES | NULL | |
| uploaded_by | BIGINT FK | NO | — | → users |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |

---

### [O5] `trip_status_histories` — Timeline trạng thái *(EXISTS)*
Giữ nguyên. Đã có trip_id, from_status, to_status, changed_by, changed_at, note.

---

### [CP1] `trip_costs` — Chi phí phát sinh theo chuyến
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | |
| trip_id | BIGINT FK | NO | — | → trips |
| cost_category_id | BIGINT FK | NO | — | → cost_categories |
| amount | DECIMAL(15,2) | NO | — | Số tiền thực tế |
| norm_amount | DECIMAL(15,2) | YES | NULL | Định mức so sánh |
| description | TEXT | YES | NULL | |
| receipt_file_url | VARCHAR(500) | YES | NULL | Ảnh hóa đơn/chứng từ |
| incurred_date | DATE | NO | — | Ngày phát sinh |
| status | ENUM | NO | pending | pending/approved/rejected |
| approval_required | TINYINT(1) | NO | 0 | Cần phê duyệt không |
| approved_by | BIGINT FK | YES | NULL | → users |
| approved_at | TIMESTAMP | YES | NULL | |
| approval_note | TEXT | YES | NULL | |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### [CP2] `cost_approval_requests` — Phê duyệt chi phí vượt định mức
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | |
| trip_id | BIGINT FK | NO | — | → trips |
| requested_by | BIGINT FK | NO | — | → users |
| total_amount | DECIMAL(15,2) | NO | — | Tổng tiền cần duyệt |
| reason | TEXT | NO | — | Lý do vượt định mức |
| status | ENUM | NO | pending | pending/approved/rejected |
| reviewed_by | BIGINT FK | YES | NULL | → users |
| reviewed_at | TIMESTAMP | YES | NULL | |
| review_note | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |

---

### [KT1] `reconciliation_sessions` — Phiên đối soát
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | |
| customer_id | BIGINT FK | NO | — | → customers |
| period_from | DATE | NO | — | Từ ngày |
| period_to | DATE | NO | — | Đến ngày |
| total_trips | INT UNSIGNED | NO | 0 | |
| total_revenue | DECIMAL(15,2) | NO | 0 | |
| adjusted_amount | DECIMAL(15,2) | NO | 0 | |
| final_amount | DECIMAL(15,2) | NO | 0 | |
| status | ENUM | NO | draft | draft/confirmed/locked |
| confirmed_at | TIMESTAMP | YES | NULL | |
| confirmed_by | BIGINT FK | YES | NULL | → users |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |

---

### [KT2] `reconciliation_items` — Chi tiết từng chuyến trong đối soát
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | |
| session_id | BIGINT FK | NO | — | → reconciliation_sessions |
| trip_id | BIGINT FK | NO | — | → trips |
| original_amount | DECIMAL(15,2) | NO | — | Doanh thu gốc |
| adjusted_amount | DECIMAL(15,2) | YES | NULL | Sau điều chỉnh |
| adjustment_reason | TEXT | YES | NULL | |
| is_disputed | TINYINT(1) | NO | 0 | Có tranh chấp không |
| dispute_note | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |

**UNIQUE:** (session_id, trip_id)

---

### [KT3] `payment_records` — Ghi nhận thanh toán
| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | BIGINT PK | NO | AUTO | |
| company_id | BIGINT FK | NO | — | |
| customer_id | BIGINT FK | NO | — | → customers |
| reconciliation_session_id | BIGINT FK | YES | NULL | → reconciliation_sessions |
| payment_date | DATE | NO | — | |
| amount | DECIMAL(15,2) | NO | — | |
| payment_method | ENUM | NO | — | bank_transfer/cash/check |
| bank_reference | VARCHAR(200) | YES | NULL | Mã giao dịch |
| receipt_url | VARCHAR(500) | YES | NULL | |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | YES | NULL | |
| updated_at | TIMESTAMP | YES | NULL | |
| deleted_at | TIMESTAMP | YES | NULL | |

---

### Các bảng EXISTS không thay đổi
- **invoices** — Hóa đơn
- **invoice_status_histories** — Lịch sử trạng thái hóa đơn
- **notifications** — Thông báo in-app
- **chat_messages** — Lịch sử chat AI
- **knowledge_articles** — Tài liệu nghiệp vụ cho AI
- **rag_index** — Vector index cho AI search
- **report_caches** — Cache báo cáo

---

# PHẦN 2 — LUỒNG NGHIỆP VỤ

## 2.1 Luồng Quản lý Người dùng & Phân quyền

```
Super Admin tạo Company
      ↓
Tạo User → gán role (admin/dispatcher/accountant/viewer)
      ↓
Cấu hình user_permissions theo từng module
      ↓
User đăng nhập → hệ thống load permissions
      ↓
Mọi action đều ghi audit_logs
```

**Quy tắc:**
- 1 user thuộc 1 company
- Role quyết định menu hiển thị
- user_permissions quyết định quyền chi tiết trong từng module
- admin có toàn quyền, không cần cấu hình permissions

---

## 2.2 Luồng Thiết lập Danh mục (Làm 1 lần đầu)

```
Admin vào Settings → Danh mục
      ↓
1. Tạo vehicle_types   (Xe tải 5T, Đầu kéo...)
2. Tạo cargo_types     (Hàng thường, Hàng lạnh...)
3. Tạo cost_categories (Nhiên liệu, Cầu đường...)
4. Tạo locations       (Kho Bình Dương, Cảng Cát Lái...)
5. Tạo route_templates (HCM→BD: 30km, 1.5h, giá 500k)
6. Cấu hình order_status_configs (màu sắc, tên trạng thái)
      ↓
Sẵn sàng dùng khi nhập đơn hàng
```

---

## 2.3 Luồng Quản lý Xe — Tài xế Phụ trách

```
[Thiết lập ban đầu]
Tạo Xe → Tạo Tài xế → Gắn phụ trách (vehicle_assignments)
    from_date = hôm nay, to_date = NULL

[Thay đổi phụ trách]
Admin click "Thay đổi tài xế phụ trách"
    → Nhập to_date + release_reason cho bản ghi cũ
    → Tạo bản ghi mới với tài xế mới + from_date mới

[Ràng buộc]
    - 1 xe chỉ có 1 bản ghi to_date IS NULL tại 1 thời điểm
    - 1 tài xế chỉ phụ trách 1 xe tại 1 thời điểm
    - Không được thay đổi khi tài xế đang có chuyến chưa hoàn thành
```

---

## 2.4 Luồng Lịch làm việc Tài xế (Hàng ngày)

```
[Nguồn 1 — Tự động]
vehicle_assignments (phụ trách cố định)
      ↓
Hệ thống tự sinh driver_work_schedules cho ngày hôm sau
      ↓ status = draft

[Nguồn 2 — Ngoại lệ]
Tài xế xin nghỉ (leave_requests) → phê duyệt
      ↓
Block tài xế đó trong driver_work_schedules
      ↓ Xe bị trống → admin phân công tài xế thay thế

[Nguồn 3 — Xe hỏng/bảo dưỡng]
Cập nhật vehicles.status = maintenance/broken
      ↓
Block xe đó khỏi driver_work_schedules
      ↓ Tài xế bị trống → gán xe dự phòng

[Kết quả cuối ngày]
driver_work_schedules với status = approved
      ↓ Danh sách [Xe ↔ Tài xế] sẵn sàng trong ngày
      ↓ Điều vận dùng để phân công đơn hàng
```

---

## 2.5 Luồng Đơn hàng — Vòng đời đầy đủ

```
BƯỚC 1 — NHẬP ĐƠN (Dispatcher)
  Tạo trips record
  Điền: KH, liên hệ, hàng hóa, tuyến đường (chọn route_template)
  Hệ thống tự điền: giá cước từ price_list_items
  Thêm phụ phí nếu có → trip_surcharges
  Thêm điểm dừng nếu multi-stop → trip_stops
  status = pending (NEW)

BƯỚC 2 — PHÂN CÔNG (Dispatcher)
  Xem driver_work_schedules → biết xe/tài xế rảnh hôm nay
  Chọn xe → chọn tài xế (hệ thống kiểm tra xung đột lịch)
  Hệ thống cảnh báo GPLX hết hạn nếu có
  Ghi assigned_at, dispatcher_id
  status = assigned (ĐÃ PHÂN CÔNG)
  Ghi trip_status_histories

BƯỚC 3 — VẬN CHUYỂN (Dispatcher cập nhật tay)
  Ghi start_time (giờ xuất phát)
  Ghi actual_pickup_at (giờ lấy hàng xong)
  Cập nhật trip_stops.status theo từng điểm dừng
  Thêm chi phí phát sinh → trip_costs
    Nếu vượt định mức → tạo cost_approval_requests
  status = in_transit (ĐANG VẬN CHUYỂN)

BƯỚC 4 — GIAO HÀNG
  Ghi actual_delivered_at
  Ghi actual_distance_km
  Upload chứng từ → trip_documents (ePOD, biên bản giao hàng)
  status = delivered (ĐÃ GIAO)

BƯỚC 5 — ĐỐI SOÁT & HOÀN THÀNH (Kế toán)
  Kế toán xem xét chi phí, duyệt trip_costs còn pending
  Xác nhận doanh thu (total_revenue)
  Cập nhật payment_status nếu KH đã thanh toán
  status = completed (HOÀN THÀNH)

HỦY ĐƠN (bất kỳ lúc nào trước COMPLETED)
  Ghi cancellation_reason + cancelled_at + cancelled_by
  status = cancelled
  Không được xóa record
```

---

## 2.6 Luồng Chi phí & Phê duyệt

```
Dispatcher nhập chi phí cho chuyến
      ↓
Hệ thống so sánh với norm_amount (định mức tuyến đường)
      ↓
Nếu amount <= approval_threshold (cost_categories)
      → status = approved tự động

Nếu amount > approval_threshold
      → approval_required = 1
      → Tạo cost_approval_requests
      → Thông báo cho Admin/Manager
      ↓
Admin xem xét
      → Duyệt: status = approved
      → Từ chối: status = rejected + ghi review_note
```

---

## 2.7 Luồng Đối soát & Thanh toán

```
Kế toán chọn KH + kỳ đối soát (tuần/tháng)
      ↓
Hệ thống tự tổng hợp tất cả trips của KH trong kỳ
      ↓ Tạo reconciliation_sessions (status = draft)
      ↓ Chi tiết → reconciliation_items (1 dòng/chuyến)
      ↓
Kế toán xem xét từng chuyến
  - Điều chỉnh nếu sai lệch (adjusted_amount + reason)
  - Đánh dấu tranh chấp (is_disputed) nếu KH không đồng ý
      ↓
Xác nhận đối soát (status = confirmed → locked)
      ↓ Không thể sửa sau khi locked
      ↓
KH thanh toán → ghi payment_records
      ↓
Cập nhật trips.payment_status = paid cho các chuyến liên quan
```

---

## 2.8 Luồng Cảnh báo Tự động

```
Cron Job chạy hàng ngày 07:00
      ↓
Kiểm tra vehicle_documents.expiry_date
  WHERE expiry_date <= NOW() + alert_before_days
  → Tạo notifications cho Admin + Dispatcher

Kiểm tra driver_documents.expiry_date (GPLX, sức khỏe)
  WHERE expiry_date <= NOW() + alert_before_days
  → Tạo notifications

Kiểm tra maintenance_schedules
  WHERE next_due_date <= NOW() + alert_before_days
  OR next_due_km <= vehicles.current_odometer_km + alert_before_km
  → Tạo notifications

Kiểm tra customers.contract_end_date
  WHERE contract_end_date <= NOW() + 30 ngày
  → Tạo notifications cho Admin

Kiểm tra công nợ quá hạn
  (total_revenue - paid) > 0
  AND actual_delivered_at <= NOW() - payment_terms_days
  → Tạo notifications cho Kế toán
```

---

## 2.9 Quy tắc nghiệp vụ cốt lõi

| # | Quy tắc |
|---|---|
| R01 | Đơn COMPLETED không xóa được — chỉ hủy kèm lý do bắt buộc |
| R02 | Xe đang có chuyến (status=in_transit) không được phân công chuyến khác trùng giờ |
| R03 | GPLX tài xế hết hạn → cảnh báo khi phân công, vẫn cho phép nhưng ghi log |
| R04 | 1 xe chỉ có 1 tài xế phụ trách tại 1 thời điểm (vehicle_assignments) |
| R05 | 1 tài xế chỉ được gán 1 xe trong 1 ngày (driver_work_schedules) |
| R06 | Chi phí vượt approval_threshold → bắt buộc qua luồng phê duyệt |
| R07 | Đối soát đã locked → không sửa được, phải tạo phiên mới để điều chỉnh |
| R08 | Xóa KH chỉ được khi không có trips liên quan |
| R09 | audit_logs không UPDATE, không DELETE |
| R10 | total_revenue = base_price + SUM(trip_surcharges.amount) |
| R11 | Mã đơn (code), mã KH, mã tài xế do hệ thống sinh — không cho sửa |
| R12 | Xe status=maintenance/broken → không hiển thị trong danh sách phân công |
| R13 | Tài xế có leave_request approved → không hiển thị trong phân công ngày đó |

---

# PHẦN 3 — THIẾT KẾ MÀN HÌNH

## 3.1 Cấu trúc Navigation

```
Sidebar (trái)
├── 🏠 Dashboard
├── 📦 Đơn hàng
│   ├── Danh sách đơn hàng
│   ├── Tạo đơn hàng
│   └── Pool ghép đơn
├── 🗺  Điều vận
│   ├── Bảng điều vận
│   └── Phân công hôm nay
├── 🚛 Phương tiện
│   ├── Danh sách xe
│   └── Bảo dưỡng & Sửa chữa
├── 👤 Tài xế
│   ├── Danh sách tài xế
│   └── Lịch làm việc
├── 👥 Khách hàng
│   ├── Danh sách KH
│   └── Bảng giá
├── 💰 Kế toán
│   ├── Doanh thu
│   ├── Chi phí
│   ├── Đối soát
│   └── Công nợ
├── 📊 Báo cáo
└── ⚙️  Cài đặt
    ├── Danh mục
    ├── Người dùng
    └── Cấu hình công ty
```

---

## 3.2 Dashboard

**URL:** `/dashboard`
**Quyền:** Tất cả roles

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header: Chào [Tên], [Ngày hôm nay]          🔔 [Avatar] │
├──────────┬──────────┬──────────┬────────────────────────┤
│ Đơn mới  │ Đang chạy│ Hoàn thành│ Doanh thu hôm nay     │
│   12     │    8     │   45     │  125,000,000 đ         │
├──────────┴──────────┴──────────┴────────────────────────┤
│ CẢNH BÁO (badge đỏ)                                     │
│ ⚠ 3 xe sắp hết hạn đăng kiểm  [Xem chi tiết]          │
│ ⚠ 2 tài xế sắp hết hạn GPLX   [Xem chi tiết]          │
│ ⚠ 5 chuyến chưa phân công     [Phân công ngay]         │
├──────────────────────────┬──────────────────────────────┤
│ Biểu đồ Doanh thu 7 ngày │ Xe đang hoạt động (map/list) │
│ [Bar Chart]              │ 51C-123 → Đang chạy          │
│                          │ 51C-456 → Rảnh               │
│                          │ 51C-789 → Bảo dưỡng          │
├──────────────────────────┴──────────────────────────────┤
│ Đơn hàng gần đây (10 dòng cuối)                         │
│ Mã đơn | KH | Tuyến | Xe | Tài xế | TT | Thao tác      │
└─────────────────────────────────────────────────────────┘
```

**Dữ liệu cần:**
- Count trips by status (today)
- SUM(total_revenue) today where status=completed
- Alerts: vehicle_documents, driver_documents expiry
- trips status != completed/cancelled (pending + in_transit)
- trips 10 records mới nhất

---

## 3.3 Danh sách Đơn hàng

**URL:** `/orders`
**Quyền:** can_view orders

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ Đơn hàng                          [+ Tạo đơn] [Export] │
├─────────────────────────────────────────────────────────┤
│ Tìm kiếm: [______________] [Lọc trạng thái ▼]          │
│           [Lọc KH ▼] [Lọc xe ▼] [Từ ngày][Đến ngày]   │
├────────┬────────┬──────────┬─────┬─────────┬────┬──────┤
│Mã đơn  │Khách  │Tuyến đường│Xe  │Tài xế   │T.Thái│ ...│
├────────┼────────┼──────────┼─────┼─────────┼────┼──────┤
│ĐH-001  │ABC Co │HCM→BD    │123 │Nguyễn A │🔵  │[Chi]│
│ĐH-002  │XYZ Co │HCM→ĐN    │456 │Trần B   │🟡  │[Chi]│
│ĐH-003  │DEF Co │BD→HCM    │-   │-        │⚪  │[Chi]│
├────────┴────────┴──────────┴─────┴─────────┴────┴──────┤
│ Tổng: 128 đơn | Trang 1/13        [◀] [1][2][3] [▶]   │
└─────────────────────────────────────────────────────────┘
```

**Badge trạng thái:**
- ⚪ Mới (NEW)
- 🔵 Đã phân công (ASSIGNED)
- 🟡 Đang vận chuyển (IN_TRANSIT)
- 🟣 Đã giao (DELIVERED)
- 🟢 Hoàn thành (COMPLETED)
- 🔴 Đã hủy (CANCELLED)

**Filter:**
- Tìm kiếm: fulltext trên code, tên KH, biển số xe, tên tài xế
- Lọc trạng thái: multi-select
- Lọc KH: dropdown có search
- Lọc xe: dropdown
- Lọc khoảng ngày: scheduled_date

---

## 3.4 Form Tạo / Sửa Đơn hàng

**URL:** `/orders/create` | `/orders/{id}/edit`
**Quyền:** can_create orders

### Layout (3 Tab)

```
┌─────────────────────────────────────────────────────────┐
│ Tạo đơn hàng mới                                        │
│ [Tab 1: Thông tin] [Tab 2: Tuyến đường] [Tab 3: Doanh thu]│
├─────────────────────────────────────────────────────────┤
│ TAB 1 — THÔNG TIN ĐƠN HÀNG                             │
│                                                         │
│ Mã đơn hàng: [ĐH-20260430-00128] (auto, readonly)      │
│ Ngày nhận đơn: [30/04/2026     ] (date picker)          │
│ Ngày vận chuyển: [01/05/2026   ] (date picker) *        │
│                                                         │
│ Khách hàng: [Tìm kiếm KH...    ▼] *  [+ Tạo KH mới]  │
│ Người liên hệ: [Nguyễn Văn A    ] (tự điền từ KH)      │
│ SĐT liên hệ:  [0901234567       ] (tự điền, có thể sửa) │
│                                                         │
│ Loại hàng hóa: [Chọn loại hàng  ▼] *                  │
│ Mô tả hàng:   [                   ]                     │
│ Số lượng:     [      ] [Đơn vị ▼  ]                    │
│ Trọng lượng:  [      ] tấn                              │
│ Ghi chú hàng: [Dễ vỡ, xếp nhẹ nhàng...]               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ TAB 2 — TUYẾN ĐƯỜNG                                     │
│                                                         │
│ Chọn tuyến có sẵn: [Chọn tuyến đường... ▼]             │
│ (Chọn tuyến → tự điền thông tin bên dưới)               │
│ ─────────────────────────────────────────────────────── │
│ ĐIỂM LẤY HÀNG                                          │
│ Điểm lấy: [Chọn hoặc nhập tay... ▼] *                  │
│ Địa chỉ chi tiết: [                ] *                  │
│ Người nhận: [           ] SĐT: [           ]           │
│ Giờ lấy dự kiến: [       ]                             │
│                                                         │
│ ĐIỂM GIAO HÀNG                                         │
│ Điểm giao: [Chọn hoặc nhập tay... ▼] *                 │
│ Địa chỉ chi tiết: [                ] *                  │
│ Người nhận: [           ] SĐT: [           ]           │
│ Giờ giao dự kiến: [       ]                            │
│                                                         │
│ [+ Thêm điểm dừng] (multi-stop)                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ TAB 3 — DOANH THU                                       │
│                                                         │
│ Loại xe yêu cầu: [Chọn loại xe... ▼] *                 │
│ Đơn giá cước:   [    1,500,000    ] đ  (tự điền từ giá)│
│                                                         │
│ Phụ phí:                                               │
│ [Phụ phí chờ hàng    ] [  200,000 ] đ  [x]            │
│ [                    ] [          ] đ  [+Thêm phụ phí] │
│                                                         │
│ Tổng doanh thu: 1,700,000 đ  (tự tính)                 │
│                                                         │
│ Thanh toán: [Chọn phương thức ▼]                       │
│ Ghi chú:    [                   ]                       │
│ ─────────────────────────────────────────────────────── │
│              [Hủy]        [Lưu nháp]  [Tạo đơn hàng]  │
└─────────────────────────────────────────────────────────┘
```

---

## 3.5 Chi tiết Đơn hàng

**URL:** `/orders/{id}`
**Quyền:** can_view orders

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ ĐH-20260430-00128  🔵 Đang vận chuyển       [Sửa][Hủy]│
├────────────────────────────┬────────────────────────────┤
│ THÔNG TIN ĐƠN              │ PHÂN CÔNG                  │
│ KH: ABC Company            │ Xe: 51C-12345              │
│ LH: Nguyễn A - 0901234567  │ Tài xế: Nguyễn Văn A      │
│ Hàng: Hàng thường / 2 tấn  │ Phân công lúc: 07:30       │
│ Ngày VC: 01/05/2026        │ [Đổi xe/tài xế]           │
├────────────────────────────┴────────────────────────────┤
│ TUYẾN ĐƯỜNG                                             │
│ 📍 Lấy: Kho Bình Dương — 08:00 ✅                      │
│ 📍 Giao: Kho Đồng Nai   — 10:30 ⏳                     │
├─────────────────────────────────────────────────────────┤
│ TIMELINE TRẠNG THÁI                                     │
│ ✅ 07:00 — Tạo đơn (Trần Thị B)                        │
│ ✅ 07:30 — Phân công xe 51C-123 / Tài xế Nguyễn A      │
│ ✅ 08:00 — Bắt đầu vận chuyển                          │
│ ⏳ ...                                                  │
├───────────────┬─────────────────────────────────────────┤
│ DOANH THU     │ CHI PHÍ PHÁT SINH                       │
│ Cước: 1,500k  │ Nhiên liệu:  150,000 ✅                 │
│ Phụ phí: 200k │ Cầu đường:    50,000 ✅                 │
│ Tổng: 1,700k  │ Tổng CP:     200,000                   │
│               │ LN gộp:    1,500,000                   │
│               │ [+ Thêm chi phí]                       │
├────────────────┴────────────────────────────────────────┤
│ CHỨNG TỪ                    │ GHI CHÚ NỘI BỘ           │
│ [📄 Lệnh vận chuyển]        │ [Nhập ghi chú...]         │
│ [📷 Ảnh lấy hàng]           │                           │
│ [+ Upload chứng từ]         │                           │
└─────────────────────────────────────────────────────────┘
```

---

## 3.6 Bảng Điều Vận

**URL:** `/dispatch`
**Quyền:** can_view orders + vehicles + drivers

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ Bảng Điều Vận      [◀ 30/04] [Hôm nay] [01/05 ▶]      │
│ Lọc: [Tất cả loại xe ▼] [Tất cả đội ▼]                │
├──────────┬───────┬───────┬───────┬───────┬───────┬──────┤
│ Xe / TX  │ 07:00 │ 08:00 │ 09:00 │ 10:00 │ 11:00 │ ... │
├──────────┼───────┴───────┴───────┼───────┴───────┼──────┤
│51C-123   │ ████ ĐH-128 ████████ │               │      │
│Nguyễn A  │ HCM → Bình Dương     │               │      │
├──────────┼───────────────────────┼───────────────┼──────┤
│51C-456   │                       │██ ĐH-131 ████│      │
│Trần B    │      [RẢNH]           │ HCM → ĐN     │      │
├──────────┼───────────────────────┼───────────────┼──────┤
│51C-789   │ 🔧 BẢO DƯỠNG (cả ngày)                     │
│Lê C      │                                             │
├──────────┼─────────────────────────────────────────────┤
│51C-012   │ 🏖 Lê D — Nghỉ phép (cả ngày)              │
├──────────┴─────────────────────────────────────────────┤
│ [Click ô trống] → Gán đơn hàng từ pool                 │
│ [Click ô đã có] → Xem chi tiết đơn                     │
└─────────────────────────────────────────────────────────┘

Pool đơn chưa phân công (bên phải hoặc popup):
┌─────────────────────────────────────────────────────────┐
│ 5 ĐƠN CHƯA PHÂN CÔNG                                    │
│ ĐH-130 | ABC | HCM→BD | Xe tải 5T | 08:00              │
│ ĐH-131 | XYZ | HCM→ĐN | Đầu kéo   | 09:00  [Gán ngay] │
│ ĐH-132 | DEF | BD→HCM | Xe van    | 10:00              │
└─────────────────────────────────────────────────────────┘
```

---

## 3.7 Quản lý Xe

**URL:** `/vehicles`

### Danh sách Xe
```
┌─────────────────────────────────────────────────────────┐
│ Phương tiện                      [+ Thêm xe] [Export]  │
├─────────────────────────────────────────────────────────┤
│ [Tìm biển số...] [Loại xe ▼] [Trạng thái ▼]           │
├────────┬────────┬──────────┬─────────┬──────┬──────────┤
│Biển số │Loại xe │Tài xế PT │T.Thái   │C.Báo │Thao tác  │
├────────┼────────┼──────────┼─────────┼──────┼──────────┤
│51C-123 │Xe tải 5T│Nguyễn A │🟢 Sẵn  │      │[Chi tiết]│
│51C-456 │Đầu kéo │Trần B   │🟡 Chạy  │      │[Chi tiết]│
│51C-789 │Xe tải 2T│Lê C    │🔧 Bảo d │⚠ 2  │[Chi tiết]│
│51C-012 │Xe van  │-         │🔴 Hỏng  │⚠ 1  │[Chi tiết]│
└─────────────────────────────────────────────────────────┘
```

### Chi tiết Xe — Tab Navigation
```
[Thông tin] [Giấy tờ] [Tài xế phụ trách] [Bảo dưỡng] [Lịch sử chuyến]
```

**Tab Giấy tờ:**
```
┌─────────────────────────────────────────────────────────┐
│ GIẤY TỜ XE 51C-12345              [+ Thêm giấy tờ]    │
├────────────────┬──────────┬──────────┬────────┬─────────┤
│ Loại giấy tờ   │Số GT     │Ngày hết  │Tình    │File     │
├────────────────┼──────────┼──────────┼────────┼─────────┤
│ Đăng kiểm      │12345678  │15/06/2026│⚠ 46 ngày│[📄]   │
│ Bảo hiểm TNDS  │BH-99999  │01/01/2027│✅ OK   │[📄]    │
│ Phù hiệu       │PH-55555  │31/12/2026│✅ OK   │[📄]    │
└────────────────┴──────────┴──────────┴────────┴─────────┘
```

**Tab Tài xế phụ trách:**
```
┌─────────────────────────────────────────────────────────┐
│ HIỆN TẠI: Nguyễn Văn A — từ 01/01/2026      [Thay đổi]│
├─────────────────────────────────────────────────────────┤
│ LỊCH SỬ PHỤ TRÁCH                                       │
│ Trần Văn B   | 01/06/2025 → 31/12/2025 | Nghỉ việc     │
│ Lê Văn C     | 01/01/2025 → 31/05/2025 | Điều chuyển xe│
└─────────────────────────────────────────────────────────┘
```

---

## 3.8 Quản lý Tài xế

**URL:** `/drivers`

### Danh sách Tài xế
```
┌─────────────────────────────────────────────────────────┐
│ Tài xế                         [+ Thêm tài xế][Export] │
├─────────────────────────────────────────────────────────┤
│ [Tìm tên/SĐT...] [Đội ▼] [Trạng thái ▼]               │
├────────┬──────────┬──────────┬─────────┬──────┬─────────┤
│Mã TX   │Họ tên   │SĐT       │Xe PT    │T.Thái│C.Báo    │
├────────┼──────────┼──────────┼─────────┼──────┼─────────┤
│TX-001  │Nguyễn A │0901111111│51C-123  │🟢    │         │
│TX-002  │Trần B   │0902222222│51C-456  │🟡    │⚠ GPLX  │
│TX-003  │Lê C     │0903333333│-        │🏖 Nghỉ│        │
└─────────────────────────────────────────────────────────┘
```

### Chi tiết Tài xế — Tab Navigation
```
[Thông tin] [Giấy tờ] [Xe phụ trách] [Lịch làm việc] [Lịch sử chuyến]
```

---

## 3.9 Lịch làm việc Tài xế

**URL:** `/drivers/schedule`

### Calendar View
```
┌─────────────────────────────────────────────────────────┐
│ Lịch làm việc Tháng 5/2026     [Tháng ▼] [Năm ▼]      │
│ [Sinh lịch tự động] [+ Phân công thủ công]             │
├──────────┬───┬───┬───┬───┬───┬───┬───┬───┬─────────────┤
│ Tài xế   │T2 │T3 │T4 │T5 │T6 │T7 │CN │T2 │ ...        │
│          │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │11 │             │
├──────────┼───┼───┼───┼───┼───┼───┼───┼───┼─────────────┤
│Nguyễn A  │🟢 │🟢 │🔵 │🟢 │🟢 │   │   │🟢 │ ...        │
│(51C-123) │   │   │   │   │   │   │   │   │             │
├──────────┼───┼───┼───┼───┼───┼───┼───┼───┼─────────────┤
│Trần B    │🔵 │🔵 │🟡 │🟡 │🟢 │   │   │🔵 │ ...        │
│(51C-456) │   │   │   │   │   │   │   │   │             │
├──────────┼───┼───┼───┼───┼───┼───┼───┼───┼─────────────┤
│Lê C      │🟢 │🟡 │🟡 │🔴 │🔴 │   │   │🟢 │ ...        │
│(-)       │   │   │   │   │   │   │   │   │             │
└──────────┴───┴───┴───┴───┴───┴───┴───┴───┴─────────────┘
🟢 Rảnh   🔵 Có chuyến   🟡 Nghỉ phép   🔴 Nghỉ bệnh
```

---

## 3.10 Quản lý Khách hàng

**URL:** `/customers`

### Danh sách KH
```
┌─────────────────────────────────────────────────────────┐
│ Khách hàng                      [+ Thêm KH] [Export]  │
├─────────────────────────────────────────────────────────┤
│ [Tìm tên/mã/SĐT...] [Nhóm ▼] [Trạng thái ▼]          │
├────────┬───────────┬──────────┬──────┬──────────┬───────┤
│Mã KH   │Tên KH    │SĐT       │Nhóm  │Số đơn    │Công nợ│
├────────┼───────────┼──────────┼──────┼──────────┼───────┤
│KH-001  │ABC Corp  │0901000001│VIP   │125 đơn   │0 đ    │
│KH-002  │XYZ Ltd   │0901000002│Thường│ 45 đơn   │2.5M đ │
│KH-003  │Ông Minh  │0901000003│Mới   │  3 đơn   │0 đ    │
└─────────────────────────────────────────────────────────┘
```

### Chi tiết KH — Tab Navigation
```
[Thông tin] [Bảng giá] [Lịch sử đơn hàng] [Công nợ]
```

---

## 3.11 Kế toán — Đối soát

**URL:** `/accounting/reconciliation`

### Tạo phiên đối soát
```
┌─────────────────────────────────────────────────────────┐
│ Đối soát KH: [Chọn khách hàng...  ▼]                   │
│ Kỳ: [01/04/2026] → [30/04/2026]     [Tạo đối soát]    │
├─────────────────────────────────────────────────────────┤
│ PHIÊN ĐỐI SOÁT: ABC Corp | Tháng 4/2026  [draft]       │
│ Tổng: 25 chuyến | 32,500,000 đ                         │
├────────┬───────────┬──────────┬──────────┬──────────────┤
│Mã đơn  │Ngày       │Tuyến     │D.Thu gốc │D.Thu điều    │
├────────┼───────────┼──────────┼──────────┼──────────────┤
│ĐH-101  │01/04/2026 │HCM→BD   │1,500,000 │[1,500,000  ]│
│ĐH-102  │02/04/2026 │HCM→ĐN   │3,200,000 │[3,200,000  ]│
│ĐH-103  │03/04/2026 │BD→HCM   │1,200,000 │[1,000,000⚠ ]│
│        │           │          │          │Lý do: [    ]│
├────────┴───────────┴──────────┴──────────┴──────────────┤
│ Tổng điều chỉnh: -200,000 đ  |  Final: 32,300,000 đ   │
│                         [Hủy]  [Lưu nháp] [Xác nhận]  │
└─────────────────────────────────────────────────────────┘
```

---

## 3.12 Cài đặt — Danh mục

**URL:** `/settings/categories`

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ Cài đặt → Danh mục                                      │
├────────────┬────────────────────────────────────────────┤
│ NHÓM DANH  │ Loại phương tiện              [+ Thêm]    │
│ MỤC        │────────────────────────────────────────── │
│            │ # │ Tên            │ Tải trọng │ Hạng GPLX│
│▶ Loại xe  │ 1 │ Xe tải 5T     │ 5 tấn     │ C        │
│  Loại hàng│ 2 │ Xe đầu kéo    │ 20 tấn    │ FC       │
│  Chi phí  │ 3 │ Xe van         │ 0.8 tấn   │ B2       │
│  Điểm giao│────────────────────────────────────────── │
│  Tuyến đường│[Kéo để sắp xếp lại thứ tự]             │
│  Trạng thái│                                          │
└────────────┴────────────────────────────────────────────┘
```

---

## 3.13 Báo cáo

**URL:** `/reports`

### Các báo cáo có sẵn
```
┌─────────────────────────────────────────────────────────┐
│ Báo cáo & Thống kê                                      │
├─────────────────────────────────────────────────────────┤
│ [Kỳ báo cáo: Tháng 4/2026 ▼]  [Xuất Excel] [Xuất PDF] │
├──────────────────────┬──────────────────────────────────┤
│ 📦 ĐƠNHÀNG           │ Tổng: 128 | HT: 115 | Hủy: 3   │
│ Tỉ lệ hoàn thành: 89%│ [Xem chi tiết]                  │
├──────────────────────┼──────────────────────────────────┤
│ 💰 DOANH THU         │ 185,500,000 đ (+12% vs T3)      │
│ Biểu đồ theo ngày    │ [Xem chi tiết]                  │
├──────────────────────┼──────────────────────────────────┤
│ 💸 CHI PHÍ           │  42,300,000 đ                   │
│ Chi tiết theo loại   │ [Xem chi tiết]                  │
├──────────────────────┼──────────────────────────────────┤
│ 📈 LỢI NHUẬN         │ 143,200,000 đ (77.2%)           │
│ Theo xe / theo tuyến │ [Xem chi tiết]                  │
├──────────────────────┼──────────────────────────────────┤
│ 🚛 HIỆU SUẤT XE      │ Xe đạt > 80% lấp đầy: 8/12     │
├──────────────────────┼──────────────────────────────────┤
│ 👤 HIỆU SUẤT TX      │ Chuyến TB/tài xế: 10.6/tháng    │
├──────────────────────┼──────────────────────────────────┤
│ 💳 CÔNG NỢ           │ Tổng nợ: 15,200,000 đ           │
│ Quá hạn: 2,500,000 đ │ [Xem chi tiết]                  │
└──────────────────────┴──────────────────────────────────┘
```

---

## 3.14 Tóm tắt các màn hình

| # | Màn hình | URL | Quyền |
|---|---|---|---|
| 1 | Dashboard | /dashboard | Tất cả |
| 2 | Danh sách đơn hàng | /orders | can_view orders |
| 3 | Tạo / Sửa đơn hàng | /orders/create, /orders/{id}/edit | can_create/edit orders |
| 4 | Chi tiết đơn hàng | /orders/{id} | can_view orders |
| 5 | Pool ghép đơn | /orders/pool | can_edit orders |
| 6 | Bảng điều vận | /dispatch | can_view orders + vehicles |
| 7 | Danh sách xe | /vehicles | can_view vehicles |
| 8 | Chi tiết xe | /vehicles/{id} | can_view vehicles |
| 9 | Form xe | /vehicles/create, edit | can_create/edit vehicles |
| 10 | Danh sách tài xế | /drivers | can_view drivers |
| 11 | Chi tiết tài xế | /drivers/{id} | can_view drivers |
| 12 | Form tài xế | /drivers/create, edit | can_create/edit drivers |
| 13 | Lịch làm việc | /drivers/schedule | can_view drivers |
| 14 | Danh sách KH | /customers | can_view orders |
| 15 | Chi tiết KH | /customers/{id} | can_view orders |
| 16 | Form KH | /customers/create, edit | can_create/edit orders |
| 17 | Doanh thu | /accounting/revenue | can_view accounting |
| 18 | Chi phí | /accounting/costs | can_view accounting |
| 19 | Đối soát | /accounting/reconciliation | can_approve accounting |
| 20 | Công nợ | /accounting/debt | can_view accounting |
| 21 | Báo cáo | /reports | can_view reports |
| 22 | Cài đặt danh mục | /settings/categories | admin |
| 23 | Quản lý user | /settings/users | admin |
| 24 | Thông tin công ty | /settings/company | admin |

---

*Spec này là tài liệu đầy đủ để triển khai hệ thống. Version 1.0 — 2026-04-30*
