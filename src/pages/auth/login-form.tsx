import { useState, useEffect, useMemo, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Button, Card, Col, Divider, Flex, Input, Row, Space, Typography, theme } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { DEMO_PASSWORD, GOOGLE_OAUTH_CLIENT_ID, TEST_ACCOUNTS_ENABLED } from '@/utils/constants';

export function LoginForm({ className, ...props }: ComponentProps<'div'>) {
  const navigate = useNavigate();
  const { login, socialLogin } = useAuthStore();
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testAccounts, setTestAccounts] = useState<{ role: string; role_display: string; email: string }[]>([]);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const isBusy = isSubmitting;
  const socialBusy = isSubmitting || isSocialSubmitting;
  const socialRedirectUri = useMemo(() => `${window.location.origin}${ROUTES.googleCallback}`, []);

  useEffect(() => {
    if (!TEST_ACCOUNTS_ENABLED) return;
    api
      .get('/auth/test-accounts', { skipErrorToast: true, errorMode: 'silent' })
      .then((res) => {
        if (res.data?.success) setTestAccounts(res.data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token') ?? undefined;
    const idToken = params.get('id_token') ?? undefined;
    const oauthState = params.get('state');
    const storedState = sessionStorage.getItem('google-oauth-state');

    if (!accessToken && !idToken) return;
    if (!oauthState || !storedState || oauthState !== storedState) {
      toast.error(t('auth.loginFailed'));
      window.history.replaceState(null, '', ROUTES.login);
      return;
    }

    sessionStorage.removeItem('google-oauth-state');
    window.history.replaceState(null, '', ROUTES.login);

    void (async () => {
      try {
        setIsSocialSubmitting(true);
        await socialLogin({
          provider: 'google',
          access_token: accessToken,
          id_token: idToken,
        });
        navigateAfterLogin();
      } catch {
        toast.error(t('auth.loginFailed'));
      } finally {
        setIsSocialSubmitting(false);
      }
    })();
  }, [navigate, socialLogin, t]);

  const navigateAfterLogin = () => {
    const { currentTenantId } = useAuthStore.getState();
    navigate(currentTenantId ? ROUTES.dashboard : ROUTES.selectTenant);
  };

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

  const handleUnavailableAction = () => {
    toast(t('auth.featureUnavailable'), { icon: 'ℹ️' });
  };

  const handleGoogleLogin = () => {
    if (socialBusy) return;
    if (!GOOGLE_OAUTH_CLIENT_ID) {
      toast.error(t('auth.googleOAuthNotConfigured'));
      return;
    }

    const state = crypto.randomUUID();
    sessionStorage.setItem('google-oauth-state', state);
    const params = new URLSearchParams({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      redirect_uri: socialRedirectUri,
      response_type: 'token id_token',
      scope: 'openid email profile',
      include_granted_scopes: 'true',
      prompt: 'select_account',
      nonce: state,
      state,
    });

    window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  };

  const socialBtn = (
    icon: ReactNode,
    label: string,
  ) => (
    <Button block size="large" onClick={handleGoogleLogin} aria-label={label} loading={socialBusy}>
      {icon}
    </Button>
  );

  return (
    <div className={cn('min-h-screen flex items-center justify-center p-4', className)} style={{ background: token.colorFillAlter }} {...props}>
      <div style={{ width: '100%', maxWidth: 896 }}>
        <Card variant="borderless" styles={{ body: { padding: 0 } }} style={{ overflow: 'hidden', boxShadow: token.boxShadowSecondary }}>
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
                      {t('auth.welcomeBack')}
                    </Typography.Title>
                    <Typography.Text type="secondary">{t('auth.loginToAccount')}</Typography.Text>
                  </div>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Typography.Text strong>{t('auth.email')}</Typography.Text>
                      <Input
                        id="email"
                        type="email"
                        size="large"
                        style={{ marginTop: 8 }}
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Flex justify="space-between" align="center">
                        <Typography.Text strong>{t('auth.password')}</Typography.Text>
                        <Link to={ROUTES.forgotPassword}>
                          <Button type="link" size="small" style={{ padding: 0, height: 'auto' }}>
                            {t('auth.forgotPassword')}
                          </Button>
                        </Link>
                      </Flex>
                      <Input.Password
                        id="password"
                        size="large"
                        style={{ marginTop: 8 }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="primary" htmlType="submit" block size="large" loading={isBusy}>
                      {t('auth.login')}
                    </Button>
                  </Space>

                  {testAccounts.length > 0 && (
                    <Row gutter={[8, 8]} style={{ width: '100%' }}>
                      {testAccounts.map((acc) => (
                        <Col span={12} key={acc.role}>
                          <Button
                            block
                            disabled={isBusy || acc.email.startsWith('no-user')}
                            onClick={() => void handleTestLogin(acc.email)}
                          >
                            {acc.role_display.split(' - ')[0] || acc.role}
                          </Button>
                        </Col>
                      ))}
                    </Row>
                  )}

                  <Divider plain>{t('auth.orContinueWith')}</Divider>
                    <Col span={24}>
                      {socialBtn(
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={200} height={20}>
                          <path
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                            fill="currentColor"
                          />
                        </svg>,
                        t('auth.loginWithGoogle'),
                      )}
                    </Col>
                  

                  <Typography.Text type="secondary">
                    {t('auth.dontHaveAccount')}{' '}
                    <Link to={ROUTES.register}>{t('auth.signUp')}</Link>
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
