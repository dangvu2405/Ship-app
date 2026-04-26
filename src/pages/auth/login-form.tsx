import { useState, useEffect, useRef, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Button, Card, Divider, Flex, Input, Switch, Typography, theme } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { DEMO_PASSWORD, GOOGLE_OAUTH_CLIENT_ID, TEST_ACCOUNTS_ENABLED } from '@/utils/constants';

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

export function LoginForm({ className, ...props }: ComponentProps<'div'>) {
  const navigate = useNavigate();
  const { login, socialLogin } = useAuthStore();
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [testAccounts, setTestAccounts] = useState<{ role: string; role_display: string; email: string }[]>([]);

  const isBusy = isSubmitting;
  const socialBusy = isSubmitting || isSocialSubmitting;

  // Ref for the Google-rendered button container
  const googleBtnRef = useRef<HTMLDivElement>(null);
  // Stable ref so the renderButton effect runs only once without stale closures
  const googleCbRef = useRef<(r: GoogleCredentialResponse) => void>();

  const navigateAfterLogin = () => {
    const { currentTenantId } = useAuthStore.getState();
    navigate(currentTenantId ? ROUTES.dashboard : ROUTES.selectTenant);
  };

  // Always keep the callback ref up-to-date with latest state/closures
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

  // Load test accounts in dev
  useEffect(() => {
    if (!TEST_ACCOUNTS_ENABLED) return;
    api
      .get('/auth/test-accounts', { skipErrorToast: true, errorMode: 'silent' })
      .then((res) => { if (res.data?.success) setTestAccounts(res.data.data); })
      .catch(() => {});
  }, []);

  // Render the official Google Sign-In button once the GIS script is ready
  useEffect(() => {
    if (!GOOGLE_OAUTH_CLIENT_ID) return;

    const stableCallback = (r: GoogleCredentialResponse) => googleCbRef.current?.(r);

    const tryRender = () => {
      if (!googleBtnRef.current || !window.google?.accounts?.id) return false;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        callback: stableCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        logo_alignment: 'left',
        width: googleBtnRef.current.offsetWidth || 360,
      });
      return true;
    };

    if (!tryRender()) {
      const timer = setInterval(() => { if (tryRender()) clearInterval(timer); }, 100);
      return () => clearInterval(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isBusy) return;
    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
      navigateAfterLogin();
    } catch {
      toast.error(t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestLogin = async (accEmail: string) => {
    if (isBusy) return;
    try {
      setIsSubmitting(true);
      await login(accEmail, DEMO_PASSWORD);
      navigateAfterLogin();
    } catch {
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
                  <Typography.Title
                    level={4}
                    style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#1a1a1a', lineHeight: '28px' }}
                  >
                    {t('auth.welcomeBack')}
                  </Typography.Title>

                  <Flex vertical gap={20}>
                    <Flex vertical gap={16}>
                      <Flex vertical gap={8}>
                        <span style={labelStyle}>{t('auth.email')}</span>
                        <Input
                          id="email"
                          type="email"
                          size="large"
                          style={inputStyle}
                          placeholder={t('auth.emailPlaceholder')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </Flex>

                      <Flex vertical gap={8}>
                        <span style={labelStyle}>{t('auth.password')}</span>
                        <Input.Password
                          id="password"
                          size="large"
                          style={inputStyle}
                          placeholder={t('auth.registerPasswordPlaceholder')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </Flex>
                    </Flex>

                    <Flex justify="space-between" align="center">
                      <Flex gap={8} align="center">
                        <Switch size="small" checked={rememberMe} onChange={setRememberMe} />
                        <span style={{ fontSize: 12, color: '#1a1a1a', letterSpacing: '0.3px' }}>
                          {t('auth.rememberMe')}
                        </span>
                      </Flex>
                      <Link
                        to={ROUTES.forgotPassword}
                        style={{ fontSize: 12, color: '#007aff', letterSpacing: '0.3px' }}
                      >
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

                  {testAccounts.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {testAccounts.map((acc) => (
                        <Button
                          key={acc.role}
                          block
                          size="small"
                          disabled={isBusy || acc.email.startsWith('no-user')}
                          onClick={() => void handleTestLogin(acc.email)}
                        >
                          {acc.role_display.split(' - ')[0] || acc.role}
                        </Button>
                      ))}
                    </div>
                  )}

                  <Divider style={{ margin: 0, borderColor: '#e5e5e5' }} />

                  {/* Google Sign-In button rendered by GIS SDK */}
                  {GOOGLE_OAUTH_CLIENT_ID ? (
                    <div
                      ref={googleBtnRef}
                      style={{
                        width: '100%',
                        minHeight: 40,
                        pointerEvents: socialBusy ? 'none' : 'auto',
                        opacity: socialBusy ? 0.6 : 1,
                      }}
                    />
                  ) : null}

                  <div className="auth-screen__switch-auth">
                    {t('auth.dontHaveAccount')}{' '}
                    <Link to={ROUTES.register} className="auth-screen__link">
                      {t('auth.signUp')}
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
