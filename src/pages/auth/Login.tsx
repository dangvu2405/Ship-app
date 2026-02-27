import { useState, useEffect, useCallback } from 'react';
import { useLogin } from '@refinedev/core';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getValidationErrors, isValidationError } from '@/utils/errorHandler';
import { DEMO_EMAIL, DEMO_PASSWORD, AUTO_LOGIN_ENABLED } from '@/utils/constants';
import { useTranslation } from '@/hooks/useTranslation';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Zap from 'lucide-react/dist/esm/icons/zap';
import { cn } from '@/lib/utils';

export const Login = () => {
  const { mutate: login, isLoading } = useLogin();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  const handleSkipLogin = useCallback(() => {
    setErrors({});
    login(
      { email: DEMO_EMAIL, password: DEMO_PASSWORD },
      {
        onSuccess: () => {},
        onError: (error: unknown) => {
          if (isValidationError(error)) {
            setErrors(getValidationErrors(error));
          }
        },
      }
    );
  }, [login]);

  useEffect(() => {
    if (AUTO_LOGIN_ENABLED && !autoLoginAttempted && !isLoading) {
      setAutoLoginAttempted(true);
      handleSkipLogin();
    }
  }, [autoLoginAttempted, isLoading, handleSkipLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    login(
      { email: formData.email, password: formData.password },
      {
        onSuccess: () => {},
        onError: (error: unknown) => {
          if (isValidationError(error)) {
            setErrors(getValidationErrors(error));
          }
        },
      }
    );
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="text-xl font-bold text-foreground">Ship ERP</span>
        </div>

        <Card className="border-0 shadow-sku-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl">{t('auth.login')}</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            {/* Quick Login */}
            <Button
              type="button"
              variant="outline"
              onClick={handleSkipLogin}
              disabled={isLoading}
              className="w-full h-11"
            >
              <Zap className="mr-2 h-4 w-4 text-amber-500" />
              {t('auth.skipLogin')}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('auth.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={cn(errors.email && "border-destructive focus:border-destructive")}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive font-medium">{errors.email}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t('auth.password')}
                  </Label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {t('auth.forgotPassword')}
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className={cn(errors.password && "border-destructive focus:border-destructive")}
                />
                {errors.password ? (
                  <p className="text-xs text-destructive font-medium">{errors.password}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer text-muted-foreground">
                  {t('auth.rememberMe')}
                </Label>
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  t('auth.login')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
};
