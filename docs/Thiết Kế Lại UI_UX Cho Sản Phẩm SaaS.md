# **Báo cáo Tổng quan và Đề xuất Kiến trúc Hệ thống Thiết kế (Design System) cho Sản phẩm SaaS Quy mô Lớn**

Sự phát triển nhanh chóng của các nền tảng Phần mềm dưới dạng Dịch vụ (SaaS) thường kéo theo những hệ lụy tất yếu về sự suy giảm tính nhất quán trong trải nghiệm người dùng (UX) và kiến trúc kỹ thuật. Việc ưu tiên tốc độ phát hành tính năng mới (speed to market) trong các chu kỳ phát triển ngắn hạn thường dẫn đến sự đánh đổi, tạo ra một khối lượng "nợ trải nghiệm người dùng" (UX debt) và "nợ kỹ thuật" (Technical debt) khổng lồ.1 Bản báo cáo này cung cấp một phân tích chuyên sâu về hiện trạng của hệ thống giao diện người dùng (UI) hiện tại, đồng thời đề xuất một chiến lược tái cấu trúc toàn diện dựa trên Hệ thống Thiết kế (Design System) tiêu chuẩn. Mục tiêu cốt lõi là thiết lập lại sự nhất quán (consistency), đảm bảo khả năng mở rộng (scalability) và tối ưu hóa quy trình bảo trì (maintainability) cho toàn bộ sản phẩm thông qua việc kết hợp các tiêu chuẩn thiết kế hiện đại và hệ sinh thái công nghệ React, Tailwind CSS cùng Shadcn UI.

### **0. Phạm vi áp dụng: Ship ERP Frontend (`ship-app`)**

Tài liệu này đã được **đồng bộ với mã nguồn thực tế** của repo `ship-app` và bổ sung hai nguồn nội bộ:

| Tài liệu | Đường dẫn | Vai trò |
|----------|-----------|---------|
| **Báo cáo kỹ thuật Design System (đo từ code)** | [design-system.md](design-system.md) | Token màu HSL, kích thước layout, toolbar `.list-page-filters`, component `ListPageFilters`, bảng, shadow skeuomorphic |
| **Audit kiến trúc & route** | [audit-ship-app-from-agents-skills.md](audit-ship-app-from-agents-skills.md) | Ma trận route, 19 CRUD resource, toolbar vs `PageLoadingOverlay` |
| **Rule phát triển AI / PR** | [.cursor/rules/ship-app-from-agents-skills.mdc](../.cursor/rules/ship-app-from-agents-skills.mdc) | Chuẩn React/UX: Vite + React 18 + Refine + Ant; skill Vercel + web guidelines |

**Stack thực tế (không phải Next.js):** Vite SPA, React 18, React Router, Refine, **Ant Design** (Select, Table, Form, Spin) + **Radix / shadcn** (`src/components/ui/*`), Tailwind + token trong [`src/index.css`](../src/index.css), SCSS layout trong [`src/styles/`](../src/styles/).

## **1\. Đánh giá Hệ thống UI Hiện tại (UI System Audit)**

Quá trình kiểm toán (audit) hệ thống UX/UI không chỉ dừng lại ở việc đánh giá từng màn hình đơn lẻ mà yêu cầu một cái nhìn toàn cảnh về toàn bộ sản phẩm.3 Các phân tích cho thấy sự tích tụ của nợ thiết kế đã bắt đầu gây ảnh hưởng tiêu cực đến hiệu suất phát triển và trải nghiệm người dùng cuối.

### **1.1 Phân tích Các Vấn đề Hiện tại**

Sự thiếu nhất quán trong hệ thống hiện tại có thể được phân tách thành ba nguyên nhân cốt lõi, bao gồm nợ kỹ thuật, sự rời rạc trong giao diện và các điểm nghẽn trong luồng trải nghiệm.

Sự thiếu nhất quán về mặt giao diện (Inconsistency) đang biểu hiện rõ nét qua việc các thành phần (components) bị trùng lặp mã nguồn.2 Một nút bấm (button) hoặc một trường nhập liệu (input) xuất hiện dưới nhiều biến thể không có quy tắc, sử dụng các mã màu hardcode, tỷ lệ khoảng cách (spacing) ngẫu nhiên và kích thước phông chữ (typography) không đồng bộ. Những yếu tố này không chỉ làm suy yếu nhận diện thương hiệu mà còn khiến quy trình bảo trì trở thành một gánh nặng, khi một sự thay đổi nhỏ về giao diện có thể đòi hỏi việc viết lại mã ở hàng chục tệp khác nhau.2 Thêm vào đó, sự mâu thuẫn về mặt thông tin (informational inconsistency) xuất hiện khi dữ liệu hiển thị không đồng nhất giữa các trang, gây bối rối cho người dùng và làm xói mòn lòng tin vào hệ thống, tương tự như những bài học đã được ghi nhận trên nền tảng của Amazon.1

Các vấn đề về UX (UX Issues) và luồng tương tác (Flow) cũng bộc lộ nhiều điểm yếu. Hành vi của các biểu mẫu (form behavior) thiếu tiêu chuẩn chung, dẫn đến tình trạng một số trường báo lỗi ngay lập tức khi người dùng đang nhập liệu, trong khi các trường khác lại giữ im lặng cho đến khi biểu mẫu được gửi đi.4 Các trạng thái trống (empty states) bị bỏ ngỏ, không cung cấp định hướng cho người dùng mới, dẫn đến tỷ lệ bỏ ngang (drop-off rate) cao.6 Hơn nữa, việc lạm dụng các hình thức tải trang đột ngột thay vì sử dụng bộ khung tải (skeleton loading) làm gia tăng tải lượng nhận thức (cognitive load) của người dùng.3

Cuối cùng, nợ kỹ thuật (Technical Debt) trong UI đang tiềm ẩn rủi ro phá vỡ hệ thống (break system). Các tính năng mới liên tục được đắp lên trên nền tảng giao diện cũ kỹ (legacy screens), tạo ra các lối tắt thiết kế (design shortcuts) che giấu những khoản nợ sâu bên dưới.3 Kiến trúc monolithic thiếu sự phân chia component hợp lý khiến ứng dụng khó mở rộng và thời gian tích hợp kéo dài.2

### **1.2 Ma trận Phân loại Mức độ Nghiêm trọng**

Dựa trên các phân tích trên, các khoản nợ thiết kế và UX được phân loại dựa trên mức độ nghiêm trọng (Severity) để định hướng cho quá trình tái cấu trúc, áp dụng các khung đánh giá như ICE (Impact, Confidence, Effort) và RICE (Reach, Impact, Confidence, Effort).8 Việc xếp hạng các rào cản kỹ thuật ngang hàng với các tính năng sản phẩm giúp làm rõ tỷ suất hoàn vốn (ROI) của quá trình refactor.8

| Hạng mục Nợ (Debt Type) | Vấn đề Cụ thể (Specific Issue) | Tác động Trải nghiệm (UX Impact) | Mức độ Nghiêm trọng |
| :---- | :---- | :---- | :---- |
| **Nợ Mã nguồn & UI** | Component trùng lặp, lạm dụng hardcode giá trị màu sắc, spacing, typography. | Giao diện rời rạc, làm chậm quá trình thiết kế và phát triển tính năng mới. Gây lỗi hồi quy (regression bugs) khi cập nhật. | **Cao (High)** |
| **Nợ Tương tác Form** | Validate hỗn loạn (onChange vs onBlur), thông báo lỗi không có vị trí cố định, không hỗ trợ bàn phím. | Người dùng bối rối, mất dữ liệu đã nhập, tăng tỷ lệ từ bỏ tác vụ giữa chừng (task abandonment). | **Cao (High)** |
| **Nợ Cấu trúc (Layout)** | Không có hệ thống Grid tiêu chuẩn, quy tắc responsive vỡ trên màn hình Tablet/Mobile. | Thông tin tràn viền, giao diện bị chồng chéo, không thể thao tác trên các thiết bị màn hình hẹp. | **Trung bình (Medium)** |
| **Nợ Luồng & Empty State** | Màn hình không có dữ liệu chỉ hiển thị khoảng trắng hoặc báo lỗi "No data". Thiếu nút gọi hành động (CTA). | Người dùng mới không biết phải làm gì tiếp theo, hệ thống có vẻ như đang bị lỗi. Suy giảm tỷ lệ Onboarding. | **Trung bình (Medium)** |
| **Nợ Phản hồi (Feedback)** | Bỏ qua các trạng thái Loading, Active, Disabled của nút bấm hoặc Data Table. | Hệ thống phản hồi chậm hoặc không có dấu hiệu đang xử lý dữ liệu, khiến người dùng click nhiều lần (double-click). | **Thấp (Low)** |

### **1.3 Hiện trạng Ship-app so với khuyến nghị tài liệu (Gap — đối chiếu [design-system.md](design-system.md))**

