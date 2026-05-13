import api from './api';
import { ApiResponse, User } from '@/types';
import { ENDPOINTS } from './endpoints';
import { AUTH_FORGOT_PASSWORD } from '@/utils/constants';
import type { LoginResponse } from '@/types/api/auth';

export interface LoginCredentials {
  email: string;
  password: string;
  /** Gửi khi backend hỗ trợ (vd. Laravel session lifetime). */
  remember?: boolean;
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
  private normalizeAuthResponse<T extends LoginResponse>(response: ApiResponse<T>): ApiResponse<T> {
    if (!response.data) return response;

    const refreshToken = response.data.refreshToken ?? response.data.refresh_token;
    const token = response.data.token ?? response.data.access_token;

    return {
      ...response,
      data: {
        ...response.data,
        ...(token ? { token, access_token: token } : {}),
        ...(refreshToken ? { refreshToken, refresh_token: refreshToken } : {}),
      },
    };
  }

  /**
   * Lấy CSRF token trước các tác vụ POST nếu chưa tồn tại trong session cookie.
   */
  private async ensureCsrfCookie() {
    if (typeof document !== 'undefined' && document.cookie.includes('XSRF-TOKEN=')) {
      return; // Bỏ qua nếu token đã được thiết lập bởi backend
    }
    try {
      await api.get('/sanctum/csrf-cookie', { useApiRoot: true, withCredentials: true });
    } catch (err) {
      console.warn('[Auth] CSRF fetch failed. Check Sanctum config.', err);
    }
  }

  getUserFromMeResponse(response: ApiResponse<User | { user?: User; tenants?: import('@/types').Tenant[]; permissions?: Record<string, boolean> }>): User | null {
    const payload = response.data;
    if (!payload) return null;
    
    if ('user' in (payload as { user?: User })) {
      const nested = payload as { user?: User; tenants?: import('@/types').Tenant[]; permissions?: Record<string, boolean> };
      if (!nested.user) return null;
      return {
        ...nested.user,
        tenants: nested.tenants ?? nested.user.tenants ?? [],
        user_permissions: nested.permissions ?? nested.user.user_permissions,
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

  async login(
    credentials: LoginCredentials,
  ): Promise<ApiResponse<LoginResponse>> {
    await this.ensureCsrfCookie();

    const response = await api.post<ApiResponse<LoginResponse>>(ENDPOINTS.auth.login, credentials, {
      skipErrorToast: true,
      errorMode: 'silent'
    });
    return this.normalizeAuthResponse(response.data);
  }

  async socialLogin(credentials: SocialLoginCredentials): Promise<ApiResponse<{ user: User }>> {
    await this.ensureCsrfCookie();
    const response = await api.post<ApiResponse<{ user: User }>>(ENDPOINTS.auth.socialLogin, credentials, {
      skipErrorToast: true,
      errorMode: 'silent'
    });
    return response.data;
  }

  async register(data: RegisterData): Promise<ApiResponse<User>> {
    await this.ensureCsrfCookie();
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

  async forgotPassword(email: string): Promise<ApiResponse<unknown>> {
    await this.ensureCsrfCookie();
    const response = await api.post(ENDPOINTS.auth.forgotPassword, { email }, { skipErrorToast: true, errorMode: 'silent' });
    return response.data;
  }

  async checkOtp(payload: { email: string; otp: string }): Promise<ApiResponse<any>> {
    await this.ensureCsrfCookie();
    const response = await api.post(ENDPOINTS.auth.checkOtp, payload, { skipErrorToast: true, errorMode: 'silent' });
    return response.data;
  }

  async resetForgotPassword(payload: any): Promise<ApiResponse<unknown>> {
    await this.ensureCsrfCookie();
    const response = await api.post(ENDPOINTS.auth.forgotPasswordReset, payload, { skipErrorToast: true, errorMode: 'silent' });
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await api.post(ENDPOINTS.auth.refresh);
    return response.data;
  }
}

export default new AuthService();
