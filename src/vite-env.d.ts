/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Origin backend (giống APP_URL Laravel, không có path /api).
   * Dev: target Vite proxy `/api`. Prod: ghép `${VITE_API_ORIGIN}/api/v1` (trừ khi có VITE_API_BASE_URL).
   */
  readonly VITE_API_ORIGIN?: string;
  /** @deprecated Dùng VITE_API_ORIGIN */
  readonly VITE_PROXY_TARGET?: string;
  /** URL đầy đủ tới API versioned (kết thúc bằng /api/v1, hoặc /api để FE tự thêm /v1). */
  readonly VITE_API_BASE_URL?: string;
  /** Mặc định `/api/v1` — ghép sau `VITE_API_ORIGIN` ở prod. */
  readonly VITE_API_PREFIX?: string;
  readonly VITE_AUTO_LOGIN?: string;
  readonly VITE_TEST_ACCOUNTS?: string;
  readonly VITE_DEMO_EMAIL?: string;
  readonly VITE_DEMO_PASSWORD?: string;
  readonly VITE_AUTH_FORGOT_PASSWORD_SEND_ENABLED?: string;
  readonly VITE_AUTH_FORGOT_PASSWORD_VERIFY_ENABLED?: string;
  readonly VITE_AUTH_FORGOT_PASSWORD_PATH?: string;
  readonly VITE_AUTH_FORGOT_PASSWORD_VERIFY_PATH?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  /** Origin or same-origin path for NHTSA vPIC (vehicle catalog). */
  readonly VITE_VPIC_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