| Khuyến nghị tài liệu (mục 2–3) | Đã có trong code | Ghi chú / việc còn lại |
|--------------------------------|------------------|------------------------|
| Design token semantic (màu, radius) | **Có** — `:root` / `.dark` trong `index.css`; map Tailwind | Giữ HSL; tránh thêm hex cứng ngoài token; `FilterBar` dùng `getComputedStyle` theo `--primary` / `--border` / `--muted-foreground` |
| Typography scale (rem) | **Một phần** — `h1`–`h6` trong `@layer base`; body `line-height: 1.6` | Toolbar list cố định **14px / 40px** (SCSS); lệch với scale “display 48px” — chấp nhận cho dense ERP hoặc bổ sung token `text-toolbar` |
| 8-point grid | **Một phần** — spacing SCSS 4–64px; Tailwind `gap-4`/`6` trên `AppLayout` | Gutter 24px khớp lý thuyết; toolbar gap **12px** (không phải bội 8 thuần) — có thể chuẩn hoá 8 hoặc ghi nhận ngoại lệ |
| Button variants (Primary / Secondary / Danger) | **Có** — `ui/button` CVA (`default`, `outline`, `secondary`, `ghost`, `destructive`, `link`) | **Đã gỡ** bản trùng `form/Button.tsx` — chỉ dùng `@/components/ui/button` |
| Form validation onBlur trước, onChange sau lỗi | **Chưa kiểm chứng toàn bộ** — cần rà soát từng `*Form*.tsx` | Áp dụng nguyên tắc mục 3.1 khi sửa form |
| Skeleton global / local | **Một phần** — `AppLoadingSpin`, `PageLoadingOverlay` (Ant Spin), `Suspense` trên route; **dashboard chart:** `DashboardChartSkeleton` trong `Suspense` lazy chart | Có thể mở rộng skeleton cho các list nặng nếu cần |
| Empty state 3 mô hình | **Có** — `DataTable` hỗ trợ `emptyDescription` + `emptyAction`; 19 màn CRUD list truyền CTA tạo + i18n `emptyState.listDescription` | Giữ `emptyMessage` làm tiêu đề ngắn (fallback) |
| Data table: căn phải số, tabular nums | **Một phần** — Ant table `.professional-ant-table` có `font-variant-numeric: tabular-nums` | Rà soát cột tiền tệ / số: căn phải + `tabular-nums` theo mục 2.2.3 |
| Shadcn “không import ui vào Page” | **Không áp dụng** cho repo này | Pattern thực tế: page import `PageHeader`, `ListPageFilters`, `Button` từ `ui/` — **chấp nhận** hoặc tạo `blocks/` khi logic lặp (xem mục 5 viết lại) |

## ---

**2\. Đề xuất Hệ thống Thiết kế (Design System)**

Để xử lý triệt để các vấn đề nêu trên, một Hệ thống Thiết kế (Design System) hoàn chỉnh phải được thiết lập. Design System không chỉ là một bộ sưu tập các thành phần giao diện, mà là một ngôn ngữ chung bao gồm các nguyên tắc nền tảng (Foundation), thư viện thành phần (Component Library) và tài liệu quy chuẩn (Documentation).9 Hệ thống này sẽ đóng vai trò là "nguồn sự thật duy nhất" (Single Source of Truth) kết nối thiết kế và mã nguồn.

### **2.1 Nền tảng Hệ thống (Foundation)**

Nền tảng (Foundation) bao gồm các quyết định thiết kế cốt lõi nhất như màu sắc, kiểu chữ, khoảng cách, và hiệu ứng độ sâu.10 Các giá trị này được quản lý thông qua cơ chế Design Tokens, cho phép việc thay đổi quy mô lớn (như chuyển đổi Dark/Light mode) diễn ra mượt mà mà không ảnh hưởng đến cấu trúc component.10

#### **2.1.1 Hệ thống Màu sắc (Color System) & Tokens**

Hệ thống màu sắc cần tuân thủ cấu trúc Token 3 tầng (3-Tier Token System) do tiêu chuẩn W3C Design Tokens Community Group (DTCG) khuyến nghị, nhằm tối đa hóa khả năng bảo trì và tái sử dụng.13

Tầng thứ nhất là Global Tokens (Primitive Tokens), định nghĩa các giá trị hex tĩnh theo một thang độ sáng (thường từ 50 đến 900). Tầng thứ hai là Semantic Tokens (Alias Tokens), gán ý nghĩa và bối cảnh cho màu sắc (ví dụ: color-primary-background).12 Tầng thứ ba, Component-specific Tokens, chỉ được sử dụng cực kỳ hạn chế để đè các ngoại lệ.13

| Semantic Token (Quy tắc Đặt tên) | Loại Màu (Category) | Mô tả & Hướng dẫn Sử dụng (Usage Guidelines) | Tỷ lệ Tương phản (Contrast) |
| :---- | :---- | :---- | :---- |
| color-primary-default | Primary | Màu nhận diện thương hiệu chính. Dùng cho Nút bấm chính, Liên kết (Links), hoặc trạng thái đang chọn (Active states). | ![][image1] so với nền |
| color-primary-hover | Primary | Phiên bản sáng/tối hơn của Primary để phản hồi khi người dùng di chuột (Hover). | N/A |
| color-semantic-success | Semantic | Màu xanh lá, biểu thị hoàn thành tác vụ, thông báo lưu thành công, hoặc trạng thái tích cực. | ![][image2] với icon lớn |
| color-semantic-warning | Semantic | Màu vàng/cam, cảnh báo về hành động rủi ro thấp hoặc hệ thống cần chú ý. | ![][image1] cho text |
| color-semantic-error | Semantic | Màu đỏ, đánh dấu lỗi nhập liệu, thất bại, hoặc hành động xóa dữ liệu nguy hiểm (Destructive). | ![][image1] so với nền trắng |
| color-neutral-background | Neutral | Nền chính của ứng dụng (thường là trắng hoặc xám rất nhạt ở Light mode). | Base |
| color-neutral-surface | Neutral | Nền của các thẻ (Card), Modal, hoặc Dropdown, phân tách với nền ứng dụng qua bóng đổ. | Base |
| color-neutral-text-main | Neutral | Văn bản chính, thường là xám đậm (VD: Gray-900) thay vì đen tuyền để giảm mỏi mắt. | ![][image3] (chuẩn AAA) |
| color-neutral-text-muted | Neutral | Văn bản phụ, chú thích, nhãn vô hiệu hóa. (VD: Gray-500). | ![][image1] |

Mọi Token màu đều phải vượt qua bài kiểm tra của Tiêu chuẩn Trợ năng (WCAG 2.1 AA), đảm bảo tỷ lệ tương phản ![][image4] cho chữ nhỏ và ![][image5] cho chữ lớn.1

#### **2.1.2 Tỷ lệ Kiểu chữ (Typography Scale)**

Trong môi trường SaaS, thông tin chủ yếu được truyền tải qua văn bản. Do đó, một tỷ lệ kiểu chữ linh hoạt (responsive typography scale) sử dụng đơn vị tương đối rem thay vì px tĩnh là bắt buộc.18 Việc dùng rem cho phép giao diện tự động thích ứng với các cài đặt trợ năng của hệ điều hành và trình duyệt, duy trì sự cân bằng của thiết kế.18

| Token Mức (Scale) | Size (rem) | Size Tương đương | Line-Height (rem / px) | Mục đích Sử dụng |
| :---- | :---- | :---- | :---- | :---- |
| text-display | 3.0rem | 48px | 3.5rem (56px) | Số liệu nổi bật trên Dashboard, KPI lớn.20 |
| text-heading-1 | 2.0rem | 32px | 2.5rem (40px) | Tiêu đề trang chính (Page Header).20 |
| text-heading-2 | 1.5rem | 24px | 2.0rem (32px) | Tiêu đề của các Card, Modal, hoặc Panel.20 |
| text-heading-3 | 1.125rem | 18px | 1.5rem (24px) | Nhóm nội dung bên trong Form.20 |
| text-body-base | 1.0rem | 16px | 1.5rem (24px) | Văn bản đoạn văn tiêu chuẩn (Standard Body). Tối thiểu để đọc thoải mái.17 |
| text-body-sm | 0.875rem | 14px | 1.25rem (20px) | Văn bản trong bảng biểu (Data Table), mô tả phụ.20 |
| text-caption | 0.75rem | 12px | 1.0rem (16px) | Nhãn (Labels), thông báo lỗi (Error messages), tooltips. |

Ghi chú: Toàn bộ Line-height được thiết lập dựa trên bội số của 8 để tương thích hoàn toàn với Hệ thống Lưới 8-Điểm (8-Point Grid).21

#### **2.1.3 Hệ thống Khoảng cách (8-Point Grid Spacing System)**

Hệ thống khoảng cách là chất keo kết dính các thành phần UI. Thiết kế SaaS này áp dụng hệ thống lưới 8-điểm (8-point grid system), trong đó mọi margin, padding, và kích thước chiều cao/rộng đều phải là bội số của 8 (8, 16, 24, 32, 40...).21 Việc sử dụng lưới 8-điểm giúp hệ thống tự động chia tỷ lệ sắc nét trên mọi mật độ điểm ảnh (pixel density), đặc biệt hữu ích trên các màn hình có tỷ lệ như 1.5x, tránh được hiện tượng mờ nét (anti-aliasing blurring) do không sinh ra các điểm ảnh thập phân.22

