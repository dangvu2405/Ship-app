# Login workflow — bug & security scan

**Ngày:** 2026-05-12 (cập nhật đồng bộ mã 2026-05-12)  
**Phạm vi:** Frontend trong repo `ship-app` + snapshot route [`api.md`](../api.md). **Không** có `AuthController.php`, FormRequest, `config/sanctum.php` trong workspace — mọi kiểm tra backend chi tiết ghi **⚠️ MISSING**.

**Nguồn đã đọc:** `src/services/auth.service.ts`, `src/lib/auth-session.ts`, `src/stores/auth.store.ts`, `src/providers/authProvider.tsx`, `src/pages/auth/login-form.tsx`, `src/pages/auth/forgot-password-verify-form.tsx`, `src/lib/axios.ts`, `src/layouts/NavUser.tsx`, `src/App.tsx`, `src/hooks/useAuth.ts`, `.env.example`, [`api.md`](../api.md).  
File `context-frontend.txt` / `antd_*.md` không dùng làm bằng chứng dòng lệnh (ưu tiên mã nguồn trực tiếp).

---

## BƯỚC 1 — Scan kết quả

| Điểm KT | Trạng thái | File | Dòng | Mô tả |
|---------|------------|------|------|--------|
| **L1-01** | ⚠️ MISSING | — | — | `AuthController` / `Auth::attempt` / `session()->regenerate()` / `createToken` / revoke token — **không có mã Laravel trong repo**. [`api.md`](../api.md) L41–48 chỉ thấy route public `auth/*`. |
| **L1-01** | ✅ OK (route) | [`api.md`](../api.md) | 42 | `POST /auth/login` có `throttle:5,1`. |
| **L1-02** | ⚠️ MISSING | — | — | FormRequest validation, message chống user enumeration — không có code backend. |
| **L1-02** | ✅ OK (FE) | [`authProvider.tsx`](../src/providers/authProvider.tsx) | — | Lỗi login 401/403/404/419/429 và forgot-password trả message chung (giảm lộ thông tin so với echo thô `message` từ API). |
| **L1-03** | ✅ OK (route) | [`api.md`](../api.md) | 42–47, 51 | Login/forgot/OTP có throttle; nhóm authed dùng `auth:sanctum`. |
| **L1-03** | ⚠️ MISSING | — | — | `config/cors.php`, `SANCTUM_STATEFUL_DOMAINS` — không có trong repo frontend; `.env.example` không khai báo (đúng vì đây là biến backend). |
| **L1-04** | ✅ OK | [`login-form.tsx`](../src/pages/auth/login-form.tsx) | — | Submit: `loading={isBusy}`, cooldown, validation, 401 → `loginInvalidCredentials`. |
| **L1-04** | ✅ OK | [`login-form.tsx`](../src/pages/auth/login-form.tsx) | — | Redirect `dashboard` hoặc `selectTenant` theo tenant. |
| **L1-04** | ✅ OK | [`auth.store.ts`](../src/stores/auth.store.ts) | — | `login(email, password, rememberMe?)` gửi `remember: true` khi bật ([`auth.service.ts`](../src/services/auth.service.ts)). |
| **L1-04** | ✅ OK | [`auth-session.ts`](../src/lib/auth-session.ts) | 3–7, 21–24 | Không gắn Bearer từ `localStorage`; comment phiên **HttpOnly cookie** + session. |
| **L1-05** | ✅ OK | [`axios.ts`](../src/lib/axios.ts) | — | `withCredentials: true`; gửi `X-Tenant-ID` khi có trong storage. |
| **L1-05** | ✅ OK | [`axios.ts`](../src/lib/axios.ts) | — | 401 → `forceLogout` / refresh tùy `VITE_AUTH_REFRESH_ENABLED`. |
| **L1-05** | ✅ OK | [`authProvider.tsx`](../src/providers/authProvider.tsx) | — | `logout` → `useAuthStore.logout()`; `check` / `getIdentity` dùng `setSession`; lỗi session → `clearClientSession`. |
| **L1-05** | ✅ OK | [`authProvider.tsx`](../src/providers/authProvider.tsx) | — | `login` (Refine): `setSession(user)` + redirect `dashboard` / `selectTenant` giống luồng store. |
| **L1-05** | ✅ OK | [`App.tsx`](../src/App.tsx) | — | `Refine` + `Authenticated`; `TenantGuard`; `auth:force-logout` → `clearClientSession`. |
| **L1-05** | ✅ OK | [`auth.store.ts`](../src/stores/auth.store.ts) | — | `selectTenant` / `switchTenant` gọi `queryClient.clear()`. |
| **L2-01** | ⚠️ MISSING | — | — | OTP generation (`random_int`, hash, TTL) — không có backend. |
| **L2-02** | ⚠️ MISSING | — | — | Verify OTP (`hash_equals`, invalidate, rate limit server) — không có backend. |
| **L2-02** | 🔐 SECURITY | [`forgot-password-verify-form.tsx`](../src/pages/auth/forgot-password-verify-form.tsx) | — | `MAX_ATTEMPTS` chỉ **client** — bypass bằng API nếu server không giới hạn; UI có cảnh báo `forgotPasswordOtpServerEnforced`. |
| **L2-03** | ✅ OK (route) | [`api.md`](../api.md) | 45–46 | `forgot-password` throttle 3,1; `check-otp` throttle 10,1. |
| **L2-03** | ⚠️ MISSING | — | — | Queue gửi email — không thấy code. |
| **L2-04** | ✅ OK | [`forgot-password-verify-form.tsx`](../src/pages/auth/forgot-password-verify-form.tsx) | — | `Input.OTP` length 6; resend cooldown; xử lý 429 (`rateLimited`). |
| **L3-01** | ⚠️ MISSING | — | — | OAuth callback server (`state`, Socialite) — không có code. |
| **L3-01** | ⚪ N/A | [`login-form.tsx`](../src/pages/auth/login-form.tsx) | — | Google Identity Services — không phải redirect OAuth cổ điển. |
| **L3-02** | ⚠️ MISSING | — | — | User provisioning / link account — không có backend. |
| **L3-03** | ⚠️ MISSING | — | — | Token sau OAuth — không có controller. |
| **L3-04** | ✅ OK | [`login-form.tsx`](../src/pages/auth/login-form.tsx) | — | Nếu script GIS không tải ~12s → `Alert` `googleSignInLoadSlow`. |
| **L3-04** | ✅ OK | [`login-form.tsx`](../src/pages/auth/login-form.tsx) | — | Credential qua callback JS, không đọc token từ URL. |
| **Tenant** | 🔐 SECURITY | [`auth-session.ts`](../src/lib/auth-session.ts) | 40–46 | `tenant-id` trong **localStorage** — nếu XSS, kết hợp session cookie có thể tăng rủi ro chỉ định sai tenant (phụ thuộc backend enforce). |
| **Đăng ký** | ✅ OK (FE) | [`constants.ts`](../src/utils/constants.ts), [`App.tsx`](../src/App.tsx) | — | `VITE_REGISTER_ENABLED` (mặc định tắt): route/link đăng ký ẩn khi API chưa có trong `api.md`. |

