import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, Flex, Input, Space, Typography, theme } from 'antd';
import authService from '@/services/auth.service';
import { ROUTES } from '@/routes';
import { notifyErrorOnce } from '@/utils/errorToast';
import { useTranslation } from '@/hooks/useTranslation';

export function RegisterForm() {
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: token.colorFillAlter }}>
      <div style={{ width: '100%', maxWidth: 448 }}>
        <Card style={{ boxShadow: token.boxShadowSecondary }}>
          <form onSubmit={handleSubmit}>
            <Flex vertical gap={16} align="stretch">
              <div style={{ textAlign: 'center' }}>
                <Typography.Title level={2} style={{ marginBottom: 8 }}>
                  {t('auth.registerTitle')}
                </Typography.Title>
                <Typography.Text type="secondary">{t('auth.registerSubtitle')}</Typography.Text>
              </div>

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Typography.Text strong>{t('users.username')}</Typography.Text>
                  <Input
                    id="username"
                    name="username"
                    autoComplete="username"
                    value={form.username}
                    onChange={(e) => updateField('username', e.target.value)}
                    placeholder={t('auth.registerUsernamePlaceholder')}
                    size="large"
                    style={{ marginTop: 8 }}
                    required
                  />
                </div>
                <div>
                  <Typography.Text strong>{t('auth.email')}</Typography.Text>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    size="large"
                    style={{ marginTop: 8 }}
                    required
                  />
                </div>
                <div>
                  <Typography.Text strong>{t('auth.password')}</Typography.Text>
                  <Input.Password
                    id="password"
                    name="new-password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder={t('auth.registerPasswordPlaceholder')}
                    size="large"
                    style={{ marginTop: 8 }}
                    required
                  />
                </div>
                <div>
                  <Typography.Text strong>{t('auth.confirmPassword')}</Typography.Text>
                  <Input.Password
                    id="passwordConfirmation"
                    name="password-confirmation"
                    autoComplete="new-password"
                    value={form.passwordConfirmation}
                    onChange={(e) => updateField('passwordConfirmation', e.target.value)}
                    placeholder={t('auth.registerPasswordConfirmPlaceholder')}
                    size="large"
                    style={{ marginTop: 8 }}
                    required
                  />
                </div>
              </Space>

              <Button type="primary" htmlType="submit" block size="large" loading={isSubmitting}>
                {t('auth.register')}
              </Button>

              <Typography.Text type="secondary" style={{ textAlign: 'center' }}>
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to={ROUTES.login}>{t('auth.login')}</Link>
              </Typography.Text>
            </Flex>
          </form>
        </Card>
      </div>
    </div>
  );
}