Bên cạnh đó, lưới 4-điểm (4px) được áp dụng như một hệ số phụ (sub-atomic) dành riêng cho các chi tiết siêu nhỏ, chẳng hạn như khoảng cách giữa một biểu tượng (icon) và văn bản bên trong một nút bấm, hoặc khoảng cách giữa nhãn (label) và trường nhập liệu (input field).22

#### **2.1.4 Border Radius và Shadow (Độ bo góc và Đổ bóng)**

Bo góc (Border Radius) và Đổ bóng (Shadow/Elevation) xác định độ mềm mại và hệ thống phân cấp chiều sâu (Z-index hierarchy) của ứng dụng.

* **Border Radius:**  
  * radius-sm (4px): Dành cho Checkbox, Tag, Badge.  
  * radius-md (8px): Dành cho Input, Button, Dropdown Menu.  
  * radius-lg (12px \- 16px): Dành cho Card, Modal, Drawer. Cảm giác hiện đại, bao bọc dữ liệu tốt hơn.  
* **Shadow System (Mô phỏng nguồn sáng tĩnh):**  
  * shadow-sm: Rất nhẹ, dùng cho Input/Button ở trạng thái Default.  
  * shadow-md: Dùng cho Card chứa dữ liệu tĩnh, tạo sự nổi bật so với nền color-neutral-background.  
  * shadow-lg: Đổ bóng sâu, phân tán rộng. Dành cho Dropdown Menu, Tooltip.  
  * shadow-xl: Đổ bóng mạnh nhất, kết hợp với màng chắn nền mờ (backdrop blanket). Dành riêng cho Modal và Drawer để người dùng tập trung hoàn toàn.23

### **2.2 Hệ thống Thành phần (Component System)**

Lớp Component là tập hợp các khối xây dựng cơ bản (Building blocks) của ứng dụng. Mỗi component cần có tài liệu kỹ lưỡng, nếu không có tài liệu (undocumented), component đó coi như không tồn tại.9 Việc áp dụng Auto Layout (Figma) và các thuộc tính tương ứng trong React giúp đồng bộ hóa quy trình.9

#### **2.2.1 Button Component (Nút bấm)**

Nút bấm định hướng luồng hành động của người dùng. Một hệ thống Button hoàn thiện cần kiểm soát tốt sự giao thoa giữa Biến thể (Variants) và Trạng thái (States).25

| Variant (Loại Nút) | Trạng thái Mặc định (Default) | Tương tác (Hover / Active) | Trạng thái Vô hiệu / Đang tải (Disabled / Loading) | Hướng dẫn Sử dụng (Usage Guidelines) |
| :---- | :---- | :---- | :---- | :---- |
| **Primary** | Nền: primary-default. Chữ: Trắng. Không viền. | Nền: primary-hover. Bóng đổ đậm hơn khi hover. | Nền xám nhạt, chữ xám mờ. Chặn sự kiện click. Icon xoay vòng nếu Loading. | Hành động chính, quan trọng nhất trên màn hình (Ví dụ: "Lưu", "Tạo mới"). Chỉ dùng 1 nút Primary mỗi form.26 |
| **Secondary** | Nền: Trong suốt. Viền: primary-default. Chữ: primary-default.25 | Nền màu Primary rất nhạt (10% opacity). | Viền và chữ xám nhạt. Chặn sự kiện click. | Các hành động thay thế (Ví dụ: "Hủy bỏ", "Quay lại"). Xuất hiện cạnh Primary.25 |
| **Tertiary (Text)** | Không nền, không viền. Chữ: primary-default.26 | Gạch chân chữ hoặc nền nhạt. | Chữ xám mờ. | Hành động ít quan trọng (Ví dụ: "Tìm hiểu thêm", "Xóa bộ lọc").26 |
| **Danger** | Nền: semantic-error. Chữ: Trắng.15 | Nền: error-hover. Đổ bóng đỏ. | Nền xám nhạt. | Hành động phá hủy dữ liệu vĩnh viễn (Ví dụ: "Xóa tài khoản").15 |
| **Icon Only** | Hình vuông cân xứng, chứa icon căn giữa.26 | Hiện nền mờ đằng sau icon. | Icon xám mờ. | Dùng ở toolbar, thao tác nhanh trên Data table. Bắt buộc có Tooltip giải thích.26 |

#### **2.2.2 Input / Form Controls (Thành phần Biểu mẫu)**

Thành phần nhập liệu phải cung cấp đầy đủ tín hiệu thị giác (visual cues) để hướng dẫn người dùng hoàn thành biểu mẫu mà không gặp rào cản.

* **Cấu trúc chuẩn:** Một Input hoàn chỉnh phải bao gồm: Label (Nhãn), Input Field (Trường nhập), Placeholder (Gợi ý mờ), và Helper Text/Error Message (Văn bản hỗ trợ/Lỗi). Khoảng cách giữa Label và Input luôn là 4px.  
* **Trạng thái (States):**  
  * *Default:* Border xám nhạt (color-neutral-border).  
  * *Hover:* Border xám đậm hơn.  
  * *Focus:* Viền phát sáng (Focus ring) bao quanh input (sử dụng box-shadow kết hợp outline-none để tạo ring màu Primary 2px). Đây là yêu cầu bắt buộc của Accessibility để định vị bàn phím.  
  * *Error:* Border chuyển đỏ (color-semantic-error), rung nhẹ nếu cần thiết. Hiển thị thông báo lỗi ngay dưới Input với font-size text-caption màu đỏ. Đi kèm một icon cảnh báo nhỏ (X icon) trong trường nhập liệu.  
  * *Disabled:* Nền xám nhạt, border mờ, con trỏ chuột not-allowed.

#### **2.2.3 Data Table / List (Bảng Dữ liệu)**

Data Table là khu vực phức tạp nhất của SaaS, nơi người dùng tiêu thụ lượng lớn thông tin. Thiết kế bảng phải giảm thiểu độ nhiễu thị giác và ưu tiên khả năng quét dữ liệu nhanh.24

* **Căn lề (Alignment Rules):** Văn bản định tính (Tên, Email, Trạng thái) luôn căn trái (Left-aligned).30 Số liệu định lượng (Tiền tệ, Phần trăm, Kích thước) luôn căn phải (Right-aligned) kết hợp sử dụng Tabular Typography (các chữ số có độ rộng bằng nhau) để dễ dàng đối chiếu toán học dọc theo hàng.30 Tiêu đề cột (Headers) phải kế thừa luật căn lề của dữ liệu bên dưới.30 Tuyệt đối không dùng căn giữa (Center-align).30  
* **Mật độ hiển thị (Density):** Chiều cao hàng tiêu chuẩn từ 48px \- 56px (Thoải mái), nhưng cho phép người dùng chuyển sang chế độ Compact (32px \- 40px) để xem được nhiều hàng hơn mà không cần cuộn trang.  
* **Giảm độ nhiễu (Noise reduction):** Xóa bỏ các đường viền dọc (vertical borders) gây cản trở tầm nhìn. Sử dụng đường kẻ ngang (horizontal borders) thanh mảnh hoặc hiệu ứng hàng chẵn-lẻ (Zebra striping).28 Tránh hiển thị tất cả các icon hành động; thay vào đó, đặt chúng vào một nút Dropdown "..." ở cột cuối cùng hoặc chỉ hiện khi người dùng di chuột (hover) qua hàng.28  
* **Tương tác mở rộng:** Áp dụng cột cố định (Sticky Columns) cho ID/Tên ở bên trái và Action ở bên phải khi bảng có quá nhiều cột, đảm bảo ngữ cảnh không bị mất khi cuộn ngang.24 Cho phép thu gọn/mở rộng hàng (Expandable rows) để xem chi tiết thay vì tải sang trang mới.28

#### **2.2.4 Modal / Drawer (Cửa sổ Lớp phủ)**

Modal và Drawer đại diện cho các luồng công việc làm gián đoạn bối cảnh hiện tại của người dùng.

* **Modal (Dialog):** Hiển thị ở trung tâm màn hình, có nền mờ (Backdrop). Thích hợp cho các luồng hành động ngắn, cần sự chú ý cao (VD: Xác nhận xóa, Tạo mới nhanh mục đơn giản). Kích thước tối đa không nên vượt quá 600px chiều rộng. Nút hành động chính (Primary Button) luôn nằm bên phải phía dưới, nút Hủy (Secondary) nằm bên trái nút chính.  
* **Drawer (Slide-over panel):** Trượt ra từ cạnh phải của màn hình. Kéo dài toàn bộ chiều cao màn hình. Drawer chứa được khối lượng nội dung lớn hơn Modal, thích hợp cho các biểu mẫu dài (Form) hoặc xem chi tiết một bản ghi từ Data Table mà người dùng vẫn muốn giữ một phần ngữ cảnh của trang chính ẩn phía sau mặt nạ mờ.

#### **2.2.5 Navigation (Thanh Điều hướng: Sidebar & Header)**

Hệ thống điều hướng là xương sống của cấu trúc sản phẩm.