---

## BƯỚC 2 — Rủi ro còn lại (backend / xác minh)

### [Cao] — Giới hạn OTP chỉ đủ khi server enforce
**Điểm kiểm tra:** L2-02  
**File:** [`forgot-password-verify-form.tsx`](../src/pages/auth/forgot-password-verify-form.tsx)  
**Vấn đề:** Khóa sau N lần sai trên UI không thay thế rate limit / lock phía API.  
**Fix:** Backend: đếm attempt, khóa email tạm thời, `hash_equals`, OTP one-time, TTL.

### [Trung bình] — Đăng ký khi bật `VITE_REGISTER_ENABLED`
**File:** [`api.md`](../api.md), [`auth.service.ts`](../src/services/auth.service.ts)  
**Vấn đề:** Nếu bật cờ mà Laravel chưa có `POST /auth/register` → 404.  
**Fix:** Thêm route backend hoặc giữ cờ tắt.

### [Thấp / Dev] — Credential demo trong `.env.example`
**File:** [`.env.example`](../.env.example)  
**Trạng thái:** Mặc định tắt `AUTO_LOGIN` / `TEST_ACCOUNTS`; demo trong comment. Vẫn cần kỷ luật không commit secret thật.

**Đã xử lý trước đó (không còn mở):** logout Refine vs store; `rememberMe`; `clearClientSession`; OTP 429; stub `notifications` trong [`resourceAliases.ts`](../src/constants/resourceAliases.ts) (đã bỏ khỏi `NOT_IMPLEMENTED_RESOURCES` để gọi API theo `api.md`).

