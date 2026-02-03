import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input } from '@/components/form/Input';
import { Button } from '@/components/form/Button';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/utils/constants';
import toast from 'react-hot-toast';

export const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      await login(formData.email, formData.password);
      navigate(ROUTES.DASHBOARD);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
        if (axiosError.response?.data?.errors) {
          const formattedErrors: Record<string, string> = {};
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            formattedErrors[key] = Array.isArray(value) ? value[0] : value;
          });
          setErrors(formattedErrors);
        } else {
          toast.error(axiosError.response?.data?.message || 'Login failed');
        }
      } else {
        toast.error('Login failed');
      }
    }
  };

  return (
    <AuthLayout>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <Button type="submit" className="w-full" loading={isLoading}>
            Sign in
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
