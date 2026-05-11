import api from './api';
import { ApiResponse, User } from '@/types';
import { ENDPOINTS } from './endpoints';
import { AUTH_FORGOT_PASSWORD } from '@/utils/constants';
import type { LoginResponse, MeResponse } from '@/types/api/auth';

type AuthSessionPayload = LoginResponse & { refreshToken?: string };
type AuthMePayload = MeResponse | { user?: User; tenants?: import('@/types').Tenant[]; user_permissions?: User['user_permissions']; permissions?: Record<string, boolean> };

const normalizeAuthSession = (data: AuthSessionPayload): AuthSessionPayload & { refresh_token: string } => {
  const token = data.refresh_token ?? data.refreshToken;
  if (!token) {
    console.warn('[Auth] Backend response missing refresh_token in both snake_case and camelCase', {
      keys: Object.keys(data),
      hasRefreshToken: 'refresh_token' in data,
      hasRefreshTokenCamel: 'refreshToken' in data,
    });
  }
  if (data.refreshToken && !data.refresh_token) {
    console.info('[Auth] Backend using camelCase refreshToken instead of snake_case (standardization needed)');
  }
  return {
    ...data,
    refresh_token: token ?? '',
  };
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SocialLoginCredentials {
  provider: 'google' | 'facebook' | 'apple';
  access_token?: string;
  id_token?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
}

class AuthService {
  getUserFromMeResponse(response: ApiResponse<User | AuthMePayload>): User | null {
    const payload = response.data;
    if (!payload) return null;
    if ('user' in (payload as { user?: User })) {
      const nested = payload as { user?: User; tenants?: import('@/types').Tenant[]; user_permissions?: User['user_permissions']; permissions?: Record<string, boolean> };
      if (!nested.user) return null;
      return {
        ...nested.user,
        tenants: nested.tenants ?? nested.user.tenants ?? [],
        user_permissions: nested.user_permissions ?? nested.permissions ?? nested.user.user_permissions,
      };
    }
    return payload as User;
  }

  isForgotPasswordSendEnabled(): boolean {
    return AUTH_FORGOT_PASSWORD.sendEnabled;
  }

  isForgotPasswordResetEnabled(): boolean {
    return AUTH_FORGOT_PASSWORD.verifyEnabled;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthSessionPayload & { refresh_token?: string }>> {
    const response = await api.post<ApiResponse<AuthSessionPayload>>(ENDPOINTS.auth.login, credentials, { skipErrorToast: true, errorMode: 'silent' });
    const body = response.data;
    if (!body.data) return body as ApiResponse<AuthSessionPayload & { refresh_token?: string }>;
    return {
      ...body,
      data: normalizeAuthSession(body.data),
    } as ApiResponse<AuthSessionPayload & { refresh_token?: string }>;
  }

  async socialLogin(credentials: SocialLoginCredentials): Promise<ApiResponse<AuthSessionPayload & { refresh_token?: string }>> {
    const response = await api.post<ApiResponse<AuthSessionPayload>>(ENDPOINTS.auth.socialLogin, credentials, { skipErrorToast: true, errorMode: 'silent' });
    const body = response.data;
    if (!body.data) return body as ApiResponse<AuthSessionPayload & { refresh_token?: string }>;
    return {
      ...body,
      data: normalizeAuthSession(body.data),
    } as ApiResponse<AuthSessionPayload & { refresh_token?: string }>;
  }

  async register(data: RegisterData): Promise<ApiResponse<User>> {
    const response = await api.post(ENDPOINTS.auth.register, data);
    return response.data;
  }

  async logout(): Promise<void> {
    await api.post(ENDPOINTS.auth.logout);
  }

  async getCurrentUser(): Promise<ApiResponse<User | { user?: User }>> {
    const response = await api.get(ENDPOINTS.auth.me);
    return response.data;
  }

  /** Gửi email đặt lại mật khẩu (body `{ email }` — tùy backend). */
  async forgotPassword(email: string): Promise<ApiResponse<unknown>> {
    const response = await api.post(ENDPOINTS.auth.forgotPassword, { email }, { skipErrorToast: true, errorMode: 'silent' });
    return response.data;
  }

  async checkOtp(payload: { email: string; otp: string }): Promise<
    ApiResponse<{ token?: string; reset_token?: string } | Record<string, unknown>>
  > {
    const response = await api.post(ENDPOINTS.auth.checkOtp, payload, { skipErrorToast: true, errorMode: 'silent' });
    return response.data;
  }

  async resetForgotPassword(payload: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Promise<ApiResponse<unknown>> {
    const response = await api.post(
      ENDPOINTS.auth.forgotPasswordReset,
      payload,
      { skipErrorToast: true, errorMode: 'silent' },
    );
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await api.post(ENDPOINTS.auth.refresh);
    return response.data;
  }
}

export default new AuthService();
