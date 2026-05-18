import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { Alert, Button, Card, Divider, Flex, Form, Input, Switch, Typography, theme } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { GOOGLE_OAUTH_CLIENT_ID, REGISTER_ENABLED } from '@/utils/constants';
import { getErrorStatus, getValidationErrors, isValidationError } from '@/utils/errorHandler';
import { antdUtils } from '@/utils/antdGlobal';

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
  const [googleUnavailable, setGoogleUnavailable] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const isBusy = isSubmitting || isSocialSubmitting;

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleCbRef = useRef<(r: any) => void>();
  const lastSubmitAt = useRef(0);
  const SUBMIT_COOLDOWN_MS = 1200;

  const navigateAfterLogin = () => {
    const { currentTenantId, pendingTenants } = useAuthStore.getState();
    if (currentTenantId) {
      navigate(ROUTES.dashboard);
    } else if ((pendingTenants ?? []).length > 0) {
      navigate(ROUTES.selectTenant);
    } else {
      navigate(ROUTES.dashboard);
    }
  };

  googleCbRef.current = (response: any) => {
    void (async () => {
      try {
        setIsSocialSubmitting(true);
        await socialLogin({ provider: 'google', id_token: response.credential });
        navigateAfterLogin();
      } catch {
        antdUtils.getMessage().error(t('auth.loginFailed'));
      } finally {
        setIsSocialSubmitting(false);
      }
    })();
  };

  useEffect(() => {
    if (!GOOGLE_OAUTH_CLIENT_ID) return;
    const stableCallback = (r: any) => googleCbRef.current?.(r);
    const tryRender = (): boolean => {
      const el = googleBtnRef.current;
      if (!el || !(window as any).google?.accounts?.id) return false;
      if (!gsiInitialized) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_OAUTH_CLIENT_ID,
          callback: stableCallback,
          auto_select: false,
        });
        gsiInitialized = true;
      }
      el.innerHTML = '';
      (window as any).google.accounts.id.renderButton(el, {
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        width: el.offsetWidth || 360,
      });
      return true;
    };
    if (tryRender()) return undefined;
    const loadTimer = window.setTimeout(() => setGoogleUnavailable(true), 12000);
    const timer = window.setInterval(() => {
      if (tryRender()) {
        window.clearInterval(timer);
        window.clearTimeout(loadTimer);
        setGoogleUnavailable(false);
      }
    }, 100);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(loadTimer);
    };
  }, []);

  const onFinish = async (values: LoginFormValues) => {
    if (isBusy) return;
    const now = Date.now();
    if (now - lastSubmitAt.current < SUBMIT_COOLDOWN_MS) return;
    lastSubmitAt.current = now;

    try {
      setLoginError(null);
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
        const message = t('auth.loginInvalidCredentials');
        setLoginError(message);
        antdUtils.getMessage().error(message);
        return;
      }
      const message = t('auth.loginFailed');
      setLoginError(message);
      antdUtils.getMessage().error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn('auth-screen', className)}
      style={{ 
        background: `linear-gradient(135deg, ${token.colorFillAlter} 0%, ${token.colorFillSecondary} 100%)`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
      {...props}
    >
      <Card
        variant="borderless"
        styles={{ body: { padding: 0 } }}
        style={{ 
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          maxWidth: 960,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 24,
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <div style={{ display: 'flex', minHeight: 600 }}>
          <div style={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
            color: '#fff',
            padding: 48,
            position: 'relative',
            overflow: 'hidden'
          }}>
             <div style={{ position: 'relative', zIndex: 1 }}>
                <Typography.Title level={1} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Ship ERP</Typography.Title>
                <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, marginTop: 16 }}>
                  Hệ thống quản trị vận tải thông minh, tối ưu hóa mọi hành trình.
                </Typography.Paragraph>
             </div>
             <div style={{ 
                position: 'absolute', 
                bottom: -50, 
                right: -50, 
                width: 300, 
                height: 300, 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '50%',
                zIndex: 0
             }} />
          </div>

          <div style={{ flex: 1, padding: 48, background: '#fff' }}>
            <Flex vertical gap={32}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  background: token.colorPrimary, 
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800
                }}>S</div>
                <Typography.Text strong style={{ fontSize: 18 }}>Ship ERP</Typography.Text>
              </div>

              <div>
                <Typography.Title level={3} style={{ margin: 0, fontWeight: 700 }}>{t('auth.welcomeBack')}</Typography.Title>
                <Typography.Text type="secondary">{t('auth.loginSubtitle') || 'Đăng nhập để tiếp tục quản lý đội xe của bạn.'}</Typography.Text>
              </div>

              {loginError ? <Alert type="error" showIcon message={loginError} /> : null}

              <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
                <Form.Item
                  name="email"
                  label={t('auth.email')}
                  rules={[
                    { required: true, message: t('validation.required', { field: t('auth.email') }) },
                    { type: 'email', message: t('validation.email') },
                  ]}
                >
                  <Input 
                    size="large" 
                    placeholder="admin@example.com" 
                    style={{ borderRadius: 12 }} 
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={t('auth.password')}
                  rules={[{ required: true, message: t('validation.required', { field: t('auth.password') }) }]}
                >
                  <Input.Password 
                    size="large" 
                    placeholder="••••••••" 
                    style={{ borderRadius: 12 }} 
                  />
                </Form.Item>

                <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                  <Form.Item name="rememberMe" valuePropName="checked" noStyle initialValue={false}>
                    <Flex gap={8} align="center">
                      <Switch size="small" />
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('auth.rememberMe')}</Typography.Text>
                    </Flex>
                  </Form.Item>
                  <Link to={ROUTES.forgotPassword} style={{ fontSize: 13, fontWeight: 600 }}>
                    {t('auth.forgotPassword')}
                  </Link>
                </Flex>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={isBusy}
                  style={{ 
                    height: 52, 
                    borderRadius: 16, 
                    fontSize: 16, 
                    fontWeight: 700,
                    boxShadow: `0 8px 20px ${token.colorPrimary}40`
                  }}
                >
                  {t('auth.login')}
                </Button>
              </Form>

              <Divider plain><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('auth.orContinueWith')}</Typography.Text></Divider>

              <div ref={googleBtnRef} style={{ width: '100%', minHeight: 40 }} />
              {GOOGLE_OAUTH_CLIENT_ID && googleUnavailable ? (
                <Alert type="warning" showIcon message={t('auth.googleSignInLoadSlow')} />
              ) : null}

              {REGISTER_ENABLED ? (
                <div style={{ textAlign: 'center' }}>
                  <Typography.Text type="secondary">
                    {t('auth.dontHaveAccount')}{' '}
                    <Link to={ROUTES.register} style={{ fontWeight: 600 }}>
                      {t('auth.signUp')}
                    </Link>
                  </Typography.Text>
                </div>
              ) : null}
            </Flex>
          </div>
        </div>
      </Card>
    </div>
  );
}
