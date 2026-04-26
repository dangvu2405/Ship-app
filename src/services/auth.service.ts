import api from './api';
import { ApiResponse, User } from '@/types';
import { ENDPOINTS } from './endpoints';
import { AUTH_FORGOT_PASSWORD } from '@/utils/constants';

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
  getUserFromMeResponse(response: ApiResponse<User | { user?: User; tenants?: import('@/types').Tenant[] }>): User | null {
    const payload = response.data;
    if (!payload) return null;
    if ('user' in (payload as { user?: User })) {
      const nested = payload as { user?: User; tenants?: import('@/types').Tenant[] };
      if (!nested.user) return null;
      return { ...nested.user, tenants: nested.tenants ?? nested.user.tenants ?? [] };
    }
    return payload as User;
  }

  isForgotPasswordSendEnabled(): boolean {
    return AUTH_FORGOT_PASSWORD.sendEnabled;
  }

  isForgotPasswordResetEnabled(): boolean {
    return AUTH_FORGOT_PASSWORD.verifyEnabled;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{
    user: User;
    tenants?: import('@/types').Tenant[];
    token?: string;
    access_token?: string;
    refresh_token?: string;
  }>> {
    const response = await api.post(ENDPOINTS.auth.login, credentials, { skipErrorToast: true, errorMode: 'silent' });
    return response.data;
  }

  async socialLogin(credentials: SocialLoginCredentials): Promise<ApiResponse<{
    user: User;
    tenants?: import('@/types').Tenant[];
    token?: string;
    access_token?: string;
    refresh_token?: string;
  }>> {
    const response = await api.post(ENDPOINTS.auth.socialLogin, credentials, { skipErrorToast: true, errorMode: 'silent' });
    return response.data;
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
