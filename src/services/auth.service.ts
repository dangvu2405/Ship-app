import api from './api';
import { ApiResponse, User } from '@/types';

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
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token?: string }>> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<ApiResponse<User>> {
    const response = await api.post('/auth/register', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await api.get('/user');
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await api.post('/auth/refresh');
    return response.data;
  }
}

export default new AuthService();
