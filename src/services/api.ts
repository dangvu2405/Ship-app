import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/utils/constants';
import toast from 'react-hot-toast';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // For HttpOnly cookies
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token will be sent via HttpOnly cookie from backend
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      } else if (status === 403) {
        toast.error(data.message || 'Access denied');
      } else if (status === 422) {
        // Validation errors
        const errors = data.errors || {};
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          toast.error(firstError[0] as string);
        } else {
          toast.error(data.message || 'Validation failed');
        }
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default api;
