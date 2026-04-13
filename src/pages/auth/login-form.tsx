import { useState, useEffect, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Button, Card, Col, Divider, Flex, Input, Row, Space, Typography, theme } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { TEST_ACCOUNTS_ENABLED } from '@/utils/constants';

export function LoginForm({ className, ...props }: ComponentProps<'div'>) {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testAccounts, setTestAccounts] = useState<{ role: string; role_display: string; email: string }[]>([]);
  const isBusy = isSubmitting;

  useEffect(() => {
    if (!TEST_ACCOUNTS_ENABLED) return;
    api
      .get('/auth/test-accounts', { skipErrorToast: true, errorMode: 'silent' })
      .then((res) => {
        if (res.data?.success) setTestAccounts(res.data.data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isBusy) return;
    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
      navigate(ROUTES.dashboard);
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
      await login(accEmail, 'password');
      navigate(ROUTES.dashboard);
    } catch {
      toast.error(t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnavailableAction = () => {
    toast(t('auth.featureUnavailable'), { icon: 'ℹ️' });
  };

  const socialBtn = (
    icon: ReactNode,
    label: string,
  ) => (
    <Button block size="large" onClick={handleUnavailableAction} aria-label={label}>
      {icon}
    </Button>
  );

  return (
    <div className={cn('min-h-screen flex items-center justify-center p-4', className)} style={{ background: token.colorFillAlter }} {...props}>
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
                        <Button type="link" size="small" onClick={handleUnavailableAction} style={{ padding: 0, height: 'auto' }}>
                          {t('auth.forgotPassword')}
                        </Button>
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
                  <Row gutter={16} style={{ width: '100%' }}>
                    <Col span={8}>
                      {socialBtn(
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20}>
                          <path
                            d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                            fill="currentColor"
                          />
                        </svg>,
                        t('auth.loginWithApple'),
                      )}
                    </Col>
                    <Col span={8}>
                      {socialBtn(
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20}>
                          <path
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                            fill="currentColor"
                          />
                        </svg>,
                        t('auth.loginWithGoogle'),
                      )}
                    </Col>
                    <Col span={8}>
                      {socialBtn(
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20}>
                          <path
                            d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                            fill="currentColor"
                          />
                        </svg>,
                        t('auth.loginWithMeta'),
                      )}
                    </Col>
                  </Row>

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