* **Sidebar (Thanh bên):** Dành cho điều hướng chính (Global Navigation). Các mục trong Sidebar phải có chiều cao tối thiểu 40px để đảm bảo vùng chạm an toàn (touch target) trên các thiết bị cảm ứng.32 Khoảng cách lề trong (padding) chuẩn là 16px. Icon kích thước 20-24px đặt thẳng hàng với chữ.32 Các nhóm chức năng cần được chia tách bởi các tiêu đề danh mục in hoa nhỏ (Category headers).32  
* **Header (Thanh trên cùng):** Chứa các công cụ điều hướng ngữ cảnh (Contextual Navigation). Bao gồm Thanh tìm kiếm toàn cục (Global Search), Mẩu bánh mì (Breadcrumbs) thông báo vị trí, Khu vực cài đặt hiển thị, Thông báo (Notifications), và Menu Hồ sơ người dùng (User Profile Menu).33

## ---

**3\. Quy chuẩn UX Đồng nhất (UX Consistency Rules)**

Giao diện tốt không chỉ dừng lại ở mặt thẩm mỹ. Tương tác hệ thống phải diễn ra nhất quán và dễ đoán để xây dựng thói quen và sự tin tưởng từ người dùng.1

### **3.1 Quy chuẩn Hành vi Biểu mẫu (Form Behavior & Validation)**

Luồng kiểm tra tính hợp lệ của dữ liệu (validation) là điểm dễ gây ức chế nhất nếu không được thiết kế đúng. Hệ thống mới sẽ tuân thủ nguyên tắc "Không cảnh báo sớm, Phục hồi nhanh chóng".

* **Kiểm tra ban đầu (Initial Validation):** Không sử dụng sự kiện onChange để báo lỗi khi người dùng mới bắt đầu gõ.34 Việc hiển thị thông báo lỗi "Email không hợp lệ" ngay ở ký tự đầu tiên tạo ra trải nghiệm tồi tệ. Quá trình kiểm tra lỗi chỉ được kích hoạt lần đầu tiên thông qua sự kiện onBlur (khi người dùng click ra khỏi trường nhập liệu) hoặc khi bấm nút "Submit".4  
* **Xóa lỗi (Error Clearance):** Khi một trường đã bị báo lỗi, cơ chế kiểm tra sẽ chuyển sang lắng nghe onChange.35 Ngay khi người dùng gõ chuỗi ký tự hợp lệ mới, thông báo lỗi phải biến mất tức thì, thay vì buộc họ phải click ra ngoài một lần nữa để xem lỗi đã hết chưa.35  
* **Ngăn chặn Submit:** Nút "Lưu" (Primary Button) trong Form không nên bị Disabled một cách mặc định (trừ khi hệ thống đang ở trạng thái Loading). Nếu nút bị Disable, người dùng không biết mình nhập sai ở đâu. Cho phép người dùng click Submit, sau đó cuộn màn hình đến (scroll-to-view) trường bị lỗi đầu tiên và focus vào nó.

### **3.2 Quy chuẩn Trạng thái Đang tải (Loading / Skeleton)**

Hệ thống cần phân tách rõ ràng giữa các sự kiện tải trang toàn cục và tải cục bộ:

* **Global / Page Loading:** Khi tải nội dung lớn hoặc chuyển trang, sử dụng **Skeleton Screens**. Skeleton duy trì bố cục trang (layout) bằng các dải xám nhấp nháy, giúp mắt người dùng chuẩn bị sẵn không gian cho nội dung sắp hiển thị, giảm tải nhận thức và cảm giác chờ đợi.7  
* **Local / Component Loading:** Khi một hành động nhỏ diễn ra (như bấm lưu Form), sử dụng hiệu ứng vòng xoay (Spinner) đặt trực tiếp bên trong nút bấm. Quan trọng nhất: Nút bấm không được thay đổi chiều rộng khi chữ biến thành Spinner, tránh làm giật toàn bộ layout xung quanh.

### **3.3 Quy chuẩn Trạng thái Trống (Empty State)**

Trạng thái trống không được hiểu là "Lỗi không có dữ liệu". Đây là một cơ hội giáo dục và điều hướng hành vi người dùng (Onboarding).6 Hệ thống chia Empty State thành 3 mô hình xử lý 6:

1. **Trạng thái Hướng dẫn Hành động (Action-oriented / First-time Use):** Xuất hiện khi người dùng mới tạo tài khoản và danh sách trống.6 Màn hình cần bao gồm một lời chào thân thiện, giải thích ngắn gọn lợi ích của tính năng, và quan trọng nhất: Một Nút Primary lớn định hướng người dùng thực hiện hành động đầu tiên (Ví dụ: "Tạo dự án mới").6  
2. **Trạng thái Thông tin (Informational):** Xảy ra khi một bộ lọc (filter) hoặc tìm kiếm không trả về kết quả.6 Tránh thông báo chung chung "Không tìm thấy". Thay vào đó, cung cấp hướng xử lý: "Không tìm thấy kết quả. Hãy thử xóa bộ lọc hoặc tìm kiếm bằng từ khóa khác", kèm theo nút "Xóa toàn bộ bộ lọc".6  
3. **Trạng thái Tán thưởng (Celebratory):** Xảy ra khi danh sách công việc cần làm được dọn sạch.6 Cung cấp một hình ảnh minh họa nhỏ tích cực kèm thông điệp khích lệ (Ví dụ: "Tất cả đã hoàn thành. Hãy tận hưởng ngày của bạn\!").6

*(Lưu ý: Không lạm dụng hình minh họa lớn cho các khối nội dung nhỏ như Card hay Sidebar, chỉ dùng văn bản ở các khu vực này)*.38

### **3.4 Quy chuẩn Xử lý Lỗi (Error Handling)**

Lỗi hệ thống phải được phân cấp hiển thị. Các lỗi nghiêm trọng toàn cục (mất kết nối mạng, sập server) sử dụng Banner/Alert dính ở đỉnh màn hình (Top-level banner). Lỗi liên quan đến thao tác dữ liệu (lưu thất bại) sử dụng Toast Notifications (thông báo trượt lên góc màn hình) với màu Semantic Error, tự động biến mất sau 3-5 giây. Lỗi nhập liệu cục bộ hiển thị bằng văn bản màu đỏ ngay dưới input field.

## ---

**4\. Hệ thống Cấu trúc Trang (Layout System)**

Một cấu trúc Layout bền vững đảm bảo việc mở rộng ứng dụng trong tương lai không bị xé rào, giữ cho cấu trúc xương của giao diện nhất quán.

### **4.1 Grid System và Responsive Rules**

Giao diện áp dụng hệ thống lưới 12 cột (12-column Grid) linh hoạt dựa trên CSS Grid và Flexbox.39 Khoảng trống giữa các cột (Gutter) chuẩn hóa ở mức 24px (1.5rem).21 Các mốc Responsive (Breakpoints) quy định hành vi của Grid:

* sm (\< 640px \- Mobile): Layout chuyển hoàn toàn về 1 cột (1 column). Sidebar bị ẩn và chuyển thành Menu Hamburger trượt (Drawer).  
* md (640px \- 1024px \- Tablet): Layout sử dụng 4 \- 8 cột. Sidebar có thể ở dạng thu gọn (Collapsed \- chỉ hiện icon).  
* lg / xl (\> 1024px \- Desktop): Layout dàn đủ 12 cột. Sidebar mở rộng hoàn toàn (khoảng 240-280px). Không gian nội dung chính chiếm phần còn lại, được neo giữa màn hình nếu kích thước màn hình vượt quá 1440px (max-width) để tránh nội dung bị dàn trải quá đà gây mỏi mắt.21

### **4.2 Các Biểu mẫu Trang (Page Templates)**

Để tránh việc các nhà phát triển tự ý sắp xếp màn hình, 3 khuôn mẫu trang cốt lõi (Templates) được cung cấp sẵn:

* **Dashboard Template:** Tối ưu hóa việc hiển thị biểu đồ và thẻ số liệu. Bố cục quy định các thẻ KPI (KPI tiles) nhỏ gọn nằm ở hàng trên cùng (Top row).41 Các biểu đồ theo thời gian (Time-series) cần diện tích ngang lớn hơn sẽ xếp ở các hàng bên dưới.41 Các Widget được chứa trong các Card có đổ bóng shadow-md và không gian thở (padding) nghiêm ngặt.41  
* **CRUD (Create/Read/Update/Delete) / List Template:** Dành cho trang quản lý danh sách. Cấu trúc gồm 3 phần: (1) Page Header (Tiêu đề, Breadcrumb, Primary Action Button ở góc phải), (2) Filter/Search Toolbar (Thanh công cụ lọc), và (3) Data Table chiếm toàn bộ không gian còn lại ở phía dưới.  
* **Detail Page Template:** Trang xem chi tiết dữ liệu (VD: Hồ sơ khách hàng). Áp dụng bố cục 2 cột bất đối xứng (ví dụ tỷ lệ 1/3 và 2/3). Cột nhỏ bên trái hoặc phải chứa siêu dữ liệu tóm tắt (Metadata, Tag, Trạng thái). Cột lớn chứa các Card thông tin chi tiết và lịch sử hoạt động.

## ---

**5\. Ánh xạ Thiết kế sang Mã nguồn — Ship-app (thực tế repo)**

Kiến trúc UI **đang chạy** trên: **Vite + React 18 + React Router + Refine**, **Tailwind**, token trong **`src/index.css`** (không dùng `app/` hay `globals.css` như ví dụ Next.js cũ). **Hai lớp UI:** Radix/shadcn (`src/components/ui/`) và **Ant Design** (filter phức tạp, bảng, form dialog, Spin).43

