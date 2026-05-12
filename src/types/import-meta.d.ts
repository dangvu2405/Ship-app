interface ImportMetaEnv {
  readonly DEV?: boolean;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_ORIGIN?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_AUTH_FORGOT_PASSWORD_SEND_ENABLED?: string;
  readonly VITE_AUTH_FORGOT_PASSWORD_VERIFY_ENABLED?: string;
  readonly VITE_AUTH_FORGOT_PASSWORD_PATH?: string;
  readonly VITE_AUTH_FORGOT_PASSWORD_VERIFY_PATH?: string;
  readonly VITE_AUTH_REFRESH_ENABLED?: string;
  readonly VITE_AUTO_LOGIN?: string;
  readonly VITE_DEMO_EMAIL?: string;
  readonly VITE_DEMO_PASSWORD?: string;
  readonly VITE_TEST_ACCOUNTS?: string;
  readonly VITE_GOOGLE_OAUTH_CLIENT_ID?: string;
  readonly VITE_VPIC_BASE_URL?: string;
  [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
