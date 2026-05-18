import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Alert, Button, Card, Flex, Input, Steps, Typography, theme } from 'antd';
import { ArrowLeftOutlined, CheckCircleFilled, CloseCircleFilled, SafetyCertificateOutlined } from '@ant-design/icons';
import authService from '@/services/auth.service';
import { ROUTES } from '@/routes';
import { notifyErrorOnce } from '@/utils/errorToast';
import { getErrorStatus } from '@/utils/errorHandler';
import { useTranslation } from '@/hooks/useTranslation';
import { FORGOT_PASSWORD_EMAIL_STORAGE_KEY } from '@/lib/forgot-password-flow';
import { forgotPasswordConfirmSchema } from '@/schemas/password';
import type { ApiResponse } from '@/types';

const extractResetToken = (body: ApiResponse<unknown>): string | null => {
  const payload = body.data;
  if (!payload || typeof payload !== 'object') return null;
  const o = payload as Record<string, unknown>;
  const nested = o.data && typeof o.data === 'object' ? (o.data as Record<string, unknown>) : o;
  const t = nested.otp_token ?? nested.token ?? nested.reset_token ?? nested.password_reset_token;
  return typeof t === 'string' && t.trim() ? t.trim() : null;
};

export function ForgotPasswordVerifyForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<'otp' | 'password'>('otp');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [serverOtpBlocked, setServerOtpBlocked] = useState(false);
  const MAX_ATTEMPTS = 5;
  const resetEnabled = authService.isForgotPasswordResetEnabled();
  const sendEnabled = authService.isForgotPasswordSendEnabled();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);


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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEnabled || isSubmitting || !email) return;
    const code = otp.replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
      toast.error(t('auth.forgotPasswordOtpLength'));
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await authService.checkOtp({ email, otp: code });
      if (!response.success) {
        setAttempts((prev) => prev + 1);
        const remaining = MAX_ATTEMPTS - (attempts + 1);
        if (remaining <= 0) {
          toast.error(t('auth.forgotPasswordTooManyAttempts'));
        } else {
          toast.error(`${response.message || t('auth.forgotPasswordOtpInvalid')} (${remaining} ${t('auth.attemptsLeft')})`);
        }
        return;
      }

      const tok = extractResetToken(response as ApiResponse<unknown>);
      if (!tok) {
        toast.error(t('auth.forgotPasswordOtpInvalid'));
        return;
      }
      setResetToken(tok);
      setPhase('password');
      toast.success(t('auth.forgotPasswordOtpVerified'));
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 429) {
        setServerOtpBlocked(true);
        toast.error(t('auth.rateLimited'));
      } else {
        notifyErrorOnce('auth-check-otp', error, { fallbackMessage: t('auth.forgotPasswordOtpInvalid') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEnabled || isSubmitting || !email || !resetToken) return;
    const parsed = forgotPasswordConfirmSchema.safeParse({
      password,
      password_confirmation: passwordConfirmation,
    });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? t('auth.forgotPasswordResetFailed');
      toast.error(msg);
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await authService.resetForgotPassword({
        email,
        otp_token: resetToken,
        password: parsed.data.password,
        password_confirmation: parsed.data.password_confirmation,
      });
      if (response.success) {
        sessionStorage.removeItem(FORGOT_PASSWORD_EMAIL_STORAGE_KEY);
        toast.success(t('auth.forgotPasswordResetSuccess'));
        window.setTimeout(() => {
          navigate(ROUTES.login, { replace: true });
        }, 3000);
        return;
      }
      toast.error(response.message || t('auth.forgotPasswordResetFailed'));
    } catch (error) {
      notifyErrorOnce('auth-forgot-reset', error, { fallbackMessage: t('auth.forgotPasswordResetFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending) return;
    if (!sendEnabled) {
      toast.error(t('auth.forgotPasswordSendUnavailable'));
      return;
    }
    try {
      setIsResending(true);
      const response = await authService.forgotPassword(email);
      if (response.success) {
        toast.success(t('auth.forgotPasswordResendSuccess'));
        setCountdown(60); // 1 minute cooldown
        return;
      }

      toast.error(response.message || t('auth.forgotPasswordFailed'));
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 429) {
        setServerOtpBlocked(true);
        toast.error(t('auth.rateLimited'));
      } else {
        notifyErrorOnce('auth-forgot-resend', error, { fallbackMessage: t('auth.forgotPasswordFailed') });
      }
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

  const stepIndex = phase === 'otp' ? 1 : 2;

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
      <div style={{ width: '100%', maxWidth: 480 }}>
        <Card style={{ boxShadow: token.boxShadowSecondary }}>
          <Flex vertical gap={20} align="stretch">
            <div style={{ textAlign: 'center' }}>
              <SafetyCertificateOutlined style={{ fontSize: 40, color: token.colorPrimary }} aria-hidden />
              <Typography.Title level={2} style={{ marginTop: 16, marginBottom: 8 }}>
                {t('auth.forgotPasswordVerifyTitle')}
              </Typography.Title>
              <Typography.Text type="secondary">{t('auth.forgotPasswordResetSubtitle')}</Typography.Text>
            </div>

            <Steps
              size="small"
              current={stepIndex}
              items={[
                { title: t('auth.forgotPasswordStepEmail') },
                { title: t('auth.forgotPasswordStepOtp') },
                { title: t('auth.forgotPasswordStepNewPassword') },
              ]}
            />

            <div>
              <Typography.Text strong>{t('auth.email')}</Typography.Text>
              <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }} copyable>
                {email}
              </Typography.Paragraph>
              <Button type="link" size="small" onClick={goChangeEmail} style={{ padding: 0, height: 'auto' }}>
                {t('auth.forgotPasswordChangeEmail')}
              </Button>
            </div>

            {phase === 'otp' ? (
              <form onSubmit={handleVerifyOtp}>
                <Flex vertical gap={16}>
                  <Alert type="info" showIcon message={t('auth.forgotPasswordOtpServerEnforced')} />
                  <div>
                    <Typography.Text strong>{t('auth.forgotPasswordOtpLabel')}</Typography.Text>
                    <Input.OTP
                      length={6}
                      size="large"
                      style={{ marginTop: 8 }}
                      value={otp}
                      onChange={setOtp}
                      disabled={isSubmitting || !resetEnabled}
                    />
                  </div>
                  {!resetEnabled && <Alert type="info" message={t('auth.forgotPasswordResetUnavailable')} showIcon />}
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    size="large" 
                    loading={isSubmitting} 
                    disabled={!resetEnabled || attempts >= MAX_ATTEMPTS || serverOtpBlocked}
                  >
                    {attempts >= MAX_ATTEMPTS || serverOtpBlocked
                      ? t('auth.forgotPasswordLocked')
                      : t('auth.forgotPasswordOtpSubmit')}
                  </Button>

                </Flex>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <Flex vertical gap={16}>
                  <div>
                    <Typography.Text strong>{t('auth.password')}</Typography.Text>
                    <Input.Password
                      size="large"
                      style={{ marginTop: 8 }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting || !resetEnabled}
                      placeholder={t('auth.registerPasswordPlaceholder')}
                      autoComplete="new-password"
                    />
                    {password.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                        {([
                          { label: 'Tối thiểu 8 ký tự', ok: password.length >= 8 },
                          { label: 'Chữ hoa (A-Z)', ok: /[A-Z]/.test(password) },
                          { label: 'Chữ thường (a-z)', ok: /[a-z]/.test(password) },
                          { label: 'Chữ số (0-9)', ok: /[0-9]/.test(password) },
                        ] as const).map(({ label, ok }) => (
                          <Typography.Text key={label} style={{ fontSize: 12, color: ok ? token.colorSuccess : token.colorError }}>
                            {ok
                              ? <CheckCircleFilled style={{ marginRight: 4 }} />
                              : <CloseCircleFilled style={{ marginRight: 4 }} />}
                            {label}
                          </Typography.Text>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Typography.Text strong>{t('auth.confirmPassword')}</Typography.Text>
                    <Input.Password
                      size="large"
                      style={{ marginTop: 8 }}
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      disabled={isSubmitting || !resetEnabled}
                      placeholder={t('auth.registerPasswordConfirmPlaceholder')}
                      autoComplete="new-password"
                    />
                    {passwordConfirmation.length > 0 && password !== passwordConfirmation && (
                      <Typography.Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                        <CloseCircleFilled style={{ marginRight: 4 }} />
                        Mật khẩu nhập lại không khớp
                      </Typography.Text>
                    )}
                  </div>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={isSubmitting}
                    disabled={!resetEnabled}
                  >
                    {t('auth.forgotPasswordResetSubmit')}
                  </Button>
                  <Button type="link" onClick={() => setPhase('otp')} disabled={isSubmitting} style={{ padding: 0 }}>
                    {t('auth.forgotPasswordBackOtp')}
                  </Button>
                </Flex>
              </form>
            )}

            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
              <Button
                type="link"
                onClick={() => void handleResend()}
                loading={isResending}
                disabled={isSubmitting || !sendEnabled || countdown > 0 || serverOtpBlocked}
              >
                {countdown > 0 ? `${t('auth.forgotPasswordResendIn')} ${countdown}s` : t('auth.forgotPasswordResend')}
              </Button>

              <Link to={ROUTES.login}>
                <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, height: 'auto' }}>
                  {t('auth.forgotPasswordBackToLogin')}
                </Button>
              </Link>
            </Flex>
          </Flex>
        </Card>
      </div>
    </div>
  );
}
