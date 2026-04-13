import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, Flex, Input, Typography, theme } from 'antd';
import { ArrowLeftOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import authService from '@/services/auth.service';
import { ROUTES } from '@/routes';
import { notifyErrorOnce } from '@/utils/errorToast';
import { useTranslation } from '@/hooks/useTranslation';
import { FORGOT_PASSWORD_EMAIL_STORAGE_KEY } from '@/lib/forgot-password-flow';

const OTP_LENGTH = 6;

export function ForgotPasswordVerifyForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const fromState = (location.state as { email?: string } | null)?.email?.trim();
    const fromStorage = sessionStorage.getItem(FORGOT_PASSWORD_EMAIL_STORAGE_KEY)?.trim();
    const resolved = fromState || fromStorage || '';
    if (!resolved) {
      navigate(ROUTES.forgotPassword, { replace: true });
      return;
    }
    setEmail(resolved);
  }, [location.state, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !email) return;
    const trimmed = code.replace(/\s/g, '');
    if (trimmed.length < OTP_LENGTH) {
      toast.error(t('auth.forgotPasswordVerifyCodeIncomplete'));
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await authService.verifyForgotPasswordCode(email, trimmed);
      if (response.success) {
        sessionStorage.removeItem(FORGOT_PASSWORD_EMAIL_STORAGE_KEY);
        toast.success(t('auth.forgotPasswordVerifySuccess'));
        navigate(ROUTES.login, { replace: true });
        return;
      }
      toast.error(response.message || t('auth.forgotPasswordVerifyFailed'));
    } catch (error) {
      notifyErrorOnce('auth-forgot-verify', error, { fallbackMessage: t('auth.forgotPasswordVerifyFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending) return;
    try {
      setIsResending(true);
      const response = await authService.forgotPassword(email);
      if (response.success) {
        toast.success(t('auth.forgotPasswordResendSuccess'));
        return;
      }
      toast.error(response.message || t('auth.forgotPasswordFailed'));
    } catch (error) {
      notifyErrorOnce('auth-forgot-resend', error, { fallbackMessage: t('auth.forgotPasswordFailed') });
    } finally {
      setIsResending(false);
    }
  };

  const goChangeEmail = () => {
    sessionStorage.removeItem(FORGOT_PASSWORD_EMAIL_STORAGE_KEY);
    navigate(ROUTES.forgotPassword, { replace: true });
  };

  if (!email) {
    return null;
  }

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
            <Flex vertical gap={20} align="stretch">
              <div style={{ textAlign: 'center' }}>
                <SafetyCertificateOutlined style={{ fontSize: 40, color: token.colorPrimary }} aria-hidden />
                <Typography.Title level={2} style={{ marginTop: 16, marginBottom: 8 }}>
                  {t('auth.forgotPasswordVerifyTitle')}
                </Typography.Title>
                <Typography.Text type="secondary">{t('auth.forgotPasswordVerifySubtitle')}</Typography.Text>
              </div>

              <div>
                <Typography.Text strong>{t('auth.email')}</Typography.Text>
                <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }} copyable>
                  {email}
                </Typography.Paragraph>
                <Button type="link" size="small" onClick={goChangeEmail} style={{ padding: 0, height: 'auto' }}>
                  {t('auth.forgotPasswordChangeEmail')}
                </Button>
              </div>

              <div>
                <Typography.Text strong>{t('auth.forgotPasswordVerifyCodeLabel')}</Typography.Text>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                  <Input.OTP
                    length={OTP_LENGTH}
                    size="large"
                    value={code}
                    onChange={setCode}
                    disabled={isSubmitting}
                    aria-label={t('auth.forgotPasswordVerifyCodeLabel')}
                  />
                </div>
              </div>

              <Button type="primary" htmlType="submit" block size="large" loading={isSubmitting}>
                {t('auth.forgotPasswordVerifySubmit')}
              </Button>

              <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                <Button type="link" onClick={() => void handleResend()} loading={isResending} disabled={isSubmitting}>
                  {t('auth.forgotPasswordResend')}
                </Button>
                <Link to={ROUTES.login}>
                  <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, height: 'auto' }}>
                    {t('auth.forgotPasswordBackToLogin')}
                  </Button>
                </Link>
              </Flex>
            </Flex>
          </form>
        </Card>
      </div>
    </div>
  );
}