### **5.1 Tư duy Shadcn/Radix + Ant (hybrid)**

* **Shadcn (`src/components/ui/*`):** mã nguồn trong repo, CVA cho variant — phù hợp shell (layout, dialog, button, tabs), focus ring, dark mode qua class `.dark`.45  
* **Ant Design:** giữ cho `Table`, `Select` nhiều tùy chọn, `Form` + `ConfigProvider` — tránh “ép” toàn bộ sang Radix trong một sprint. Chiến lược: **shell + pattern list** dùng shadcn; **dense data** dùng Ant có skin (ví dụ `.professional-ant-table`).

### **5.2 Cấu trúc thư mục thực tế (thay cho sơ đồ `app/` cũ)**

```
src/
├── index.css              # Design tokens :root / .dark + lớp .sku-*
├── styles/
│   ├── main.scss          # @import tailwind + variables + components
│   ├── variables.scss     # Layout SCSS ($sidebar-width, breakpoints…)
│   └── components.scss    # .list-page-filters, layout shell
├── components/
│   ├── ui/                # shadcn primitives (~50 file)
│   ├── common/            # PageHeader, ListPageFilters, SearchField, …
│   ├── form/              # FormItemSelect, Button (legacy — xem 1.3)
│   └── table/             # DataTable, BaseTable, SCSS Ant table
├── layouts/AppLayout.tsx  # SidebarProvider + max-w-[1600px]
├── pages/                 # ~68 file TSX
├── routes/appRouteConfig.tsx  # 19 CRUD × 4 route + 6 single
└── providers/             # Refine dataProvider, auth, …
```

**Quy ước đặt tên:** Page có thể import trực tiếp `ui/button` — đây là **chuẩn ship-app**; nếu cần tách “organism”, tạo file mới dưới `components/common/` hoặc `components/blocks/` (tùy chọn, chưa bắt buộc).

### **5.3 Design tokens — nguồn sự thật**

| Nội dung | File | Ghi chú |
|----------|------|---------|
| Màu semantic, shadow skeuomorphic, chart, radius | [`src/index.css`](../src/index.css) | `--primary`, `--destructive`, `--shadow-card`, … |
| Map Tailwind `colors.*` | [`tailwind.config.js`](../tailwind.config.js) | `hsl(var(--…))` |
| Layout số (sidebar 260px, header 56px…) | [`src/styles/variables.scss`](../src/styles/variables.scss) + mirror trong `index.css` | Đồng bộ với `AppLayout` / `site-header` |
| Toolbar CRUD (40px, clamp width) | [`src/styles/components.scss`](../src/styles/components.scss) | `.list-page-filters--grid-4`, `--grid-3`, `--dual-entity` |
| Bảng mô tả đầy đủ | [design-system.md](design-system.md) | Báo cáo kỹ thuật đo từ code |

### **5.4 Ranh giới Custom vs thư viện (cập nhật cho ship-app)**

* **Dùng `ui/*` + token:** Button/Card/Input/Dialog/Tabs phần lớn layout; tránh hardcode màu ngoài `hsl(var(--…))` / utility Tailwind.  
* **Dùng Ant:** `Select` filter phức tạp (prefix icon, `showSearch`), `Table` nặng, `Spin` trong `PageLoadingOverlay`.  
* **Compound đã có:** [`ListPageFilters`](../src/components/common/ListPageFilters.tsx) gói layout toolbar + `SearchField` + nút Tìm/Đặt lại — mở rộng theo hướng composition (skill `vercel-composition-patterns`).  
* **Đã xử lý:** bản `form/Button.tsx` trùng `ui/button` đã được gỡ; dùng thống nhất `@/components/ui/button` (mục 1.3).

## ---

**6\. Kế hoạch Chuyển đổi và Tái cấu trúc (Migration Plan)**

Đối với một dự án SaaS đang vận hành với lượng người dùng lớn, một đợt phát hành thay đổi toàn bộ hệ thống (Big Bang Deployment) là hành động tiềm ẩn rủi ro phá vỡ vận hành và ngắt quãng kinh doanh.49 Chiến lược di trú được lựa chọn là Phương pháp Tiếp cận Từng phần (Incremental Adoption / Layered Migration) theo mô hình "Crawl \- Walk \- Run" (Nhích \- Đi bộ \- Chạy).49

### **6.1 Lộ trình Ưu tiên và Rollout**

Kế hoạch được chia thành các làn sóng ưu tiên nhằm quản lý rủi ro và thu thập phản hồi 52:

1. **Giai đoạn 1: Crawl (Thử nghiệm Pilot \- Rủi ro thấp):** Không chạm vào các quy trình cốt lõi (như Thanh toán hay Xử lý dữ liệu). Lựa chọn ưu tiên nâng cấp các màn hình có ít sự phụ thuộc (low dependencies) như: Trang Cài đặt Hệ thống (Settings), Các trang báo lỗi (404, Error States), hoặc Trạng thái trống (Empty States).52 Tại bước này, hệ thống Design Tokens (màu sắc, typography) được bơm vào dự án, kiểm thử việc đổi Theme không làm vỡ các module cũ. Đội ngũ kiểm tra khả năng hoạt động của các Shadcn button, input độc lập.  
2. **Giai đoạn 2: Walk (Đồng bộ Khung kiến trúc):** Với **ship-app**, khung `AppLayout` + sidebar/header đã triển khai; giai đoạn này tập trung **đồng bộ spacing / max-width** (ví dụ vùng chính `max-w-[1600px]` so với token SCSS `1400px` — chọn một chuẩn và cập nhật [design-system.md](design-system.md)), tinh chỉnh responsive tablet, và áp dụng 8-point grid nhất quán trên các page còn lệch.  
3. **Giai đoạn 3: Run (Tái cấu trúc Component Cốt lõi):** **Không** “big bang” thay toàn bộ Ant bằng Radix. Ưu tiên: (a) ~~gộp / loại bỏ `form/Button`~~ **đã gỡ**; (b) chuẩn hoá form validation theo mục 3.1; (c) empty state + bảng (căn số, `tabular-nums`) theo mục 2.2.3; (d) migration từng cụm Ant Table nếu có yêu cầu nghiệp vụ. Luôn chạy regression + `tsc`/`lint`.

### **6.2 Quản lý Quá trình Chuyển đổi và Tránh Đứt gãy**

Sự thất bại của các dự án làm mới UI thường do việc tái cấu trúc bị coi là "việc làm lúc rảnh rỗi" (afterthought). Để biến nó thành thực tế:

* **Tích hợp vào Sprint Cycle:** Xác định một ngân sách thời gian cố định. Trích xuất **15% đến 25% nguồn lực (bandwidth)** của mỗi Sprint cho các Ticket liên quan đến refactor Design System và trả Nợ Kỹ thuật.1 Một số tổ chức có thể thiết lập các "Cleanup Sprints" toàn diện vào cuối mỗi quý.1  
* **Chiến lược Strangler Fig:** Chạy song song hệ thống cũ và mới. Bọc các luồng giao diện mới trong cờ tính năng (Feature Flags). Cho phép một nhóm người dùng beta (Pilot users) trải nghiệm trước để đo lường tỷ lệ lỗi. Chỉ tắt và xóa bỏ mã nguồn giao diện cũ (Decommissioning) khi hệ thống UI mới đã chứng minh được sự ổn định hoàn toàn.50  
* **Tự động hóa Kiểm duyệt:** Thiết lập các bot CI/CD (Auto-linting) để phân tích các Pull Request. Bất kỳ đoạn mã nào cố tình nhúng mã màu HEX cứng hoặc kích thước margin tĩnh (ví dụ margin-top: 15px thay vì dùng utility class mt-4 của Tailwind) sẽ bị từ chối tự động.8 Việc này ngăn chặn sự nảy sinh trở lại của Nợ Kỹ thuật ngay từ gốc rễ.8

Kết luận, việc thực thi chặt chẽ bản kiến trúc Design System này sẽ giải quyết tận gốc các mâu thuẫn về trải nghiệm, giảm tải chi phí bảo trì. Đồng thời, nền tảng Shadcn kết hợp Tailwind sẽ cấp quyền tự chủ hoàn toàn cho đội ngũ kỹ thuật, biến các thiết kế trừu tượng thành các hệ sinh thái linh hoạt, nhất quán và sẵn sàng mở rộng cho bất kỳ tính năng phức tạp nào trong tương lai.

## ---

**7\. Rà soát code theo Cursor Rule & Agent Skills (ship-app)**

Nguồn: [.cursor/rules/ship-app-from-agents-skills.mdc](../.cursor/rules/ship-app-from-agents-skills.mdc). **Không áp dụng** rule Next.js (RSC, App Router, Server Actions, `next/dynamic`). **Không bắt buộc** rule chỉ dành cho React 19.

### **7.1 Checklist PR / refactor UI (bắt buộc)**

