import { useState, type ComponentProps } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, Col, Flex, Input, Row, Space, Typography, theme } from 'antd';
import { cn } from '@/lib/utils';
import authService from '@/services/auth.service';
import { ROUTES } from '@/routes';
import { notifyErrorOnce } from '@/utils/errorToast';
import { useTranslation } from '@/hooks/useTranslation';

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

  const handleUnavailableAction = () => {
    toast(t('auth.featureUnavailable'), { icon: 'ℹ️' });
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
      className={cn('min-h-screen flex items-center justify-center p-4', className)}
      style={{ background: token.colorFillAlter }}
      {...props}
    >
      <div style={{ width: '100%', maxWidth: 896 }}>
        <Card styles={{ body: { padding: 0 } }} style={{ overflow: 'hidden', boxShadow: token.boxShadowSecondary }}>
          <Row gutter={0}>
            <Col xs={24} md={12}>
              <form onSubmit={handleSubmit} style={{ padding: '32px 40px' }}>
                <Flex vertical gap={24} align="center">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: token.borderRadiusLG,
                      background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: token.colorTextLightSolid,
                      fontWeight: 700,
                      fontSize: 20,
                    }}
                  >
                    S
                  </div>
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
            </Col>
            <Col xs={0} md={12}>
              <div
                style={{
                  minHeight: '100%',
                  background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 32,
                  color: token.colorTextLightSolid,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    fontWeight: 700,
                    marginBottom: 24,
                  }}
                >
                  S
                </div>
                <Typography.Title level={2} style={{ color: 'inherit', margin: 0 }}>
                  Ship ERP
                </Typography.Title>
                <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: 280 }}>
                  {t('auth.brandDescription')}
                </Typography.Paragraph>
              </div>
            </Col>
          </Row>
        </Card>
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 12 }}>
          {t('auth.agreeTerms')}{' '}
          <Button type="link" size="small" onClick={handleUnavailableAction} style={{ padding: 0, height: 'auto', fontSize: 12 }}>
            {t('auth.termsOfService')}
          </Button>{' '}
          {t('auth.and')}{' '}
          <Button type="link" size="small" onClick={handleUnavailableAction} style={{ padding: 0, height: 'auto', fontSize: 12 }}>
            {t('auth.privacyPolicy')}
          </Button>
          .
        </Typography.Text>
      </div>
    </div>
  );
}