---

## BƯỚC 3 — ⚠️ MISSING cần bổ sung

1. Export GitNexus / repo Laravel: `AuthController`, FormRequest login/forgot/OTP, model User, service OTP, `config/sanctum.php`, `config/cors.php`.  
2. Đối chiếu response login: có trả `password` / hash / internal fields không.  
3. Xác nhận `session()->regenerate()` sau login và revoke PAT khi logout (nếu dùng token API).  
4. Backend enforce OTP attempts + TTL + one-time use.  
5. OAuth (nếu dùng full redirect): `state`, PKCE, xử lý `error` từ provider.  
6. Route `register` nếu mở `VITE_REGISTER_ENABLED` trong production.

**Thứ tự ưu tiên:** (1) backend OTP + session security, (2) CORS/Sanctum stateful domains, (3) register API nếu cần UI đăng ký.

---

## BƯỚC 4 — Checklist tổng kết

| Luồng | Tổng điểm KT (ước lượng) | ✅ OK | 🔴 Bug | 🔐 Security | ⚠️ Missing |
|-------|--------------------------|------|--------|------------|------------|
| L1 Email + Sanctum | ~22 | ~18 | 0* | 1 | 6+ |
| L2 OTP | ~12 | ~7 | 0 | 1 | 6 |
| L3 OAuth | ~10 | ~3 | 0 | 0 | 7 |

\*Bug frontend đã liệt kê trước đó (remember, logout Refine) đã được sửa trong mã; vẫn thiếu chứng cứ backend.

**Kết luận:** Với **chỉ frontend + `api.md`**, chưa đủ để kết luận “an toàn production” — cần Laravel. Phía frontend: đã **đồng bộ logout/session**, **remember**, **giảm enumeration ở authProvider**, **GIS timeout**, **OTP copy + 429**, **đăng ký có cờ**.

---

## Follow-up đã implement (frontend)

- **`clearClientSession`:** [`auth.store.ts`](../src/stores/auth.store.ts) — dùng trong `logout`, fail `checkAuth`, [`authProvider`](../src/providers/authProvider.tsx), [`App.tsx`](../src/App.tsx) `auth:force-logout`.
- **`remember`:** body login khi “Ghi nhớ” bật — [`auth.service.ts`](../src/services/auth.service.ts).
- **Đăng ký:** `VITE_REGISTER_ENABLED` — [`constants.ts`](../src/utils/constants.ts), [`App.tsx`](../src/App.tsx), [`login-form.tsx`](../src/pages/auth/login-form.tsx).
- **OTP 429 + server hint:** [`forgot-password-verify-form.tsx`](../src/pages/auth/forgot-password-verify-form.tsx); locale `forgotPasswordOtpServerEnforced`.
- **`authProvider`:** `setSession` sau login/check/`getIdentity`; redirect tenant; login/forgot/register message an toàn hơn (generic khi không phải 422).
- **GIS:** timeout ~12s + [`login-form.tsx`](../src/pages/auth/login-form.tsx) `googleSignInLoadSlow`.
- **`NOT_IMPLEMENTED_RESOURCES`:** bỏ `notifications` — [`resourceAliases.ts`](../src/constants/resourceAliases.ts).
- **`.env.example`:** mặc định tắt auto-login / test accounts; demo trong comment.

---

## Ghi chú multi-tenant (Company Ship)

- [`auth.store.ts`](../src/stores/auth.store.ts) `resolveTenantAfterAuth` + header `X-Tenant-ID` ([`axios.ts`](../src/lib/axios.ts)): **bắt buộc** backend `tenant.context` từ chối truy cập chéo tenant dù client sửa header.