| Nhóm | Hành động | Ghi chú |
|------|-----------|---------|
| **Stack** | Giữ Refine (`useList`, `useDelete`, …), `dataProvider`, route `appRouteConfig` | Không đổi contract API chỉ vì đổi UI |
| **Performance (`vercel-react-best-practices`)** | Lazy + `Suspense` cho trang nặng; tránh barrel import toàn bộ `lucide-react` nếu không cần | Đã có pattern `App.tsx` + `appRouteConfig` |
| **Conditional render** | Ưu tiên ternary khi có nguy cơ render `0` | Rule `rendering-conditional-render` |
| **Composition (`vercel-composition-patterns`)** | Ưu tiên compound / slot thay vì thêm boolean prop; ví dụ [`ListPageFilters`](../src/components/common/ListPageFilters.tsx) | Không refactor sang React 19 chỉ để đổi API ref |
| **A11y / UX (khi được yêu cầu)** | Skill `web-design-guidelines`: đối chiếu URL trong `SKILL.md` | Dùng khi task là “review UI/accessibility” |
| **Đo lường** | Sau chỉnh UI: `npx tsc --noEmit` + `npm run lint` | Đồng bộ với [audit-ship-app-from-agents-skills.md](audit-ship-app-from-agents-skills.md) |

### **7.2 Điều chỉnh mục 6 (Crawl–Walk–Run) cho ship-app**

| Giai đoạn | Thay vì mô tả chung | Việc cụ thể đã / nên làm |
|-----------|---------------------|---------------------------|
| **Crawl** | Token + Settings | Token đã có trong `index.css`; tiếp tục: empty state có CTA, `ErrorState`/404, Settings/Notifications |
| **Walk** | Sidebar + Header | Đã có `AppLayout`, `SiteHeader`, `SidebarProvider`; tinh chỉnh spacing theo [design-system.md](design-system.md) |
| **Run** | “Bỏ hết Ant” | **Không khuyến nghị** xóa Ant một lần — thay bằng: skin Ant (`professional-ant-table`), nút CTA thống nhất `ui/button`, form validation theo mục 3.1 |

### **7.3 Liên kết tài liệu nội bộ**

* [design-system.md](design-system.md) — kích thước, màu, component.  
* [audit-ship-app-from-agents-skills.md](audit-ship-app-from-agents-skills.md) — route, CRUD list, toolbar matrix.

---

#### **Nguồn trích dẫn**

