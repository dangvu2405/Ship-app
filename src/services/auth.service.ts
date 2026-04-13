import api from './api';
import { ApiResponse, User } from '@/types';
import { ENDPOINTS } from './endpoints';
import { AUTH_FORGOT_PASSWORD } from '@/utils/constants';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
}

class AuthService {
  isForgotPasswordSendEnabled(): boolean {
    return AUTH_FORGOT_PASSWORD.sendEnabled;
  }

  isForgotPasswordResetEnabled(): boolean {
    return AUTH_FORGOT_PASSWORD.verifyEnabled;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token?: string }>> {
    const response = await api.post(ENDPOINTS.auth.login, credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<ApiResponse<User>> {
    const response = await api.post(ENDPOINTS.auth.register, data);
    return response.data;
  }

  async logout(): Promise<void> {
    await api.post(ENDPOINTS.auth.logout);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
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
