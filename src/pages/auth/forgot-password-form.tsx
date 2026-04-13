import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, Flex, Input, Space, Typography, theme } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import authService from '@/services/auth.service';
import { ROUTES } from '@/routes';
import { notifyErrorOnce } from '@/utils/errorToast';
import { useTranslation } from '@/hooks/useTranslation';
import { FORGOT_PASSWORD_EMAIL_STORAGE_KEY } from '@/lib/forgot-password-flow';

export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error(t('validation.required', { field: t('auth.email') }));
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await authService.forgotPassword(trimmed);
      if (response.success) {
        sessionStorage.setItem(FORGOT_PASSWORD_EMAIL_STORAGE_KEY, trimmed);
        toast.success(t('auth.forgotPasswordSuccessToast'));
        navigate(ROUTES.forgotPasswordVerify, { replace: true, state: { email: trimmed } });
        return;
      }
      toast.error(response.message || t('auth.forgotPasswordFailed'));
    } catch (error) {
      notifyErrorOnce('auth-forgot-password', error, { fallbackMessage: t('auth.forgotPasswordFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: token.colorFillAlter,
      }}
    >
      <div style={{ width: '100%', maxWidth: 448 }}>
        <Card style={{ boxShadow: token.boxShadowSecondary }}>
          <form onSubmit={handleSubmit}>
            <Flex vertical gap={16} align="stretch">
              <div style={{ textAlign: 'center' }}>
                <Typography.Title level={2} style={{ marginBottom: 8 }}>
                  {t('auth.forgotPasswordTitle')}
                </Typography.Title>
                <Typography.Text type="secondary">{t('auth.forgotPasswordSubtitle')}</Typography.Text>
              </div>

              <div>
                <Typography.Text strong>{t('auth.email')}</Typography.Text>
                <Input
                  id="forgot-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  size="large"
                  style={{ marginTop: 8 }}
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="primary" htmlType="submit" block size="large" loading={isSubmitting}>
                {t('auth.forgotPasswordSubmit')}
              </Button>

              <Space style={{ width: '100%', justifyContent: 'center' }}>
                <Link to={ROUTES.login}>
                  <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, height: 'auto' }}>
                    {t('auth.forgotPasswordBackToLogin')}
                  </Button>
                </Link>
              </Space>
            </Flex>
          </form>
        </Card>
      </div>
    </div>
  );
}
