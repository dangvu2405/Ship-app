# Prompt tạo dữ liệu mẫu (Ship App)

Sao chép nguyên prompt dưới đây để dùng với AI:

```text
Bạn là Data Engineer. Hãy tạo bộ dữ liệu mẫu đầy đủ cho hệ thống vận tải Ship App theo chuẩn API /api/v1.

YÊU CẦU CHUNG
- Trả về JSON thuần, UTF-8, không giải thích dài dòng.
- Dữ liệu nhất quán khóa ngoại, có thể import để test UI.
- Mốc thời gian trong năm 2026, timezone UTC, định dạng ISO-8601.
- Trạng thái dùng đúng enum phổ biến: draft, submitted, approved, locked, pending, in_progress, completed, cancelled, paid.
- Tất cả id là số nguyên tăng dần, không trùng.

SỐ LƯỢNG BẢN GHI
- companies: 3
- offices: 6 (mỗi company 2 office)
- departments: 12
- positions: 10
- users: 20 (có role admin/manager/accountant/dispatcher)
- drivers: 30
- vehicles: 40
- customers: 25
- trips: 300
- invoices: 180
- payrolls: 12 batch (mỗi tháng 1 batch cho mỗi company nếu có dữ liệu), kèm payroll lines cho từng driver
- leave_requests: 80
- overtime_requests: 100
- violation_records: 90

RÀNG BUỘC NGHIỆP VỤ
- Trip:
  - start_time < end_time khi status = completed.
  - status workflow hợp lý: pending -> in_progress -> completed/cancelled.
  - price, distance_km > 0.
- Invoice:
  - customer_id bắt buộc, trip_id có thể null.
  - due_date >= issued_at.
  - total_amount = subtotal + vat_amount.
- Payroll:
  - month, year hợp lệ; status theo lifecycle draft -> approved -> locked.
  - mỗi line có base_salary, trip_bonus, allowance, deduction, tax, net_salary.
  - net_salary = base_salary + trip_bonus + allowance - deduction - tax.
- Workforce:
  - leave from_date <= to_date.
  - overtime start_time < end_time.
  - violation có penalty_amount >= 0.

ĐẦU RA MONG MUỐN
- Trả về object JSON duy nhất:
{
  "companies": [...],
  "offices": [...],
  "departments": [...],
  "positions": [...],
  "users": [...],
  "drivers": [...],
  "vehicles": [...],
  "customers": [...],
  "trips": [...],
  "invoices": [...],
  "payrolls": [...],
  "payroll_lines": [...],
  "leave_requests": [...],
  "overtime_requests": [...],
  "violation_records": [...]
}

Sau khi tạo xong, thêm mục "validation_summary" ở cuối để thống kê:
- tổng số bản ghi mỗi bảng
- số bản ghi vi phạm ràng buộc (phải = 0)
```

