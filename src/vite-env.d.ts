/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Origin backend (giống APP_URL Laravel, không có /api).
   * Dev: chỉ dùng làm target Vite proxy `/api`. Prod: ghép `${VITE_API_ORIGIN}/api` (trừ khi có VITE_API_BASE_URL).
   */
  readonly VITE_API_ORIGIN?: string;
  /** @deprecated Dùng VITE_API_ORIGIN */
  readonly VITE_PROXY_TARGET?: string;
  /** URL đầy đủ tới gốc API (kết thúc bằng /api). Chỉ khi cần ghi đè mọi quy tắc. */
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTO_LOGIN?: string;
  readonly VITE_TEST_ACCOUNTS?: string;
  readonly VITE_DEMO_EMAIL?: string;
  readonly VITE_DEMO_PASSWORD?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
