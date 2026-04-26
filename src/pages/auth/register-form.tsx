import { useState, type ComponentProps } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, Divider, Flex, Input, Typography, theme } from 'antd';
import { cn } from '@/lib/utils';
import authService from '@/services/auth.service';
import { ROUTES } from '@/routes';
import { notifyErrorOnce } from '@/utils/errorToast';
import { useTranslation } from '@/hooks/useTranslation';

const heroImage = 'https://www.figma.com/api/mcp/asset/4629245c-f613-41b7-a0ba-5f5a9aac02a8';

const inputStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 6,
  background: '#f2f2f2',
  borderColor: '#e5e5e5',
  borderWidth: 0.5,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#333333',
  letterSpacing: '0.3px',
};

export function RegisterForm({ className, ...props }: ComponentProps<'div'>) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (form.password !== form.passwordConfirmation) {
      toast.error(t('auth.registerPasswordMismatch'));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authService.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.passwordConfirmation,
      });

      if (response.success) {
        toast.success(t('auth.registerSuccess'));
        navigate(ROUTES.login);
        return;
      }

      toast.error(response.message || t('auth.registerFailed'));
    } catch (error) {
      notifyErrorOnce('auth-register', error, { fallbackMessage: t('auth.registerFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn('auth-screen', className)}
      style={{ background: token.colorFillAlter }}
      {...props}
    >
      <Card
        className="auth-screen__card"
        variant="borderless"
        styles={{ body: { padding: 0 } }}
        style={{ boxShadow: token.boxShadowSecondary }}
      >
        <div className="auth-screen__layout">
          <div className="auth-screen__hero">
            <img src={heroImage} alt="" className="auth-screen__hero-image" />
          </div>

          <div className="auth-screen__panel">
            <div className="auth-screen__content">

              {/* Brand */}
              <div className="auth-screen__brand">
                <div className="auth-screen__brand-mark" />
                <span className="auth-screen__brand-text">Ship ERP</span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <Flex vertical gap={24}>
                  {/* Title */}
                  <Typography.Title
                    level={4}
                    style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#1a1a1a', lineHeight: '28px' }}
                  >
                    {t('auth.registerTitle')}
                  </Typography.Title>

                  {/* Fields */}
                  <Flex vertical gap={16}>
                    <Flex vertical gap={8}>
                      <span style={labelStyle}>{t('users.username')}</span>
                      <Input
                        id="username"
                        name="username"
                        autoComplete="username"
                        size="large"
                        style={inputStyle}
                        placeholder={t('auth.registerUsernamePlaceholder')}
                        value={form.username}
                        onChange={(e) => updateField('username', e.target.value)}
                        required
                      />
                    </Flex>

                    <Flex vertical gap={8}>
                      <span style={labelStyle}>{t('auth.email')}</span>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        size="large"
                        style={inputStyle}
                        placeholder={t('auth.emailPlaceholder')}
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        required
                      />
                    </Flex>

                    <Flex vertical gap={8}>
                      <span style={labelStyle}>{t('auth.password')}</span>
                      <Input.Password
                        id="password"
                        name="new-password"
                        autoComplete="new-password"
                        size="large"
                        style={inputStyle}
                        placeholder={t('auth.registerPasswordPlaceholder')}
                        value={form.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        required
                      />
                    </Flex>

                    <Flex vertical gap={8}>
                      <span style={labelStyle}>{t('auth.confirmPassword')}</span>
                      <Input.Password
                        id="passwordConfirmation"
                        name="password-confirmation"
                        autoComplete="new-password"
                        size="large"
                        style={inputStyle}
                        placeholder={t('auth.registerPasswordConfirmPlaceholder')}
                        value={form.passwordConfirmation}
                        onChange={(e) => updateField('passwordConfirmation', e.target.value)}
                        required
                      />
                    </Flex>
                  </Flex>

                  {/* Register button */}
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={isSubmitting}
                    style={{ height: 40, borderRadius: 6, fontSize: 15, fontWeight: 700 }}
                  >
                    {t('auth.register')}
                  </Button>

                  {/* Divider */}
                  <Divider style={{ margin: 0, borderColor: '#e5e5e5' }} />

                  {/* Switch to login */}
                  <div className="auth-screen__switch-auth">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <Link to={ROUTES.login} className="auth-screen__link">
                      {t('auth.login')}
                    </Link>
                  </div>
                </Flex>
              </form>
            </div>

            <Flex justify="space-between" align="center" className="auth-screen__footer">
              <span>{t('auth.agreeTerms')}</span>
              <span>© Ship ERP 2026</span>
            </Flex>
          </div>
        </div>
      </Card>
    </div>
  );
}
