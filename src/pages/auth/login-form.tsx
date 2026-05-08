import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Button, Card, Divider, Flex, Form, Input, Switch, Typography, theme } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { GOOGLE_OAUTH_CLIENT_ID } from '@/utils/constants';
import { getErrorStatus, getValidationErrors, isValidationError } from '@/utils/errorHandler';

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

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

let gsiInitialized = false;

export function LoginForm({ className, ...props }: ComponentProps<'div'>) {
  const navigate = useNavigate();
  const [form] = Form.useForm<LoginFormValues>();
  const { login, socialLogin } = useAuthStore();
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);

  const isBusy = isSubmitting || isSocialSubmitting;

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleCbRef = useRef<(r: GoogleCredentialResponse) => void>();
  const lastSubmitAt = useRef(0);
  const SUBMIT_COOLDOWN_MS = 1200;

  const navigateAfterLogin = () => {
    const { currentTenantId } = useAuthStore.getState();
    navigate(currentTenantId ? ROUTES.dashboard : ROUTES.selectTenant);
  };

  googleCbRef.current = (response) => {
    void (async () => {
      try {
        setIsSocialSubmitting(true);
        await socialLogin({ provider: 'google', id_token: response.credential });
        navigateAfterLogin();
      } catch {
        toast.error(t('auth.loginFailed'));
      } finally {
        setIsSocialSubmitting(false);
      }
    })();
  };

  useEffect(() => {
    if (!GOOGLE_OAUTH_CLIENT_ID) return;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost && import.meta.env.VITE_ENABLE_GOOGLE_LOGIN !== 'true') {
      return;
    }
    const stableCallback = (r: GoogleCredentialResponse) => googleCbRef.current?.(r);
    const tryRender = (): boolean => {
      const el = googleBtnRef.current;
      if (!el || !window.google?.accounts?.id) return false;
      if (!gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_OAUTH_CLIENT_ID,
          callback: stableCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        gsiInitialized = true;
      }
      el.innerHTML = '';
      window.google.accounts.id.renderButton(el, {
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        logo_alignment: 'left',
        width: el.offsetWidth || 360,
      });
      return true;
    };
    if (tryRender()) return undefined;
    const timer = window.setInterval(() => {
      if (tryRender()) window.clearInterval(timer);
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  const onFinish = async (values: LoginFormValues) => {
    if (isBusy) return;
    const now = Date.now();
    if (now - lastSubmitAt.current < SUBMIT_COOLDOWN_MS) return;
    lastSubmitAt.current = now;

    try {
      setIsSubmitting(true);
      await login(values.email.trim(), values.password, values.rememberMe ?? false);
      navigateAfterLogin();
    } catch (err) {
      if (isValidationError(err)) {
        const ve = getValidationErrors(err);
        const fields = Object.entries(ve).map(([name, msg]) => ({
          name: name as keyof LoginFormValues,
          errors: [msg],
        }));
        if (fields.length) {
          form.setFields(fields);
          return;
        }
      }
      const status = getErrorStatus(err);
      if (status === 401) {
        toast.error(t('auth.loginInvalidCredentials'));
        return;
      }
      toast.error(t('auth.loginFailed'));
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
            <img src="login-hero.jpeg" alt={t('auth.heroImageAlt')} className="auth-screen__hero-image" />
          </div>

          <div className="auth-screen__panel">
            <div className="auth-screen__content">
              <div className="auth-screen__brand">
                <img src="icon.jpeg" className="auth-screen__brand-mark" alt="Ship ERP" />
                <span className="auth-screen__brand-text">Ship ERP</span>
              </div>

              <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish} style={{ marginBottom: 0 }}>
                <Flex vertical gap={24}>
                  <Typography.Title
                    level={4}
                    style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#1a1a1a', lineHeight: '28px' }}
                  >
                    {t('auth.welcomeBack')}
                  </Typography.Title>

                  <Flex vertical gap={20}>
                    <Flex vertical gap={16}>
                      <Form.Item
                        name="email"
                        label={<span style={labelStyle}>{t('auth.email')}</span>}
                        rules={[
                          { required: true, message: t('validation.required', { field: t('auth.email') }) },
                          { type: 'email', message: t('validation.email') },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          id="email"
                          type="email"
                          size="large"
                          style={inputStyle}
                          placeholder={t('auth.emailPlaceholder')}
                          autoComplete="email"
                        />
                      </Form.Item>

                      <Form.Item
                        name="password"
                        label={<span style={labelStyle}>{t('auth.password')}</span>}
                        rules={[{ required: true, message: t('validation.required', { field: t('auth.password') }) }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input.Password
                          id="password"
                          size="large"
                          style={inputStyle}
                          placeholder={t('auth.registerPasswordPlaceholder')}
                          autoComplete="current-password"
                        />
                      </Form.Item>
                    </Flex>

                    <Flex justify="space-between" align="center">
                      <Form.Item name="rememberMe" valuePropName="checked" noStyle initialValue={false}>
                        <Flex gap={8} align="center">
                          <Switch size="small" />
                          <span style={{ fontSize: 12, color: '#1a1a1a', letterSpacing: '0.3px' }}>
                            {t('auth.rememberMe')}
                          </span>
                        </Flex>
                      </Form.Item>
                      <Link to={ROUTES.forgotPassword} style={{ fontSize: 12, color: '#007aff', letterSpacing: '0.3px' }}>
                        {t('auth.forgotPassword')}
                      </Link>
                    </Flex>
                  </Flex>

                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={isBusy}
                    style={{ height: 40, borderRadius: 6, fontSize: 15, fontWeight: 700 }}
                  >
                    {t('auth.login')}
                  </Button>

                  <Divider style={{ margin: 0, borderColor: '#e5e5e5' }} />

                  <Flex vertical gap={8} align="stretch">
                    <Typography.Text type="secondary" style={{ textAlign: 'center', fontSize: 12 }}>
                      {t('auth.orContinueWith')}
                    </Typography.Text>
                    <div ref={googleBtnRef} className="w-full" style={{ minHeight: 40 }} />
                  </Flex>

                  <div className="auth-screen__switch-auth">
                    {t('auth.dontHaveAccount')}{' '}
                    <Link to={ROUTES.register} className="auth-screen__link">
                      {t('auth.signUp')}
                    </Link>
                  </div>
                </Flex>
              </Form>
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