1. UX Debt: How to Identify, Prioritize, and Resolve \- NN/G, truy cập vào tháng 4 12, 2026, [https://www.nngroup.com/articles/ux-debt/](https://www.nngroup.com/articles/ux-debt/)  
2. How to Reduce and Manage Tech Debt in Software Projects | SapientPro, truy cập vào tháng 4 12, 2026, [https://sapient.pro/blog/what-is-technical-debt](https://sapient.pro/blog/what-is-technical-debt)  
3. Reducing UX Debt: A Guide to Identifying and Resolving Issues, truy cập vào tháng 4 12, 2026, [https://excited.agency/blog/ux-debt](https://excited.agency/blog/ux-debt)  
4. onchange and onblur \- Mastering Javascript, truy cập vào tháng 4 12, 2026, [https://js.muthu.co/posts/onchange-and-onblur/](https://js.muthu.co/posts/onchange-and-onblur/)  
5. What is the difference between onBlur and onChange attribute in HTML? \- Stack Overflow, truy cập vào tháng 4 12, 2026, [https://stackoverflow.com/questions/785099/what-is-the-difference-between-onblur-and-onchange-attribute-in-html](https://stackoverflow.com/questions/785099/what-is-the-difference-between-onblur-and-onchange-attribute-in-html)  
6. Empty state UX examples and design rules that actually work \- Eleken, truy cập vào tháng 4 12, 2026, [https://www.eleken.co/blog-posts/empty-state-ux](https://www.eleken.co/blog-posts/empty-state-ux)  
7. Designing Empty States in Complex Applications: 3 Guidelines \- NN/G, truy cập vào tháng 4 12, 2026, [https://www.nngroup.com/articles/empty-state-interface-design/](https://www.nngroup.com/articles/empty-state-interface-design/)  
8. Technical Debt Management: A Modern Framework for SaaS and Product Leaders | Logiciel, truy cập vào tháng 4 12, 2026, [https://logiciel.io/blog/technical-debt-management-for-saas-leaders](https://logiciel.io/blog/technical-debt-management-for-saas-leaders)  
9. SaaS Design System Guide: Scale UI Without Chaos | F1Studioz, truy cập vào tháng 4 12, 2026, [https://f1studioz.com/blog/saas-design-system-guide/](https://f1studioz.com/blog/saas-design-system-guide/)  
10. Overview \- Foundations \- Atlassian Design, truy cập vào tháng 4 12, 2026, [https://atlassian.design/foundations](https://atlassian.design/foundations)  
11. Accelerating Themeable Design Systems with shadcn/ui \- A Step-by-Step Guide \- Perpetual, truy cập vào tháng 4 12, 2026, [https://www.perpetualny.com/blog/accelerating-themeable-design-systems-with-shadcn-ui-a-step-by-step-guide](https://www.perpetualny.com/blog/accelerating-themeable-design-systems-with-shadcn-ui-a-step-by-step-guide)  
12. Design tokens – Material Design 3, truy cập vào tháng 4 12, 2026, [https://m3.material.io/foundations/design-tokens](https://m3.material.io/foundations/design-tokens)  
13. 3-tier design token system : r/DesignSystems \- Reddit, truy cập vào tháng 4 12, 2026, [https://www.reddit.com/r/DesignSystems/comments/1it1erb/3tier\_design\_token\_system/](https://www.reddit.com/r/DesignSystems/comments/1it1erb/3tier_design_token_system/)  
14. An introduction to design tokens \- Donux, truy cập vào tháng 4 12, 2026, [https://donux.com/blog/introduction-to-design-tokens](https://donux.com/blog/introduction-to-design-tokens)  
15. Streamlining Your Design System: A Guide to Tokens and Naming Conventions \- Medium, truy cập vào tháng 4 12, 2026, [https://medium.com/@wicar/streamlining-your-design-system-a-guide-to-tokens-and-naming-conventions-3e4553aa8821](https://medium.com/@wicar/streamlining-your-design-system-a-guide-to-tokens-and-naming-conventions-3e4553aa8821)  
16. Design Token Naming Best Practices \- Netguru, truy cập vào tháng 4 12, 2026, [https://www.netguru.com/blog/design-token-naming-best-practices](https://www.netguru.com/blog/design-token-naming-best-practices)  
17. Mastering typography in design systems with semantic tokens and responsive scaling, truy cập vào tháng 4 12, 2026, [https://uxdesign.cc/mastering-typography-in-design-systems-with-semantic-tokens-and-responsive-scaling-6ccd598d9f21](https://uxdesign.cc/mastering-typography-in-design-systems-with-semantic-tokens-and-responsive-scaling-6ccd598d9f21)  
18. Responsive Typography: rem, em, and px \- Element 84, truy cập vào tháng 4 12, 2026, [https://element84.com/software-engineering/web-development/responsive-typography/](https://element84.com/software-engineering/web-development/responsive-typography/)  
19. If you are using an 8px grid structure, should your text line height be rounded to nearest multiple of 8? \- Reddit, truy cập vào tháng 4 12, 2026, [https://www.reddit.com/r/UXDesign/comments/141guh8/if\_you\_are\_using\_an\_8px\_grid\_structure\_should/](https://www.reddit.com/r/UXDesign/comments/141guh8/if_you_are_using_an_8px_grid_structure_should/)  
20. Font size | U.S. Web Design System (USWDS), truy cập vào tháng 4 12, 2026, [https://designsystem.digital.gov/design-tokens/typesetting/font-size/](https://designsystem.digital.gov/design-tokens/typesetting/font-size/)  
21. Everything you should know about 8 point grid system in UX design, truy cập vào tháng 4 12, 2026, [https://uxplanet.org/everything-you-should-know-about-8-point-grid-system-in-ux-design-b69cb945b18d](https://uxplanet.org/everything-you-should-know-about-8-point-grid-system-in-ux-design-b69cb945b18d)  
22. What are spacing best practices (8pt grid system, internal ≤ external rule, etc.)? \- Cieden, truy cập vào tháng 4 12, 2026, [https://cieden.com/book/sub-atomic/spacing/spacing-best-practices](https://cieden.com/book/sub-atomic/spacing/spacing-best-practices)  
23. Overview \- Design tokens \- Atlassian Design System, truy cập vào tháng 4 12, 2026, [https://atlassian.design/tokens/design-tokens](https://atlassian.design/tokens/design-tokens)  
24. Stop struggling with your data tables | by Denislav Jeliazkov \- UX Collective, truy cập vào tháng 4 12, 2026, [https://uxdesign.cc/stop-struggling-with-your-data-tables-740347fddd89](https://uxdesign.cc/stop-struggling-with-your-data-tables-740347fddd89)  
25. How to use component variants to scale your design system \- Penpot, truy cập vào tháng 4 12, 2026, [https://penpot.app/blog/how-to-use-component-variants-to-scale-your-design-system/](https://penpot.app/blog/how-to-use-component-variants-to-scale-your-design-system/)  
26. Button UI Design: Best practices, Design variants & Examples \- Mobbin, truy cập vào tháng 4 12, 2026, [https://mobbin.com/glossary/button](https://mobbin.com/glossary/button)  
27. UI cheat sheets: buttons. My favourite design element is the… | by Tess Gadd \- Medium, truy cập vào tháng 4 12, 2026, [https://medium.com/the-school-of-do/ui-cheat-sheets-buttons-7856ff90f544](https://medium.com/the-school-of-do/ui-cheat-sheets-buttons-7856ff90f544)  
28. Table design UX guide to improve SaaS usability and clarity \- Eleken, truy cập vào tháng 4 12, 2026, [https://www.eleken.co/blog-posts/table-design-ux](https://www.eleken.co/blog-posts/table-design-ux)  
29. Best Practices for Usable and Efficient Data table in Applications \- UX Planet, truy cập vào tháng 4 12, 2026, [https://uxplanet.org/best-practices-for-usable-and-efficient-data-table-in-applications-4a1d1fb29550](https://uxplanet.org/best-practices-for-usable-and-efficient-data-table-in-applications-4a1d1fb29550)  
30. Data Table Design UX Patterns & Best Practices \- Pencil & Paper, truy cập vào tháng 4 12, 2026, [https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables)  
31. Designing Effective Data Tables — UI/UX (Part 1\) | by Vaishali Samanta | Medium, truy cập vào tháng 4 12, 2026, [https://medium.com/@vaishali.samanta/designing-effective-ui-ux-data-tables-101-part-1-09e1599553d4](https://medium.com/@vaishali.samanta/designing-effective-ui-ux-data-tables-101-part-1-09e1599553d4)  
32. Sidebar Design for Web Apps: UX Best Practices (2026 Guide), truy cập vào tháng 4 12, 2026, [https://www.alfdesigngroup.com/post/improve-your-sidebar-design-for-web-apps](https://www.alfdesigngroup.com/post/improve-your-sidebar-design-for-web-apps)  
33. Designing a layout structure for SaaS products (best practices) | by Vosidiy \- Medium, truy cập vào tháng 4 12, 2026, [https://medium.com/design-bootcamp/designing-a-layout-structure-for-saas-products-best-practices-d370211fb0d1](https://medium.com/design-bootcamp/designing-a-layout-structure-for-saas-products-best-practices-d370211fb0d1)  
34. May the Forms be with You: A Jedi's Guide to onBlur, onChange and onTouched, truy cập vào tháng 4 12, 2026, [https://dev.to/eelcoverbrugge/may-the-forms-be-with-you-a-jedis-guide-to-onblur-onchange-and-ontouched-7d6](https://dev.to/eelcoverbrugge/may-the-forms-be-with-you-a-jedis-guide-to-onblur-onchange-and-ontouched-7d6)  
35. Best practice for saving large form input values (onChange vs onBlur) in React (React Hook Form)? : r/reactjs \- Reddit, truy cập vào tháng 4 12, 2026, [https://www.reddit.com/r/reactjs/comments/1psra7j/best\_practice\_for\_saving\_large\_form\_input\_values/](https://www.reddit.com/r/reactjs/comments/1psra7j/best_practice_for_saving_large_form_input_values/)  
36. How to use onChange and onBlur at the same time per field · TanStack form · Discussion \#1784 \- GitHub, truy cập vào tháng 4 12, 2026, [https://github.com/TanStack/form/discussions/1784](https://github.com/TanStack/form/discussions/1784)  
37. Empty State UI design: From zero to app engagement \- Setproduct, truy cập vào tháng 4 12, 2026, [https://www.setproduct.com/blog/empty-state-ui-design](https://www.setproduct.com/blog/empty-state-ui-design)  
38. Empty States \- SAP, truy cập vào tháng 4 12, 2026, [https://www.sap.com/design-system/fiori-design-web/v1-96/foundations/best-practices/global-patterns/designing-for-empty-states](https://www.sap.com/design-system/fiori-design-web/v1-96/foundations/best-practices/global-patterns/designing-for-empty-states)  
39. Realizing common layouts using grids \- CSS \- MDN Web Docs, truy cập vào tháng 4 12, 2026, [https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid\_layout/Common\_grid\_layouts](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Common_grid_layouts)  
40. Responsive layout grid \- Material Design, truy cập vào tháng 4 12, 2026, [https://m2.material.io/design/layout/responsive-layout-grid.html](https://m2.material.io/design/layout/responsive-layout-grid.html)  
41. 6 steps to design thoughtful dashboards for B2B SaaS products \- UX Collective, truy cập vào tháng 4 12, 2026, [https://uxdesign.cc/design-thoughtful-dashboards-for-b2b-saas-ff484385960d](https://uxdesign.cc/design-thoughtful-dashboards-for-b2b-saas-ff484385960d)  
42. Dashboard Design UX Patterns Best Practices \- Pencil & Paper, truy cập vào tháng 4 12, 2026, [https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)  
43. How to build UI using GPT-5.2 \+ shadcn/ui \- Use UXPin Merge\!, truy cập vào tháng 4 12, 2026, [https://www.uxpin.com/studio/blog/build-ui-gpt-5-2-shadcn-ui-uxpin-merge/](https://www.uxpin.com/studio/blog/build-ui-gpt-5-2-shadcn-ui-uxpin-merge/)  
44. How do I use Shadcn/UI according to best practices? \- Reddit, truy cập vào tháng 4 12, 2026, [https://www.reddit.com/r/react/comments/1gqirzv/how\_do\_i\_use\_shadcnui\_according\_to\_best\_practices/](https://www.reddit.com/r/react/comments/1gqirzv/how_do_i_use_shadcnui_according_to_best_practices/)  
45. Shadcn UI Best Practices for 2026 | by Vaibhav Gupta | Write A ..., truy cập vào tháng 4 12, 2026, [https://medium.com/write-a-catalyst/shadcn-ui-best-practices-for-2026-444efd204f44](https://medium.com/write-a-catalyst/shadcn-ui-best-practices-for-2026-444efd204f44)  
46. How to Make Shadcn UI Components Actually Yours | Spectrum UI Blog, truy cập vào tháng 4 12, 2026, [https://ui.spectrumhq.in/blog/shadcn-customization-guide](https://ui.spectrumhq.in/blog/shadcn-customization-guide)  
47. Frontend Handbook | React / Tailwind / Shadcn \- Infinum, truy cập vào tháng 4 12, 2026, [https://infinum.com/handbook/frontend/react/tailwind/shadcn](https://infinum.com/handbook/frontend/react/tailwind/shadcn)  
48. Theming \- shadcn/ui, truy cập vào tháng 4 12, 2026, [https://ui.shadcn.com/docs/theming](https://ui.shadcn.com/docs/theming)  
49. Your Legacy to SaaS Implementation and Migration Playbook \- Mastery Logistics Systems, truy cập vào tháng 4 12, 2026, [https://www.mastery.net/your-legacy-to-saas-implementation-and-migration-playbook/](https://www.mastery.net/your-legacy-to-saas-implementation-and-migration-playbook/)  
50. What is a Cloud Migration Strategy? \- AWS, truy cập vào tháng 4 12, 2026, [https://aws.amazon.com/what-is/cloud-migration-strategy/](https://aws.amazon.com/what-is/cloud-migration-strategy/)  
51. SaaS Migration Strategy \- RSM Technology Blog, truy cập vào tháng 4 12, 2026, [https://technologyblog.rsmus.com/it-infrastructure/saas-migration-strategy/](https://technologyblog.rsmus.com/it-infrastructure/saas-migration-strategy/)  
52. Prioritization and migration strategy \- AWS Prescriptive Guidance, truy cập vào tháng 4 12, 2026, [https://docs.aws.amazon.com/prescriptive-guidance/latest/application-portfolio-assessment-guide/prioritization-and-migration-strategy.html](https://docs.aws.amazon.com/prescriptive-guidance/latest/application-portfolio-assessment-guide/prioritization-and-migration-strategy.html)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEcAAAAXCAYAAABZPlLoAAADOklEQVR4Xr2WS6hOURTH1/YeSMmrRCJKt0woyURMDDwjzNwMTEwkA0NDMylFZHDLzGPCVYpMZHK7SokoAwMpV5nJSKx91n6svc/aZ6/zfYdf/e93vvXa66y7zz4fwD/G5AZP0RFRhICP8rFyjmwdGbGcZJRsOZoYBf3KxOh+eTmlbMGe/p8ibYuAFJTZmq9S3EjIhaxV9kjoI1VI5STbyAxarGc50wrPv9eJGdrcELcbdQG1LvocrFS7vrSOZEupRwAsQk3oQkfEwEn8u8Zdd3EC9SfTT0w6l0QNz3bUgtzouYuaxr4nUUtzp5rmxlt3vwH1HbXe++zfVhRxHNxQDH3eQW1JQ/TI7QQWoraiHgOttTx1e9ICy1CfgQa2OfHkJKuLXVxGXUN9AhpSgZB7DPWcOWTEpRiCXzB5/A5dkTsahEQ71TOo16jbma+NUABoq75BLYHqcALNcORyRPSlUV05FdxwjDycDuz5fAA/b4J0SHbzFrXNtV0djru5o6gXqLOoV6gvKHveGOXtP0BtzI2WjuzunaNgJ+olagr8wVrnIrtuhtPRoG/+CFCjt4Ae7x2oX6j7kByYYiU805rc67nDImYQYw/nIeob6gpQ0zUOQtpPdec4dqFu4Hadx2z3gJqfZDYJ+9Z9h9qTOyr44RQO5AxDz749b96jTjubBhv2DGg4nGw4vlq5avCY5nePbX4ueiuUy0r44azMHQFW7zDQeWGHMp986tXWQlwMZdg1CSvtZ/E5H1BPjUl+TlwCyv3KbPqOAoUM43oz0nAox27jU6gZ1DR3D8BioJsTdo69TJr2Q9zLbFed7QmzDYJb2a+5ivt4jx+BDsGJYIHirPtizwK7uD0wOXZHhLeLW+sH6nyIIPMs0I7bx+wlim+rIn7nAKwe7I5zfNlY3thzp/VYQXyspoAdoKytQ6hHQIOyu2ZTdEWE22AHsuBtSOxzbDBcjBBfKshIQhTxAzDoKrzYIIV7FdEEa2K6qOW3/W2LQDsoWPKt1RZtwd/Q/5eysO5AZIXHX6fHe1lGk16PqUcQ2rhA7wQipikKKEIS+sSLsaLxf6FdnMdpcxw9w9tIBXJb+F50jEGs8Rf+SoSX10HspwAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAWCAYAAACVIF9YAAACiklEQVR4Xr2XTatOURTH1wklGYjk5QO4pDu9M2YmlDDyFQxMyFQZGJlhpNSdCSUGJspEigFjA7mUgZSBUmSga6299jln7/WyXzz3+tW/0/6vl73PefbZz/MAVBgKo/8CTTls6rxe8z6f1qgizsJtd8SLDm4kMAWLWTmqZUetRXkNZA7mMzEsj47USE9Fa241z01wA5LmxECW3VPak9sEN7TabkUtS3NBVlDPUT9Qn1FXUbuyDOKfn46CildqLfajrqPWUEutEzpZ66j7yfh39Kh/jtOggVPAPX/G6/s87LMT+CYfoZYH682W6BSacDUZf4/ejdnKi7xpHDshZFDvDyJQ3CFbUOdRr1D3glOfKWVJjGkBv4C3bhfWtMob8hvMH1YYqBLJUdRT1ANMPTKly2vONeAbI50BLwuywAHg/LsqUkZ8gs11E6uob6jbqIPFh2Lbf1BPUNtlQLAN+OZO0MBsZZrJO2jHU7KMY6jHqEvA72Yn08+B18CLuNWygkBMo4uuEI7Yoi3QCfUC9RF1gYywr/VMAcdOuQPzdt0jYjMNjTTDeINrunx26LA8h9eXqGdZJKIMIvRWXAG+kYtJ9Gb0SHwAGYWO2QL1pQ/D5R3w3s++8PunCxVngbfL4STwFngR9ABr0OsgT2GbeYHU+9M0MtgnDZ/qbdOL9wazTgMdSAB7Ues4/oo6JHIl8ylqTBPe6OCrINV8Qe3IXJW2EOPkgZOoh8BPlU7fy6jdU9QnO0Ur0FdX3PbDuP1HbT7p36mNfZDADTubyidQ0vFYM9E5F1MrsuKWl7JovIhb7AYMZC6PU9f7zZqRfsLFfBVURhH1rz94/VRrqgkTQ1OylWJ5ATOQmGZ8Y/gLa6hkE6wArfwAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAWCAYAAACVIF9YAAACdUlEQVR4XtWXMUsdQRDHZ03SSJpAwMTK7hHEpLNTsEhll0KC38BWsA8Ev0HagJ2QIgQkTcog5BOEFEFNZyOkSyOiszu3ezOzs3t78Sz8wbx3O/Ofmd3be3sKcCucdnQ4cGYod7Z4JiOUjvV5nzvs2cxdzaGtrisKC+4GWjJzTe5RaIFjW6pjOUwxLA5YD8y9YJIJm0VM5yAP0Vb8xf+lm1wnc+ya7C8X2j1tL2HGvHNVOxMhxcEz/NxHO0Wb2XWaeYP2Cmss4feTzvce7SvaXBSFzlkfy8ehIH5udjfvH9CN+81VNR4DLfIzdDvrqfaUPNUOZAPtF3SL5bWsupZPkin8Ak+EJ5NIHqC9RfuBdqhiQNnFCv4GCRw1f6n90+FogWJKxfmZLAM9Xp/QXiRvrUYf2wZj0Xayew60Gx91JEOm5zs4kgO0C7QPaIsioucpx3M4/GkF8nHgEdDiXpvRMiN+g6wyXq7h1xe0XTB3oUCq4baAmif0xPVYUo8y+h2spvTBTbTvaGfo21GxMRxh3nW/Xh6ykII4GkyjBfqDsYiv4Y/2Y7Rvju9BoXz/B7WO09jRyRnffc2kbI3hYvgeZ3RpC/0R7p/99FpI2PqA/V9DStkDanwpvBzDBfRzmGln0DK9SKX34R/u0izEC7tnjWLGO6AF+hdxEZU9cIoavegu+5xztPnO2cdNhuLQJNlAu4LiZHMcO0WTp4x/dcWfgLZbUu1LNEikqPS8GwRluzyg70DZHKzHJAl19J9NvU1RPNJk0JKG+5HdlDhOR6OcjpYLqsF2RBnHpzQVQ5WsuOUzGRIOxT0tmhZG1xmdMCnyWavRq24Azu9W8zxh0zgAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAWCAYAAABtwKSvAAACeElEQVR4XrVWv69NQRCeRZDQiUYlUVBrxB8gIlS0GokgGoloXqh0fryIhLyCRO0PUKgkFCqSp0IhOgk9lVwzZ3b37MzO7Nl77vUl3ztnv/lmzuzu2XMfQCeCFkiJoojVxjZcfwq4hhG+xY+0Y/8L5TNDHFl9WJqJcZXclHUs5DpqNCI2lvDLdZ0DmTWvBjQSZeASDi+itn+U1BIPl/EVqevWyvLQNeT4gxj5eIpcYO5iuDK/Ik8KF6jy+tkRjqxxAHmkMusx4jDyB/KT0mvwij/BP7eRR1XARR21dqvCJvpooX4CL9i9qaQdyPfIm5i4PcrNrMfAk5nE5M5YmkA2LPDufhmxsIHcQuMx6N6ZYTJ3lGaiEcooPXxvZtHONCfzEXk83rcnk+rz9RHyL/Jy1G4BP+xadGUYbT0H9tIZUDDckNXJndlITt6ZUExGFZbDq8grhbwb+Qv5JzsssPk0cgu5U8SmwWfGRIBTwOcloWNn7JWLoHO3mPDU6LYPHwJzZw4ivyitYzIthFfAq1dq6joP6TVDPhCBBs7K10xh7OcucOHfyF1Z5YUYJ7NS/2Yy1X6oxQyVcg7snXkW6EcywN44PoP8HIbJZxwCfti3QvNAv0038sjsuxTzPdXfLAISg23MuwDczL4kFNtLPF+YXwJ/0slLX0M6L9+RJ5Ihoe41yK9ZcFqvMJyZF1rVoNmmhkumwm+Rr4FXP2EP8jryHfIN8MSK/9M0RIvxaxb4a+Z3T6Ad1H0x23mErn8xBvg+P6Ih3gyVZlWpNa3osYEOC7hdrYLuUt1GhVl5ZZJTQMhx4FgnMTdvFfjPtCbvux3IhOXSl3OvC/8ArexbX9O4YXoAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAWCAYAAACosj4+AAAB2ElEQVR4Xr1UvS6EQRSdqSQaOgrZbOIBFCQkukXhLQSvoFVpFDTiCSQankNI1BTeQDQiqGSdu/N378yd72cjTvbszJx77p278823xlRhxaBCxDRjhxoBuYevwzz3cKWMcZTRUuFgUc3oNC2SoWqxPlY1VJAfhR9zuQ2qTxU7QMvTNBXC2DnLO7k/z7WTzwlmL+A3+ADuSBNDlp+X64gB8hZz0cGaTXx/getMHYOf4DzTeiNr9s64uvTDadwTUYY18A1cZSUogTgXBMJUp6EnUe39XOQQG6MKJdz4edBCsB3aFZHpY1s0xAyYzmD4MelkFlK0EZfG+YepXHPjPqqcUD1vCXwHt9yybgRGiD5jnNFc+uFMwO6QElUQLvUgD+jwRVtrRwM7IfmoCjjN0jMeY3E2UepGfcn703LVR2ail175VxFwl5oaupK6Q9pI360DqP5BXGVlHsFTKfmGjNmWOoMrsgzeyiPpBKp96KZl0i54Dq6As+CGb+hCuJBYpoa3zA6VWESKxRpU/yjKAs5xDN6DH1g+YRxxSwPiW5akamvXJv2tuDvqfgyNf4ewvWij2lMWEMm2CLegUqxc/Bem3LR3Wo8Ezeq0ptOTaAj1h/aoyw2aFG2W8AvItUGCbyHqTAAAAABJRU5ErkJggg==>